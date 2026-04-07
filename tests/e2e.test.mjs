/**
 * E2E test suite for totem-playground.
 *
 * Entity / import / status tests run anywhere.
 * Lint and resilience tests require violation files to be visible in
 * the git diff — set TOTEM_E2E_LINT=1 when the git state is prepared
 * (CI does this automatically via setup-baseline.sh).
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync, unlinkSync, existsSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const RULES_FILE = '.totem/compiled-rules.json';
const MANIFEST_FILE = '.totem/compile-manifest.json';
const METRICS_FILE = '.totem/cache/rule-metrics.json';
const LINT_ENABLED = process.env.TOTEM_E2E_LINT === '1';
const LLM_ENABLED  = process.env.TOTEM_E2E_LLM  === '1';

/**
 * Run a totem CLI command.
 * Totem writes human-readable output to stderr and JSON to stdout.
 * Returns { stdout, stderr, output (merged), exitCode }.
 */
function totem(args) {
  const cmd = `npx @mmnto/cli ${args.join(' ')}`;
  try {
    const stdout = execSync(cmd, {
      encoding: 'utf8',
      timeout: 60_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', output: stdout, exitCode: 0 };
  } catch (e) {
    const stdout = e.stdout ?? '';
    const stderr = e.stderr ?? '';
    return {
      stdout,
      stderr,
      output: stdout + '\n' + stderr,
      exitCode: e.status ?? 1,
    };
  }
}

/**
 * Run a totem command and merge stdout+stderr for pattern matching.
 * Defaults to a 60s timeout; pass a larger `timeout` for LLM-gated
 * tests where an orchestrator round-trip alone can take 30–60s.
 */
function totemMerged(args, timeout = 60_000) {
  const cmd = `npx @mmnto/cli ${args.join(' ')} 2>&1`;
  try {
    const output = execSync(cmd, {
      encoding: 'utf8',
      timeout,
    });
    return { output, exitCode: 0 };
  } catch (e) {
    return { output: e.stdout ?? '', exitCode: e.status ?? 1 };
  }
}

/** Run a totem command with an extended 3-minute timeout for LLM round-trips. */
const totemMergedLong = (args) => totemMerged(args, 180_000);

// ─── Entity commands ────────────────────────────────────────────────

describe('totem rule list --json', () => {
  it('returns valid JSON with ≥22 rules', () => {
    const { stdout, exitCode } = totem(['rule', 'list', '--json']);
    assert.equal(exitCode, 0);
    const data = JSON.parse(stdout);
    assert.ok(Array.isArray(data.data.rules));
    assert.ok(data.data.rules.length >= 22,
      `Expected ≥22 rules, got ${data.data.rules.length}`);
  });

  it('each rule has required fields', () => {
    const { stdout } = totem(['rule', 'list', '--json']);
    const { data: { rules } } = JSON.parse(stdout);
    for (const r of rules) {
      assert.ok(r.hash,     `Missing hash on rule "${r.heading}"`);
      assert.ok(r.heading,  `Missing heading on rule ${r.hash}`);
      assert.ok(r.engine,   `Missing engine on rule ${r.hash}`);
      assert.ok(r.severity, `Missing severity on rule ${r.hash}`);
    }
  });
});

describe('totem status', () => {
  it('exits cleanly and reports expected fields', () => {
    const { output, exitCode } = totemMerged(['status']);
    assert.equal(exitCode, 0);
    assert.match(output, /Rules:/);
    assert.match(output, /Lessons:/);
    assert.match(output, /Manifest:/);
  });
});

describe('totem doctor', () => {
  it('passes all checks', () => {
    const { output, exitCode } = totemMerged(['doctor']);
    assert.equal(exitCode, 0);
    assert.match(output, /passed/);
    assert.doesNotMatch(output, /[1-9]\d* failure/);
  });
});

// ─── Adoption features ─────────────────────────────────────────────

describe('totem init --pilot', () => {
  const PILOT_STATE = '.totem/pilot-state.json';
  let hadPilotState = false;

  before(() => { hadPilotState = existsSync(PILOT_STATE); });
  after(() => {
    if (!hadPilotState && existsSync(PILOT_STATE)) {
      try { unlinkSync(PILOT_STATE); } catch {}
    }
  });

  it('creates pilot-state.json', () => {
    // init --pilot may exit 1 due to interactive readline in non-TTY,
    // but it still writes pilot-state.json before that point.
    totemMerged(['init', '--pilot']);
    assert.ok(existsSync(PILOT_STATE),
      'pilot-state.json should exist after init --pilot');
  });

  it('pilot-state.json tracks push count and violations', () => {
    const content = JSON.parse(readFileSync(PILOT_STATE, 'utf8'));
    assert.ok('startedAt' in content,  'should have startedAt');
    assert.ok('pushCount' in content,  'should have pushCount');
    assert.ok('violations' in content, 'should have violations');
  });
});

describe('totem hooks', () => {
  it('installs hooks non-interactively', () => {
    const { output, exitCode } = totemMerged(['hooks', '--force']);
    assert.equal(exitCode, 0);
    assert.match(output, /pre-commit/);
    assert.match(output, /pre-push/);
  });
});

describe('totem hooks --strict (isolated temp repo)', () => {
  let tempDir;

  before(() => {
    // Create an isolated repo so strict hooks never touch the user's
    // working tree.  If the process is killed mid-test the only
    // leftover is an orphan in the OS temp dir.
    tempDir = mkdtempSync(join(tmpdir(), 'totem-hooks-'));
    execSync('git init', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.email "test@totem.test"', { cwd: tempDir, stdio: 'ignore' });
    execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'ignore' });

    // Minimal Totem scaffold so `hooks` has something to work with
    writeFileSync(join(tempDir, 'totem.config.ts'),
      'export default { targets: [] };\n');
    mkdirSync(join(tempDir, '.totem'), { recursive: true });
    writeFileSync(join(tempDir, '.totem', 'compiled-rules.json'),
      JSON.stringify({ version: 1, rules: [], nonCompilable: [] }));
  });

  after(() => {
    try { rmSync(tempDir, { recursive: true, force: true }); } catch {}
  });

  it('installs strict hooks', () => {
    const output = execSync(
      'npx @mmnto/cli hooks --strict --force 2>&1',
      { cwd: tempDir, encoding: 'utf8', timeout: 30_000 },
    );
    assert.match(output, /pre-commit/);
    assert.match(output, /pre-push/);
  });

  it('strict hooks block a commit without spec', () => {
    writeFileSync(join(tempDir, 'dummy.txt'), 'hello');
    execSync('git add .', { cwd: tempDir, stdio: 'ignore' });

    try {
      execSync('git commit -m "should be blocked"', {
        cwd: tempDir,
        encoding: 'utf8',
        timeout: 30_000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      assert.fail('Commit should have been blocked by strict hooks');
    } catch (e) {
      const merged = (e.stdout ?? '') + '\n' + (e.stderr ?? '');
      assert.match(merged, /BLOCKED|strict/i,
        'Hook should mention strict-mode blocking');
    }
  });
});

// ─── Solo dev workflow ─────────────────────────────────────────────

describe('totem init --global', () => {
  it('exits cleanly and mentions global profile', () => {
    const { output, exitCode } = totemMerged(['init', '--global']);
    assert.ok(exitCode <= 1, `Expected exit ≤1, got ${exitCode}`);
    assert.match(output, /global.*profile|~\/\.totem/i,
      'Should mention global profile in output');
  });
});

describe('totem extract --local', () => {
  it('dry-run completes without writing lessons', () => {
    const lessonsBefore = readFileSync(RULES_FILE, 'utf8');

    const { output, exitCode } = totemMerged([
      'extract', '--local', '--dry-run',
    ]);
    assert.ok(exitCode <= 1, `Expected exit ≤1, got ${exitCode}`);
    assert.match(output, /dry run|extract|lesson/i,
      'Should mention extraction or dry run');

    const lessonsAfter = readFileSync(RULES_FILE, 'utf8');
    assert.equal(lessonsBefore, lessonsAfter,
      'compiled-rules.json should not change on dry-run');
  });
});

// ─── Import pipeline (P4) ──────────────────────────────────────────

describe('totem import --from-eslint', () => {
  const backup = RULES_FILE + '.e2e-bak';

  before(() => copyFileSync(RULES_FILE, backup));
  after(()  => { copyFileSync(backup, RULES_FILE); unlinkSync(backup); });

  it('dry-run previews importable rules without writing', () => {
    const contentBefore = readFileSync(RULES_FILE, 'utf8');
    const { output, exitCode } = totemMerged([
      'import', '--from-eslint', '.eslintrc.json', '--dry-run',
    ]);
    assert.equal(exitCode, 0);
    assert.match(output, /dry run/i);
    const contentAfter = readFileSync(RULES_FILE, 'utf8');
    assert.equal(contentBefore, contentAfter,
      'compiled-rules.json should not change on dry-run');
  });

  it('import mutates compiled-rules.json and increases rule count', () => {
    const beforeRules = JSON.parse(readFileSync(RULES_FILE, 'utf8'));
    const beforeCount = beforeRules.rules.length;

    const { output, exitCode } = totemMerged([
      'import', '--from-eslint', '.eslintrc.json',
    ]);
    assert.equal(exitCode, 0);
    assert.match(output, /imported/i);

    const afterRules = JSON.parse(readFileSync(RULES_FILE, 'utf8'));
    assert.ok(afterRules.rules.length > beforeCount,
      `Expected rules to increase: ${afterRules.rules.length} > ${beforeCount}`);
  });
});

// ─── Lint enforcement ───────────────────────────────────────────────
// These tests only run when TOTEM_E2E_LINT=1 (requires staged violation
// files visible in git diff — see setup-baseline.sh or Dockerfile).

describe('totem lint', { skip: !LINT_ENABLED && 'TOTEM_E2E_LINT not set' }, () => {
  let lintOutput = '';
  let lintExit   = 0;

  before(() => {
    const r = totemMerged(['lint']);
    lintOutput = r.output;
    lintExit   = r.exitCode;
  });

  it('exits with code 1 (violations found)', () => {
    assert.equal(lintExit, 1);
  });

  it('detects process.env access', () => {
    assert.match(lintOutput, /process\.env/);
  });

  it('detects empty catch blocks', () => {
    assert.match(lintOutput, /catch/i);
  });

  it('detects raw throw new Error()', () => {
    assert.match(lintOutput, /Error/);
  });

  it('detects console.log in API routes', () => {
    assert.match(lintOutput, /console/i);
  });

  it('detects SQL string concatenation', () => {
    assert.match(lintOutput, /SQL/i);
  });

  it('reports ≥14 total violations', () => {
    const m = lintOutput.match(/(\d+) warning/);
    const total = m ? parseInt(m[1], 10) : 0;
    assert.ok(total >= 14, `Expected ≥14 violations, got ${total}`);
  });

  it('includes file:line format in output', () => {
    assert.match(lintOutput, /src\/.*\.ts:\d+/);
  });
});

// ─── Resilience scenarios ───────────────────────────────────────────

describe('Resilience: ghost AST rule', { skip: !LINT_ENABLED && 'TOTEM_E2E_LINT not set' }, () => {
  const backup = RULES_FILE + '.e2e-bak';

  before(() => {
    copyFileSync(RULES_FILE, backup);
    const data = JSON.parse(readFileSync(RULES_FILE, 'utf8'));
    data.rules.unshift({
      lessonHash: 'test-ghost-001',
      lessonHeading: 'Ghost rule',
      pattern: '',
      message: 'Ghost node test',
      engine: 'ast',
      astQuery: '(nonexistent_phantom_node_type) @violation',
      compiledAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      fileGlobs: ['src/**/*.ts'],
      severity: 'error',
    });
    writeFileSync(RULES_FILE, JSON.stringify(data, null, 2));
  });

  after(() => { copyFileSync(backup, RULES_FILE); unlinkSync(backup); });

  it('lint does not crash and warns about invalid node', () => {
    const { output, exitCode } = totemMerged(['lint']);
    assert.ok(exitCode <= 1, `Expected exit ≤1, got ${exitCode}`);
    assert.match(output, /nonexistent_phantom_node_type|bad node|skipped/i,
      'Should warn about the invalid AST node type');
  });
});

describe('Resilience: overly broad regex', { skip: !LINT_ENABLED && 'TOTEM_E2E_LINT not set' }, () => {
  const backup = RULES_FILE + '.e2e-bak';

  before(() => {
    copyFileSync(RULES_FILE, backup);
    const data = JSON.parse(readFileSync(RULES_FILE, 'utf8'));
    data.rules.unshift({
      lessonHash: 'test-broad-001',
      lessonHeading: 'Broad rule',
      pattern: '[a-zA-Z]',
      message: 'BROAD TEST',
      engine: 'regex',
      compiledAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z',
      fileGlobs: ['src/**/*.ts'],
      severity: 'warning',
    });
    writeFileSync(RULES_FILE, JSON.stringify(data, null, 2));
  });

  after(() => { copyFileSync(backup, RULES_FILE); unlinkSync(backup); });

  it('lint completes without crashing', () => {
    const { exitCode } = totemMerged(['lint']);
    assert.ok(exitCode <= 1, `Expected exit ≤1, got ${exitCode}`);
  });

  it('broad rule hits are bounded by diff-scoping', () => {
    const { output } = totemMerged(['lint']);
    const hits = (output.match(/BROAD TEST/g) || []).length;
    assert.ok(hits > 0,   'Expected some broad-rule hits');
    assert.ok(hits <= 100, `Expected ≤100 hits (diff-scoped), got ${hits}`);
  });
});

describe('Resilience: corrupt exemptions.json', { skip: !LINT_ENABLED && 'TOTEM_E2E_LINT not set' }, () => {
  const EXEMPTIONS = '.totem/exemptions.json';
  const backup = EXEMPTIONS + '.e2e-bak';
  let hadOriginal = false;

  before(() => {
    hadOriginal = existsSync(EXEMPTIONS);
    if (hadOriginal) copyFileSync(EXEMPTIONS, backup);
    writeFileSync(EXEMPTIONS, '{ this is not valid json!!!');
  });
  after(() => {
    if (hadOriginal) {
      copyFileSync(backup, EXEMPTIONS);
      try { unlinkSync(backup); } catch {}
    } else {
      try { unlinkSync(EXEMPTIONS); } catch {}
    }
  });

  it('lint completes and warns about malformed exemptions', () => {
    const { output, exitCode } = totemMerged(['lint']);
    assert.ok(exitCode <= 1, `Expected exit ≤1, got ${exitCode}`);
    assert.match(output, /exemptions|malformed|invalid|parse/i,
      'Should warn about corrupt exemptions file');
  });
});

// ─── Refinement Engine (1.13.0) ────────────────────────────────────
// These tests exercise the surfaces introduced in 1.13.0:
//   • `totem doctor` upgrade-candidate detection (zero-LLM diagnostic)
//   • `totem lesson compile --upgrade <hash>` (LLM-gated, mutates)
//   • `.totem/cache/rule-metrics.json` shape invariants
//
// runSelfHealing (`totem doctor --pr`) is intentionally NOT tested here.
// It's too integrated to mock cleanly without a throwaway git repo, a
// stubbed `gh` binary, and a fresh LanceDB — which is deep-integration
// territory, not the surface-level smoke this harness is built for.
// Tracked as a follow-up in issue #27's comments.

/** Locate the seeded noisy TODO rule created by #25 (`lesson-pg-007.md`). */
function findPg7Rule() {
  const data = JSON.parse(readFileSync(RULES_FILE, 'utf8'));
  return data.rules.find(
    (r) => r.lessonHeading === 'Mark of incomplete work in source files',
  );
}

describe('totem doctor upgrade candidate detection', () => {
  const metricsBak = METRICS_FILE + '.e2e-bak';
  let hadMetrics = false;
  let pg7Hash;

  before(() => {
    const pg7 = findPg7Rule();
    assert.ok(pg7,
      'pg-007 "Mark of incomplete work in source files" rule must exist in compiled-rules.json (seeded by #25)');
    pg7Hash = pg7.lessonHash;

    // Back up real metrics so we don't clobber local dev state
    hadMetrics = existsSync(METRICS_FILE);
    if (hadMetrics) copyFileSync(METRICS_FILE, metricsBak);

    // Ensure the cache dir exists (fresh clones don't have it)
    mkdirSync('.totem/cache', { recursive: true });

    // Seed synthetic telemetry that would trigger the upgrade threshold.
    // 10 matches across the 5 buckets, 9/10 in non-code contexts = 90%,
    // well above doctor's NON_CODE_THRESHOLD of 0.2.
    const seeded = {
      version: 1,
      rules: {
        [pg7Hash]: {
          triggerCount: 10,
          suppressCount: 0,
          lastTriggeredAt: new Date().toISOString(),
          lastSuppressedAt: null,
          contextCounts: { code: 1, string: 4, comment: 5, regex: 0, unknown: 0 },
        },
      },
    };
    writeFileSync(METRICS_FILE, JSON.stringify(seeded, null, 2));
  });

  after(() => {
    // Defensive restore: only touch the backup if it actually exists.
    // If `before()` threw before the backup was taken (e.g. pg-007 is
    // missing), metricsBak won't exist and a naïve copyFileSync would
    // ENOENT during cleanup.
    if (hadMetrics) {
      if (existsSync(metricsBak)) {
        copyFileSync(metricsBak, METRICS_FILE);
        try { unlinkSync(metricsBak); } catch {}
      }
    } else {
      try { unlinkSync(METRICS_FILE); } catch {}
    }
  });

  it('finds the pg-007 seeded rule in compiled-rules.json', () => {
    // Sanity check on the hash shape — the existence check lives in before()
    assert.match(pg7Hash, /^[a-f0-9]{16}$/, 'lessonHash should be 16 hex chars');
  });

  it('flags pg-007 as an upgrade candidate', () => {
    const { output, exitCode } = totemMerged(['doctor']);
    // Doctor exits 0 when all checks pass or only emits warnings;
    // upgrade candidates count as warnings, not failures.
    assert.ok(exitCode <= 1, `Expected exit ≤1, got ${exitCode}`);
    assert.match(output, /Upgrade Candidates/i,
      'doctor output should mention Upgrade Candidates');
    assert.ok(output.includes(pg7Hash),
      `doctor output should include pg-007 hash ${pg7Hash}`);
  });

  it('reports a non-code ratio above 20%', () => {
    const { output } = totemMerged(['doctor']);
    // Pull the nearest "N% non-code" figure attached to pg-007's line.
    // Doctor prints the hash followed by "(engine, NN% non-code, NN matches)",
    // so the hash and the percentage are separated by a comma — the pattern
    // allows any non-newline characters between them.
    const pattern = new RegExp(`${pg7Hash}[^\\n]*?(\\d+)% non-code`);
    const m = output.match(pattern);
    assert.ok(m, `Could not find non-code percentage for ${pg7Hash} in:\n${output}`);
    const pct = parseInt(m[1], 10);
    assert.ok(pct > 20, `Expected non-code ratio > 20%, got ${pct}%`);
    // With our seeded data (9 non-code out of 10) expect ~90%. Use a
    // range check rather than exact equality so the test isn't coupled
    // to doctor's rounding rule (floor vs round vs banker's round).
    assert.ok(pct >= 85 && pct <= 95,
      `Expected seeded ratio ~90% (85–95), got ${pct}%`);
  });

  it('prints the --upgrade remediation hint', () => {
    const { output } = totemMerged(['doctor']);
    assert.match(output, /totem compile --upgrade/,
      'doctor should suggest the --upgrade command');
  });
});

describe('totem lesson compile --upgrade', {
  skip: !LLM_ENABLED && 'TOTEM_E2E_LLM not set',
}, () => {
  const rulesBak    = RULES_FILE    + '.e2e-bak';
  const manifestBak = MANIFEST_FILE + '.e2e-bak';
  const metricsBak  = METRICS_FILE  + '.e2e-bak';
  let hadMetrics = false;
  let backupsCreated = false;
  let pg7Hash;
  let upgradeResult;

  before(() => {
    const pg7 = findPg7Rule();
    assert.ok(pg7,
      'pg-007 "Mark of incomplete work in source files" rule must exist in compiled-rules.json (seeded by #25)');
    pg7Hash = pg7.lessonHash;

    copyFileSync(RULES_FILE,    rulesBak);
    copyFileSync(MANIFEST_FILE, manifestBak);
    hadMetrics = existsSync(METRICS_FILE);
    if (hadMetrics) copyFileSync(METRICS_FILE, metricsBak);
    backupsCreated = true;

    mkdirSync('.totem/cache', { recursive: true });
    const seeded = {
      version: 1,
      rules: {
        [pg7Hash]: {
          triggerCount: 10,
          suppressCount: 0,
          lastTriggeredAt: new Date().toISOString(),
          lastSuppressedAt: null,
          contextCounts: { code: 1, string: 4, comment: 5, regex: 0, unknown: 0 },
        },
      },
    };
    writeFileSync(METRICS_FILE, JSON.stringify(seeded, null, 2));

    // Run the upgrade once and share the output across assertions
    upgradeResult = totemMergedLong([
      'lesson', 'compile', '--upgrade', pg7Hash,
    ]);
  });

  after(() => {
    // Only attempt to restore from backups that were actually created.
    // If `before()` failed mid-setup (e.g. the assert.ok above threw
    // before any copyFileSync ran), the .e2e-bak files don't exist
    // and naïve restore would ENOENT and leave the filesystem in a
    // dirty state.
    if (!backupsCreated) return;

    if (existsSync(rulesBak)) {
      copyFileSync(rulesBak, RULES_FILE);
      try { unlinkSync(rulesBak); } catch {}
    }
    if (existsSync(manifestBak)) {
      copyFileSync(manifestBak, MANIFEST_FILE);
      try { unlinkSync(manifestBak); } catch {}
    }
    if (hadMetrics) {
      if (existsSync(metricsBak)) {
        copyFileSync(metricsBak, METRICS_FILE);
        try { unlinkSync(metricsBak); } catch {}
      }
    } else {
      try { unlinkSync(METRICS_FILE); } catch {}
    }
  });

  it('exits 0 and targets the flagged rule', () => {
    assert.equal(upgradeResult.exitCode, 0,
      `--upgrade should exit 0, got ${upgradeResult.exitCode}:\n${upgradeResult.output}`);
    assert.match(upgradeResult.output, /--upgrade.*targeting/i,
      'output should announce the --upgrade target');
    assert.ok(upgradeResult.output.includes(pg7Hash),
      `output should mention pg-007 hash ${pg7Hash}`);
  });

  it('produces a recognisable compile status', () => {
    // Sonnet's outcome is one of: Compiled (narrower or same), skipped
    // (no-op / non-compilable), or failed. All three are valid engine
    // responses — the shape is what we're validating.
    assert.match(upgradeResult.output,
      /Compiled|skipped|failed|noop|replaced/i,
      'upgrade output should include a recognised status keyword');
  });

  it('refreshes compile-manifest.json', () => {
    const before = JSON.parse(readFileSync(manifestBak,    'utf8'));
    const after  = JSON.parse(readFileSync(MANIFEST_FILE,  'utf8'));
    // Totem rewrites the manifest on every compile ATTEMPT, not just on
    // success — so even when Sonnet's response is unparseable and no rule
    // actually changes, compile_at here will tick forward.
    assert.notEqual(after.compiled_at, before.compiled_at,
      'manifest compiled_at should update after --upgrade attempt');
    assert.equal(after.model, 'claude-sonnet-4-6',
      'manifest should record the compile model');
  });

  it('preserves the pg-007 rule entry in compiled-rules.json', () => {
    // Intentionally NOT asserting that pg-007's compiledAt refreshes here:
    // `--upgrade` is one of three outcomes depending on Sonnet's response
    // (compiled / skipped / failed), and only `compiled` updates the rule.
    // The LLM round-trip is flaky in practice (Sonnet has intermittently
    // returned unparseable JSON for this lesson), so we assert only the
    // invariants that MUST hold regardless of upgrade outcome: the rule
    // still exists, its schema is intact, and the total rule count is
    // preserved (no accidental additions or removals).
    const before = JSON.parse(readFileSync(rulesBak,   'utf8'));
    const after  = JSON.parse(readFileSync(RULES_FILE, 'utf8'));
    const afterRule  = after.rules.find((r) => r.lessonHash === pg7Hash);
    assert.ok(afterRule, 'pg-007 rule should still exist post-upgrade');
    assert.equal(typeof afterRule.pattern,   'string',  'pattern should remain a string');
    assert.equal(typeof afterRule.message,   'string',  'message should remain a string');
    assert.equal(typeof afterRule.engine,    'string',  'engine should remain a string');
    assert.equal(typeof afterRule.severity,  'string',  'severity should remain a string');
    assert.equal(after.rules.length, before.rules.length,
      'upgrade should not add or remove rules');
  });
});

describe('.totem/cache/rule-metrics.json shape', () => {
  it('has a valid schema if present', (t) => {
    if (!existsSync(METRICS_FILE)) {
      // Fresh clones don't have this file until lint has run at least
      // once. That's expected — skip rather than fail.
      t.skip('metrics file not present (run totem lint first to seed it)');
      return;
    }

    const metrics = JSON.parse(readFileSync(METRICS_FILE, 'utf8'));
    assert.equal(typeof metrics.version, 'number',
      'top-level version should be a number');
    assert.ok(metrics.version >= 1, 'metrics version should be >= 1');
    assert.ok(
      metrics.rules && typeof metrics.rules === 'object' && !Array.isArray(metrics.rules),
      'metrics.rules should be a plain object keyed by lessonHash',
    );

    for (const [hash, rule] of Object.entries(metrics.rules)) {
      assert.match(hash, /^[a-f0-9]{16}$/,
        `metrics key "${hash}" should be a 16-char hex lessonHash`);

      assert.equal(typeof rule.triggerCount, 'number',
        `triggerCount should be a number for ${hash}`);
      assert.ok(rule.triggerCount >= 0,
        `triggerCount should be >= 0 for ${hash} (got ${rule.triggerCount})`);

      assert.equal(typeof rule.suppressCount, 'number',
        `suppressCount should be a number for ${hash}`);
      assert.ok(rule.suppressCount >= 0,
        `suppressCount should be >= 0 for ${hash} (got ${rule.suppressCount})`);

      if (rule.contextCounts) {
        for (const bucket of ['code', 'string', 'comment', 'regex', 'unknown']) {
          const v = rule.contextCounts[bucket];
          assert.equal(typeof v, 'number',
            `contextCounts.${bucket} should be a number for ${hash}`);
          assert.ok(v >= 0,
            `contextCounts.${bucket} should be >= 0 for ${hash} (got ${v})`);
        }
        // Semantic invariant: triggerCount is the rolled-up total, so
        // it must be at least as large as any single-context bucket.
        assert.ok(rule.triggerCount >= rule.contextCounts.code,
          `triggerCount (${rule.triggerCount}) should be >= contextCounts.code (${rule.contextCounts.code}) for ${hash}`);
      }
    }
  });
});

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
const LINT_ENABLED = process.env.TOTEM_E2E_LINT === '1';

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

/** Run a totem command and merge stdout+stderr for pattern matching. */
function totemMerged(args) {
  const cmd = `npx @mmnto/cli ${args.join(' ')} 2>&1`;
  try {
    const output = execSync(cmd, {
      encoding: 'utf8',
      timeout: 60_000,
    });
    return { output, exitCode: 0 };
  } catch (e) {
    return { output: e.stdout ?? '', exitCode: e.status ?? 1 };
  }
}

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
  after(() => {
    // Always restore standard hooks so a test run (or Ctrl+C) never
    // leaves the developer's local env in strict mode.
    totemMerged(['hooks', '--standard', '--force']);
  });

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
    assert.match(output, /global|\.totem/i,
      'Should mention global profile in output');
  });
});

describe('totem extract --local', () => {
  it('dry-run completes without writing lessons', () => {
    const { output, exitCode } = totemMerged([
      'extract', '--local', '--dry-run',
    ]);
    assert.ok(exitCode <= 1, `Expected exit ≤1, got ${exitCode}`);
    assert.match(output, /dry run|extract|lesson/i,
      'Should mention extraction or dry run');
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

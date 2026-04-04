# Totem Playground

A broken Next.js app with 5 intentional architectural violations. [Totem](https://github.com/mmnto-ai/totem) catches all of them — and now you can create your own rules too.

## Try It In Your Browser

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/mmnto-ai/totem-playground)

When the terminal opens, run:

```bash
totem lint --staged
```

### Or run locally

```bash
git clone https://github.com/mmnto-ai/totem-playground.git
cd totem-playground
npx @mmnto/cli lint
```

No API keys needed. No config. Just clone and lint.

## The 5 Violations

| # | Violation | Where | Why it matters |
|---|-----------|-------|----------------|
| 1 | Direct `process.env` access | API routes, middleware, db.ts | Missing env vars crash at runtime instead of startup |
| 2 | Empty `catch(e) {}` blocks | users/route.ts, auth.ts | Errors vanish silently — impossible to debug |
| 3 | Raw `throw new Error()` | auth/route.ts, auth.ts | No error classification, no recovery hints |
| 4 | `console.log` in API routes | users/route.ts | Loses context in production, no request IDs |
| 5 | SQL string concatenation | users/route.ts, db.ts | SQL injection — the oldest vulnerability in the book |

## Pipeline Engine: Create Rules, Not Just Enforce Them

The **Pipeline Engine** provides 5 pipelines for turning governance knowledge into compiled rules. This playground demos the zero-LLM import pipeline (P4) and walks through the manual authoring pipeline (P1, which requires an LLM key for the compile step):

### P4 — Import from ESLint

Already have ESLint rules? Import them directly:

```bash
# Preview what will be imported
totem import --from-eslint .eslintrc.json --dry-run

# Import for real
totem import --from-eslint .eslintrc.json

# See the new rules alongside existing ones
totem rule list
```

The included `.eslintrc.json` has 4 importable rules (restricted globals, restricted imports) and 1 that gets skipped with an explanation (AST-based `no-eval` can't be converted to regex). This is intentional — Totem is honest about what it can and can't import.

### P1 — Manual Rule Authoring

Write a lesson in Markdown, compile it into a rule, then test-drive it:

```bash
# 1. Add a lesson to project memory
totem lesson add "Never leave TODO comments in production code. \
  Resolve them before merging to main — they indicate unfinished work \
  that will be forgotten."

# 2. Compile lessons into enforceable rules (requires LLM API key)
totem lesson compile

# 3. Scaffold a test fixture for the new rule and iterate
totem rule scaffold <hash>
totem test --filter <hash>
```

The authoring surface is markdown lessons, not compiled JSON — `lesson compile` handles the translation. You can inspect any existing rule's source lesson with `totem rule inspect <hash>`.

### Other Pipelines (P2, P3, P5)

Three more pipelines exist:

| Pipeline | What it does | Requires |
|----------|-------------|----------|
| P2 — Review-to-Rule | Extracts rules from AI code review comments | LLM API key |
| P3 — Lesson Compile | Compiles lesson narratives into enforceable rules | LLM API key (also used by P1's compile step) |
| P5 — Observation | Auto-captures findings from review into reusable lessons | Zero-LLM at capture; LLM only if the review itself uses one |

Set `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY` in your environment to try P1 compile, P2, or P3. See the [main Totem docs](https://github.com/mmnto-ai/totem) for details.

## Pilot Mode: Gradual Adoption

Totem 1.10 introduces **pilot mode** — a warn-only enforcement tier that lets teams try governance without blocking commits. After a configurable threshold of clean runs, the project graduates to full enforcement automatically.

```bash
# Initialize with pilot enforcement (warn-only, no blocking)
totem init --pilot

# Inspect the created state file
cat .totem/pilot-state.json
# → { "startedAt": "...", "pushCount": 0, "violations": [] }

# Lint runs but violations warn instead of failing
totem lint

# Hooks warn instead of blocking — no surprises during adoption
totem hooks --force
```

`pilot-state.json` tracks push counts and violation history. Once the threshold is met (default: 14 days or 50 pushes), Totem graduates the project to full enforcement. Check progress with `totem status`.

## Enforcement Tiers

Totem supports tiered enforcement. The `--strict` flag installs hooks at the highest tier, adding spec-completion checks alongside lint:

```bash
# Install hooks with strict enforcement (spec-required + shield gate)
totem hooks --strict --force

# Standard tier (default) — lint enforcement only
totem hooks --standard --force

# Check current tier and hook status
totem describe
```

### Agent Auto-Detection

When running inside an AI coding agent, Totem auto-detects the environment via variables like `CLAUDE_CODE=1`. The `init` command reports detected tools:

```bash
totem init --pilot
# → Detected AI tools: Claude Code, Gemini CLI
```

Agent-authored commits receive stricter scrutiny under the strict tier — the same rules, applied with spec-completion gates.

## Solo Dev Workflow

Totem is not just for teams. The `--global` and `--local` flags let individual developers build a personal governance baseline that follows them across projects.

### Set Up a Global Profile

```bash
# Scaffold a personal baseline at ~/.totem/
totem init --global
# → Global profile created at ~/.totem
# → 23 universal baseline rules installed.

# Your global lessons and rules live in ~/.totem/
ls ~/.totem/
```

Global config acts as a fallback — any project without its own `.totem/` directory inherits your personal standards.

### Extract Lessons from Local Work

No PR needed. `extract --local` examines your working tree and synthesizes lessons from staged diffs, unstaged edits, and unpushed commits:

```bash
# Pull lessons from local changes (requires LLM API key)
totem extract --local

# Preview without writing
totem extract --local --dry-run

# See what was captured
totem lesson list
```

### Global Fallback

When you run `totem lint` in a project without a `.totem/` directory, Totem falls back to your global profile at `~/.totem/`:

```bash
cd ~/some-random-project
totem lint    # uses ~/.totem/ rules and lessons
```

Every repo you touch gets at least your personal governance baseline, even before you run `totem init`.

## Explore with the CLI

Commands are grouped: **Core** (`lint`, `review`, `check`, `spec`), **Entities** (`rule`, `lesson`, `exemption`, `config`), **Workflow** (`wrap`, `triage`, `triage-pr`), and **Setup** (`init`, `sync`, `hooks`, `doctor`, `status`). Run `totem --help` to see the full map.

```bash
totem rule list            # show all compiled rules
totem rule list --json     # machine-readable output (pipe to jq)
totem status               # project health at a glance
totem doctor               # full workspace diagnostics
totem describe             # governance scope: rules, lessons, tier, targets
totem lint                 # run enforcement (zero LLM)
```

### Scriptable API

Every entity command accepts `--json` for machine-readable output:

```bash
totem rule list --json | jq '.data.rules | length'
totem rule inspect <hash>           # deep-dive on a single rule
```

## Resilience Tests

This repository also serves as the validation harness for Totem's runtime resilience. It documents how the system behaves under adversarial or corrupted states:

- **Ghost AST Rules:** If a compiled rule contains a Tree-sitter node type that does not exist, the lint engine warns and skips the rule; the process does not crash.
- **Overly Broad Regex:** If a rule compiles into an unbounded regex, the impact is isolated to the changed lines only (via git diff-scoping), preventing full-file false positives.
- **Corrupt Exemption State:** If the `.totem/exemptions.json` ledger is malformed, the engine emits a warning and treats the file as empty — enforcement continues without exemptions, making the system stricter rather than permissive.
- **Stale Vector Context:** If the LanceDB vector index contains outdated lessons, it does not impact enforcement; `totem lint` strictly evaluates against `compiled-rules.json`.

## Fix Them

Fix the violations, run `totem lint` again, and watch it pass.

Or better: point your AI agent at this repo and tell it to fix everything. See how many push-reject cycles it takes.

## What This Tests

This repo validates that Totem's governance compiler works on a real-world project — not just on itself. It's also our permanent regression test for future Totem releases.

---

Built with [Totem](https://github.com/mmnto-ai/totem) — the persistent memory layer for AI coding agents.

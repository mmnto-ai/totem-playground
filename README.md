# Totem Playground

A broken Next.js app with 5 intentional architectural violations. [Totem](https://github.com/mmnto-ai/totem) catches all of them.

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

### Explore with the noun-verb CLI (v1.7.0)

Commands are now grouped: **Core** (`lint`, `review`, `check`), **Entities** (`rule`, `lesson`, `exemption`), **Workflow** (`wrap`, `triage`), and **Setup** (`init`, `sync`, `hooks`). Run `totem --help` to see the full map.

```bash
totem rule list            # show all compiled rules
totem lesson list          # show indexed lessons
totem status               # project health at a glance
```

### Scriptable API

Every entity command accepts `--json` for machine-readable output:

```bash
totem rule list --json | jq '.data.rules[0].severity'
```

## The 5 Violations

| # | Violation | Where | Why it matters |
|---|-----------|-------|----------------|
| 1 | Direct `process.env` access | API routes, middleware, db.ts | Missing env vars crash at runtime instead of startup |
| 2 | Empty `catch(e) {}` blocks | users/route.ts, auth.ts | Errors vanish silently — impossible to debug |
| 3 | Raw `throw new Error()` | auth/route.ts, auth.ts | No error classification, no recovery hints |
| 4 | `console.log` in API routes | users/route.ts | Loses context in production, no request IDs |   
| 5 | SQL string concatenation | users/route.ts, db.ts | SQL injection — the oldest vulnerability in the book |

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
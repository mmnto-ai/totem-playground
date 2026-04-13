# Architecture Context

## Repo Purpose

totem-playground is a broken Next.js app with 5 intentional architectural violations. It serves two purposes:

1. **Demo surface** — "Try Totem in your browser" via GitHub Codespaces
2. **Regression test suite** — permanent validation harness for totem releases

## Repo Structure

```
src/
  app/
    api/users/route.ts    # Violations: process.env, empty catch, console.log, SQL concat
    api/auth/route.ts     # Violations: raw throw
    page.tsx              # Clean
    layout.tsx            # Clean
  lib/
    db.ts                 # Violations: process.env, SQL concat
    todo-fixtures.ts      # Intentional TODO fixtures for Refinement Engine demo
  middleware/
    auth.ts               # Violations: empty catch, raw throw, process.env
.totem/
  compiled-rules.json     # 40 compiled governance rules
  lessons/                # 7 lesson files (pg-001 through pg-007)
  compile-manifest.json   # Compilation state
  cache/                  # Rule metrics, sync state
tests/
  e2e.test.mjs            # E2E test suite
  setup-baseline.sh       # CI baseline creation (destructive)
.devcontainer/
  devcontainer.json       # Codespace demo setup
```

## Demo Mechanism

The Codespace demo works via an orphan baseline in `postCreateCommand`:

1. `sudo corepack enable && pnpm install` — install deps
2. `git checkout --orphan demo` — create branch with no history
3. `git add . && git reset src/app/api/ src/lib/ src/middleware/` — commit clean files only
4. `git commit -m baseline` — create baseline commit
5. `git add src/app/api/ src/lib/ src/middleware/` — stage violation files

This makes `totem lint --staged` see the violation files as new staged additions.

## Rule Engines

- `regex` — pattern matching (majority of rules)
- `ast` — Tree-sitter S-expressions
- `ast-grep` — structural patterns with YAML configs

## Key Lessons

- **pg-001 through pg-006**: Cover the 5 core violations (env access, empty catch, raw throw, console.log, SQL concat, explicit any)
- **pg-007**: Intentionally broad TODO marker rule — designed for the Refinement Engine `--upgrade` demo

## Cross-Repo Context

- **totem** — the main totem monorepo (sibling directory)
- **totem-strategy** — governance, ADRs, journal entries (sibling directory)
- Journal entries for this repo live in `totem-strategy/.journal/totem-playground/`

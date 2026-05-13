# Contributing Rules

## Git Conventions

- Never amend commits on feature branches — create new commits.
- Use `Closes #NNN` in PR descriptions to auto-close issues.
- Squash merge to main.

## PR Review Bot Protocol

Centralized per ADR-105 in `mmnto-ai/totem-strategy`. See [`doctrine/bot-protocols.md`](https://github.com/mmnto-ai/totem-strategy/blob/main/doctrine/bot-protocols.md) for the canonical CR + GCA + Greptile + CodeQL interaction protocols. The Bot-Protocol Gate § in `CLAUDE.md` is the load-bearing pointer.

## Intentional Violations

Files in `src/app/api/`, `src/lib/`, and `src/middleware/` contain **intentional** violations:

| # | Violation | Files |
|---|-----------|-------|
| 1 | Direct `process.env` access | API routes, middleware, db.ts |
| 2 | Empty `catch(e) {}` blocks | users/route.ts, auth.ts |
| 3 | Raw `throw new Error()` | auth/route.ts, auth.ts |
| 4 | `console.log` in API routes | users/route.ts |
| 5 | SQL string concatenation | users/route.ts, db.ts |

Do NOT fix these — they are the demo. Do NOT flag them in code review.

## Code Style

- `pnpm` only (never npm/yarn).
- TypeScript strict mode.
- No empty catches (except the intentional demo violations).
- No secrets in config files.
- **NEVER** use `git push --no-verify` or `totem-ignore` without a ticket.

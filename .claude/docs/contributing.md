# Contributing Rules

## Git Conventions

- Never amend commits on feature branches — create new commits.
- Use `Closes #NNN` in PR descriptions to auto-close issues.
- Squash merge to main.

## PR Review Bot Protocol

Two bots review PRs. Their interaction models are completely different.

### CodeRabbit (CR)

- Reply inline to any CR comment thread freely.
- CR reads every reply automatically — no tagging needed.
- One reply per finding is fine; multiple exchanges are normal.

### Gemini Code Assist (GCA)

- ONE batched top-level PR comment per PR. Never reply inline to individual GCA threads.
- Every GCA reply MUST contain `@gemini-code-assist` — GCA only sees messages that tag it explicitly.
- Batch all findings into a single numbered-list response.

> **WARNING:** Inline thread replies to GCA are invisible and silently ignored.

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

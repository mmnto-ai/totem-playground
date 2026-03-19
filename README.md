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

## The 5 Violations

| # | Violation | Where | Why it matters |
|---|-----------|-------|----------------|
| 1 | Direct `process.env` access | API routes, middleware, db.ts | Missing env vars crash at runtime instead of startup |
| 2 | Empty `catch(e) {}` blocks | users/route.ts, auth.ts | Errors vanish silently — impossible to debug |
| 3 | Raw `throw new Error()` | auth/route.ts, auth.ts | No error classification, no recovery hints |
| 4 | `console.log` in API routes | users/route.ts | Loses context in production, no request IDs |
| 5 | SQL string concatenation | users/route.ts, db.ts | SQL injection — the oldest vulnerability in the book |

## Fix Them

Fix the violations, run `npx @mmnto/cli lint` again, and watch it pass.

Or better: point your AI agent at this repo and tell it to fix everything. See how many push-reject cycles it takes.

## What This Tests

This repo validates that Totem's governance compiler works on a real-world project — not just on itself. It's also our permanent regression test for future Totem releases.

---

Built with [Totem](https://github.com/mmnto-ai/totem) — the persistent memory layer for AI coding agents.

# Totem Playground — Development Rules

## Session Start Protocol (MANDATORY)

Before writing any code or making any changes:

1. Read this file and `.claude/docs/` for context.
2. Run `pnpm exec totem status` to understand the current state.
3. **NEVER GUESS.** Before modifying any system, call `mcp__totem__search_knowledge` to load architectural context from the knowledge base.
4. Do not push speculative fixes. Run `pnpm exec totem lint` locally first.

## Essentials

- **pnpm only** (never npm/yarn). Windows 11 + Git Bash. TypeScript strict mode.
- `main` is protected. Feature branches + PRs. `Closes #NNN` in PR bodies.
- Run checks locally before pushing — don't rely on CI to catch issues.
- This repo has intentional violations in `src/app/api/`, `src/lib/`, and `src/middleware/`. Do NOT fix them — they are the demo.

## Totem Workflow

- **Before coding:** Run `/preflight <issue>`. Create a feature branch.
- **Before pushing:** Run `/prepush` (lint + review).
- **After merging:** Run `/postmerge <prs>` to extract lessons.
- **NEVER** use `git push --no-verify` or `totem-ignore` without a ticket.

## Skills

- `/preflight <issue>` — search + plan before coding
- `/prepush` — lint + review before push
- `/postmerge <prs>` — extract lessons after merge
- `/signoff` — end-of-session memory + cleanup
- `/review-reply <pr>` — triage and reply to PR bot comments

## PR Bot Protocol

Two bots review PRs — their interaction models are different:

- **CodeRabbit:** Reply inline to each comment freely. No quota.
- **GCA (Gemini Code Assist):** ONE batched comment in the main PR thread with `@gemini-code-assist`. Never reply inline to GCA threads.

## Context Decay Prevention

After >15 turns of changes: re-read this file, run `pnpm exec totem status`, and re-query the knowledge base for the system you're modifying.

## Detailed Docs

- [Contributing rules](.claude/docs/contributing.md) — git conventions, PR bot protocol, code style
- [Architecture context](.claude/docs/architecture.md) — repo structure, demo design, rule engines
- [Agent workflow](.claude/docs/agent-workflow.md) — delegation rules, dispatch templates

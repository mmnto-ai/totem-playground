# Totem Playground: Agent Instructions

Canonical source of truth for how AI coding agents (Claude Code, Gemini CLI, Cursor, Windsurf, Copilot, etc.) behave in this repository. Per [Totem ADR-038](https://github.com/mmnto-ai/totem-strategy/blob/main/adr/adr-038-agents-md-standard.md), `mmnto-ai/totem-playground` consolidates tool-specific instruction files into this single `AGENTS.md`. Thin `CLAUDE.md` / `GEMINI.md` redirect files exist only so each tool finds its way here.

## Session Start Protocol (MANDATORY)

Before writing code or making changes:

1. Read this file and `.claude/docs/` for context.
2. Run `pnpm exec totem status` to understand the current state.
3. **NEVER GUESS.** Before modifying any system, call `mcp__totem__search_knowledge` to load architectural context from the knowledge base.
4. Do not push speculative fixes. Run `pnpm exec totem lint` locally first.

## Essentials

- **pnpm only** (never npm/yarn). Use `pnpm dlx` (never `npx`). Windows 11 + Git Bash. TypeScript strict mode.
- `main` is protected. Feature branches + PRs. `Closes #NNN` in PR bodies.
- Run checks locally before pushing — don't rely on CI to catch issues.
- This repo has intentional violations in `src/app/api/`, `src/lib/`, and `src/middleware/`. Do NOT fix them — they are the demo.

## Totem Workflow

- **Before coding:** Run `/preflight <issue>`. Create a feature branch.
- **Before pushing:** Run `/prepush` (lint + review).
- **After merging:** Run `/postmerge <prs>` to extract lessons.
- **NEVER** use `git push --no-verify` or `totem-ignore` without a ticket.

## Skills

Claude Code skills live under `.claude/skills/`; invoke via `/<skill-name>`. Gemini CLI equivalents (when present) live under `.gemini/skills/`.

- `/preflight <issue>` — search + plan before coding
- `/prepush` — lint + review before push
- `/postmerge <prs>` — extract lessons after merge
- `/signoff` — end-of-session memory + cleanup
- `/review-reply <pr>` — triage and reply to PR bot comments

## Bot-Protocol Gate (load-bearing — ADR-105 Layer 3)

Before posting ANY PR comment, replying to ANY bot, or running `gh pr comment` / `gh api .../comments`:

<!-- totem:cr-disclaimer: cross-repo doctrine refs into private cohort repos (e.g., mmnto-ai/totem-strategy) remain canonical even when CR's URL-accessibility check returns 404 from the bot account — this is an access-class signal per doctrine § 2.4, not a link-class signal -->

1. **Read** [`mmnto-ai/totem-strategy:doctrine/bot-protocols.md`](https://github.com/mmnto-ai/totem-strategy/blob/main/doctrine/bot-protocols.md) if you haven't this session.
2. **Apply** the consolidated round-comment SOP (doctrine § 8.1) — ONE main-thread comment per round, structured table, tag only bots with a role this round.
3. **Never** combine `@gemini-code-assist` + `/gemini review` in the same comment (doctrine § 1.2 — XOR Tag Rule; burns GCA quota).
4. **Never** reply citing a SHA before pushing (doctrine § 1.1 — GCA reviews stale state, wastes quota).
5. **Workflow surface:** prefer the `/review-reply` skill — it operationalizes the SOP end-to-end.

Enforcement stack per [ADR-105](https://github.com/mmnto-ai/totem-strategy/blob/main/adr/adr-105-bot-protocol-centralization.md): (1) PreToolUse hooks (queued — `mmnto-ai/totem#1900`); (2) skill instructions; (3) **this AGENTS.md** (baseline awareness for all vendor sessions); (4) auto-memory pointer (`feedback_bot_protocols_centralized`).

## Context Decay Prevention

After >15 turns of changes: re-read this file, run `pnpm exec totem status`, and re-query the knowledge base for the system you're modifying.

## Detailed Docs

- [Contributing rules](.claude/docs/contributing.md) — git conventions, code style, intentional-violations demo
- [Architecture context](.claude/docs/architecture.md) — repo structure, demo design, rule engines
- [Agent workflow](.claude/docs/agent-workflow.md) — delegation rules, dispatch templates
- [Gemini styleguide](.gemini/styleguide.md) — architectural patterns and coding conventions (Gemini CLI sessions read this directly)

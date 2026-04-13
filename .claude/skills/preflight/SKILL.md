---
name: preflight
description: Pre-work ritual — search knowledge and plan before coding
---

Before starting work on issue $ARGUMENTS, execute these phases in order.
Do NOT write code until all gates are cleared.

## Phase 1 — Context gathering

1. Read the issue on GitHub: `gh issue view $ARGUMENTS --repo mmnto-ai/totem-playground`
2. Call `mcp__totem__search_knowledge` with a query describing the changes you're about to make.
3. Check the journal entries in `D:\Dev\totem-strategy\.journal\totem-playground\` for relevant context.
4. Summarize in 3-5 bullets: what the issue asks for, which lessons/rules are relevant, and any constraints.

## Phase 2 — Scope triage

**Tactical** (skip to implementation) if ALL of:
- Pure bug fix, config change, or test tightening
- Touches ≤3 files
- No new state, types, or failure modes

**Architectural** (draft a plan) if ANY of:
- Changes demo structure or baseline mechanism
- Modifies devcontainer setup or CI workflow
- Touches >3 files or crosses boundaries (tests + src + config)
- Changes how totem rules are compiled or evaluated

State your triage decision: "Tactical — proceeding" or "Architectural — drafting plan."

## Phase 3 — Plan (architectural only)

Draft a plan covering:
- **Scope:** What this will do and what it will NOT do
- **Files to change:** List with expected modifications
- **Risks:** What could break (demo, CI, Codespace setup)
- **Test plan:** How to verify

**STOP** and present the plan for user approval before coding.

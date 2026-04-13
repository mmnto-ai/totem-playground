# Agent Workflow — Controller/Worker Pattern

## Principle

The main conversation is the **Controller**. It plans, dispatches, reviews, and commits.
Subagents are **Workers**. They receive a focused task, execute it, and report back.

## When to Delegate

Delegate to a background agent when:

- The task involves writing code + running tests
- The output would be >5KB of terminal text
- The task is mechanical (lint, test, format)

Do NOT delegate when:

- The task requires architectural decisions
- The task needs MCP tool calls (agents can't access MCP)
- The task needs git push / PR creation
- The task is a 1-2 line change

## Dispatch Template

When spawning a worker agent, provide:

1. **Files to modify** — exact paths
2. **What to change** — specific instructions
3. **Test command** — how to verify
4. **Report format** — "report success/failure and any errors"

## Review Protocol

When the agent reports back:

1. Read the changed files
2. Verify changes match the spec
3. Run `pnpm exec totem lint`
4. Commit with proper message
5. Move to next task

## Pre-Push Review

Before pushing, run `/prepush` to lint and review. The review gate hook blocks pushes without a passing review.

## Available Plugins

- `coderabbit:code-review` — CodeRabbit review
- `coderabbit:autofix` — auto-fix review comments (requires user approval)

## PR Bot Reply Protocol

- **CodeRabbit:** Reply inline to each comment freely.
- **GCA:** ONE batched comment with `@gemini-code-assist` in the main PR thread. Never reply inline.

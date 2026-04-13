---
name: review-reply
description: Unified PR review triage — fetch, normalize, and batch-action bot comments
---

Triage PR review comments from all bots for PR $ARGUMENTS.

## Phase 1: Fetch & Categorize

Fetch all bot comments from the PR using the GitHub API:

```bash
gh api repos/mmnto-ai/totem-playground/pulls/$ARGUMENTS/comments --jq '.[] | "\(.id) | \(.user.login) | \(.body[:120])"'
gh api repos/mmnto-ai/totem-playground/issues/$ARGUMENTS/comments --jq '.[] | select(.user.login | test("bot")) | "\(.id) | \(.user.login) | \(.body[:120])"'
```

Categorize findings by blast radius: Security > Architecture > Convention > Nits.

**STOP HERE.** Present the categorized findings to the user and wait for them to specify actions.

## Phase 2: Execute Actions

The user may type individual IDs or bulk actions:

- `fix all security`
- `defer all nits`

### `fix <numbers | category>`

Mark items as will-fix. Make the code changes.

### `defer <numbers | category> [ticket]`

Reply on the PR acknowledging the deferral:

- **CodeRabbit items:** Reply inline to each thread.
- **GCA items:** DO NOT reply inline. Batch ALL GCA responses into ONE issue comment with `@gemini-code-assist`.

### `nit <numbers | category>`

Same as defer but reply text is "Acknowledged — nit / by design."

### `done`

Print summary of actions taken and exit.

## CRITICAL: GCA Reply Protocol

**NEVER reply individually to GCA bot comments.** Always batch ALL GCA responses into a single PR-level comment using the issue comments API endpoint (`/issues/{pr}/comments`), tagged with `@gemini-code-assist`.

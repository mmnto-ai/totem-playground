---
name: postmerge
description: Post-merge workflow — extract lessons and sync knowledge
---

After merging PRs, run the following sequence. Replace `$ARGUMENTS`
with the merged PR numbers (space-separated, e.g. `51 52`).

1. Extract lessons from the merged PR(s):
   `pnpm exec totem lesson extract $ARGUMENTS --yes`

2. Sync the semantic index:
   `pnpm exec totem sync`

3. Compile new rules (local, uses Sonnet):
   `pnpm exec totem lesson compile`

4. Review newly compiled rules in `.totem/compiled-rules.json`:
   - Is the pattern over-broad?
   - Does it reference things that don't exist in this repo?
   - Is the lesson heading accurate?

5. Stage and commit artifacts:
   `git add .totem/lessons/ .totem/compiled-rules.json .totem/compile-manifest.json`
   `git commit -m "chore: totem postmerge lessons for $ARGUMENTS"`

6. Report: how many lessons extracted, rules compiled, any issues found.

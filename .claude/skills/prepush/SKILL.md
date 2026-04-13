---
name: prepush
description: Pre-push checks — lint and review before pushing
---

Before pushing code:

1. Run `pnpm exec totem lint` — fix any violations before proceeding
2. Run `pnpm exec totem review` — address any critical findings

After all checks pass, proceed with `git push`. The review command stamps `.reviewed-content-hash` automatically on PASS.

If any step fails, fix the issue and re-run from step 1.

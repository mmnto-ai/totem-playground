---
name: signoff
description: End-of-session — update memory, clean up, report
---

End-of-session wrap-up:

1. Update memory files in the project memory directory with any new state (decisions made, key discoveries, workflow changes)
2. Clean up stale local branches: `git branch -vv | grep ': gone]' | awk '{print $1}' | xargs git branch -D`
3. Report: what shipped, what's pending, what's next

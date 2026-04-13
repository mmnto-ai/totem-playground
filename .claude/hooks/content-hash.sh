#!/bin/bash
# Content Hash Utility — computes a deterministic hash of tracked source files.
# Used by both totem review (to stamp) and the PreToolUse hook (to verify).
# Hashes file CONTENTS, not Git metadata. Immune to commit/amend/rebase.

GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo ".")
cd "$GIT_ROOT" || exit 1

git ls-files -z '*.ts' '*.tsx' '*.js' '*.jsx' \
  | tr '\0' '\n' \
  | grep -v '^$' \
  | git hash-object --stdin-paths 2>/dev/null \
  | sha256sum \
  | cut -d' ' -f1

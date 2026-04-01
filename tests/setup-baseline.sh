#!/bin/bash
# Sets up the git state required by lint E2E tests.
#
# Creates a baseline commit with only clean files, then stages the
# violation files so `totem lint` always sees them in the diff.
# Run this ONCE before `node --test tests/e2e.test.mjs`.
#
# WARNING: This script is destructive — it force-renames the current
# branch to 'main'. Only run in CI or throwaway clones, never on a
# working checkout with uncommitted changes.
set -e

if [ -z "$CI" ] && [ -z "$TOTEM_E2E_FORCE" ]; then
  echo "[setup] ERROR: This script destroys local git state."
  echo "[setup] It is intended for CI (fresh clones) only."
  echo "[setup] Set TOTEM_E2E_FORCE=1 to run locally (at your own risk)."
  exit 1
fi

echo "[setup] Creating baseline branch for lint tests..."

# Create an orphan branch for a clean baseline
git checkout --orphan e2e-baseline

# Stage only clean files
git reset
git add package.json tsconfig.json totem.config.ts \
       src/app/page.tsx src/app/layout.tsx \
       README.md .totem/compiled-rules.json .eslintrc.json

git commit -m "baseline" --no-verify

git branch -M main

# Now stage the violation files — don't commit, so lint sees them in the diff
git add src/app/api/ src/lib/ src/middleware/

echo "[setup] Baseline ready. Violation files staged for lint."

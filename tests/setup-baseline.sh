#!/bin/bash
# Sets up the git state required by lint E2E tests.
#
# Creates a baseline commit with only clean files, then stages the
# violation files so `totem lint` always sees them in the diff.
# Run this ONCE before `node --test tests/e2e.test.mjs`.
set -e

echo "[setup] Creating baseline branch for lint tests..."

# Save current branch to return later (if needed)
ORIG_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

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

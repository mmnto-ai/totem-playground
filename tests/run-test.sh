#!/bin/bash
set -e

PASS=0
FAIL=0

pass() { echo "  ✓ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }

echo "═══════════════════════════════════════════"
echo "  Totem Playground Regression Test"
echo "  Node: $(node --version)"
echo "═══════════════════════════════════════════"
echo ""

# ─── Test 1: totem lint catches violations ───────────
echo "[1/3] Running totem lint (expecting failures)..."
LINT_OUTPUT=$(npx @mmnto/cli lint 2>&1) || true

# Check each violation type was caught
echo "$LINT_OUTPUT" | grep -q "process.env" && pass "Rule 1: process.env access detected" || fail "Rule 1: process.env access NOT detected"
echo "$LINT_OUTPUT" | grep -q "Empty catch block" && pass "Rule 2: empty catch block detected" || fail "Rule 2: empty catch block NOT detected"
echo "$LINT_OUTPUT" | grep -q "throw new Error" && pass "Rule 3: raw Error throw detected" || fail "Rule 3: raw Error throw NOT detected"
echo "$LINT_OUTPUT" | grep -q "console.log" && pass "Rule 4: console.log in API detected" || fail "Rule 4: console.log in API NOT detected"
echo "$LINT_OUTPUT" | grep -q "SQL" && pass "Rule 5: SQL concatenation detected" || fail "Rule 5: SQL concatenation NOT detected"

# Check total violation count
ERRORS=$(echo "$LINT_OUTPUT" | grep -o '[0-9]* error(s)' | head -1 | grep -o '[0-9]*')
if [ "${ERRORS:-0}" -ge 10 ]; then
  pass "Total violations: $ERRORS (expected 11)"
else
  fail "Total violations: ${ERRORS:-0} (expected 11)"
fi
echo ""

# ─── Test 2: Violation output has actionable guidance ─
echo "[2/3] Checking output quality..."
echo "$LINT_OUTPUT" | grep -q "validated config schema" && pass "Fix guidance: config schema mentioned" || fail "Fix guidance: config schema NOT mentioned"
echo "$LINT_OUTPUT" | grep -q "parameterized queries" && pass "Fix guidance: parameterized queries mentioned" || fail "Fix guidance: parameterized queries NOT mentioned"
echo "$LINT_OUTPUT" | grep -q "structured logger" && pass "Fix guidance: structured logger mentioned" || fail "Fix guidance: structured logger NOT mentioned"
echo ""

# ─── Test 3: File + line numbers present ─────────────
echo "[3/3] Checking violation formatting..."
echo "$LINT_OUTPUT" | grep -qE "src/.*\.ts:[0-9]+" && pass "Violations include file:line format" || fail "Violations missing file:line format"
echo ""

# ─── Summary ─────────────────────────────────────────
echo "═══════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

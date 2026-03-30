#!/bin/bash
set -e

PASS=0
FAIL=0

pass() { echo "  ✓ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }

RULES_FILE=".totem/compiled-rules.json"

echo "═══════════════════════════════════════════"
echo "  Totem Playground Regression Test"
echo "  Node: $(node --version)"
echo "═══════════════════════════════════════════"
echo ""

# ─── Test 1: totem lint catches violations ───────────
echo "[1/6] Running totem lint (expecting failures)..."
LINT_OUTPUT=$(pnpm exec totem lint 2>&1) || true

# Check each violation type was caught
echo "$LINT_OUTPUT" | grep -q "process.env" && pass "Rule 1: process.env access detected" || fail "Rule 1: process.env access NOT detected"
echo "$LINT_OUTPUT" | grep -q "Empty catch block" && pass "Rule 2: empty catch block detected" || fail "Rule 2: empty catch block NOT detected"
echo "$LINT_OUTPUT" | grep -q "throw new Error" && pass "Rule 3: raw Error throw detected" || fail "Rule 3: raw Error throw NOT detected"
echo "$LINT_OUTPUT" | grep -q "console.log" && pass "Rule 4: console.log in API detected" || fail "Rule 4: console.log in API NOT detected"
echo "$LINT_OUTPUT" | grep -q "SQL" && pass "Rule 5: SQL concatenation detected" || fail "Rule 5: SQL concatenation NOT detected"

# Check total violation count (warnings + errors)
WARNINGS=$(echo "$LINT_OUTPUT" | grep -o '[0-9]* warning(s)' | head -1 | grep -o '[0-9]*' || true)
ERRORS=$(echo "$LINT_OUTPUT" | grep -o '[0-9]* error(s)' | head -1 | grep -o '[0-9]*' || true)
TOTAL=$(( ${WARNINGS:-0} + ${ERRORS:-0} ))
if [ "$TOTAL" -ge 14 ]; then
  pass "Total violations: $TOTAL (expected ≥14)"
else
  fail "Total violations: $TOTAL (expected ≥14)"
fi
echo ""

# ─── Test 2: Violation output has actionable guidance ─
echo "[2/6] Checking output quality..."
echo "$LINT_OUTPUT" | grep -q "validated config schema" && pass "Fix guidance: config schema mentioned" || fail "Fix guidance: config schema NOT mentioned"
echo "$LINT_OUTPUT" | grep -q "parameterized queries" && pass "Fix guidance: parameterized queries mentioned" || fail "Fix guidance: parameterized queries NOT mentioned"
echo "$LINT_OUTPUT" | grep -q "structured logger" && pass "Fix guidance: structured logger mentioned" || fail "Fix guidance: structured logger NOT mentioned"
echo ""

# ─── Test 3: File + line numbers present ─────────────
echo "[3/6] Checking violation formatting..."
echo "$LINT_OUTPUT" | grep -qE "src/.*\.ts:[0-9]+" && pass "Violations include file:line format" || fail "Violations missing file:line format"
echo ""

# ─── Test 4: Ghost AST rule (resilience) ─────────────
echo "[4/6] Resilience: Ghost AST rule..."
cp "$RULES_FILE" "$RULES_FILE.bak"

# Inject a ghost rule targeting a non-existent AST node type
node -e "
  const fs = require('fs');
  const d = JSON.parse(fs.readFileSync('$RULES_FILE', 'utf8'));
  d.rules.unshift({
    lessonHash: 'test-ghost-001', lessonHeading: 'Ghost rule',
    pattern: '', message: 'Ghost node test', engine: 'ast',
    astQuery: '(nonexistent_phantom_node_type) @violation',
    compiledAt: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z',
    fileGlobs: ['src/**/*.ts'], severity: 'error'
  });
  fs.writeFileSync('$RULES_FILE', JSON.stringify(d, null, 2));
"

set +e
GHOST_OUTPUT=$(pnpm exec totem lint 2>&1)
GHOST_EXIT=$?
set -e

# Lint should not crash (exit 0 or 1 for violations, not 2+)
if [ "$GHOST_EXIT" -le 1 ]; then
  pass "Ghost rule: lint did not crash (exit $GHOST_EXIT)"
else
  fail "Ghost rule: lint crashed (exit $GHOST_EXIT)"
fi

# Should warn about the bad node name
echo "$GHOST_OUTPUT" | grep -qi "nonexistent_phantom_node_type\|bad node name\|skipped" \
  && pass "Ghost rule: warning emitted for invalid AST node" \
  || fail "Ghost rule: no warning for invalid AST node"

cp "$RULES_FILE.bak" "$RULES_FILE"
rm -f "$RULES_FILE.bak"
echo ""

# ─── Test 5: Overly broad regex (resilience) ─────────
echo "[5/6] Resilience: Overly broad regex..."
cp "$RULES_FILE" "$RULES_FILE.bak"

# Inject a rule that matches any line containing a letter
node -e "
  const fs = require('fs');
  const d = JSON.parse(fs.readFileSync('$RULES_FILE', 'utf8'));
  d.rules.unshift({
    lessonHash: 'test-broad-001', lessonHeading: 'Broad rule',
    pattern: '[a-zA-Z]', message: 'BROAD TEST', engine: 'regex',
    compiledAt: '2026-01-01T00:00:00.000Z', createdAt: '2026-01-01T00:00:00.000Z',
    fileGlobs: ['src/**/*.ts'], severity: 'warning'
  });
  fs.writeFileSync('$RULES_FILE', JSON.stringify(d, null, 2));
"

set +e
BROAD_OUTPUT=$(pnpm exec totem lint 2>&1)
BROAD_EXIT=$?
set -e

# Lint should complete without crashing
if [ "$BROAD_EXIT" -le 1 ]; then
  pass "Broad regex: lint completed (exit $BROAD_EXIT)"
else
  fail "Broad regex: lint crashed (exit $BROAD_EXIT)"
fi

# The broad rule should fire on diff lines, but be bounded by diff-scoping
BROAD_HITS=$(echo "$BROAD_OUTPUT" | grep -c "BROAD TEST" || true)
if [ "$BROAD_HITS" -gt 0 ] && [ "$BROAD_HITS" -le 50 ]; then
  pass "Broad regex: $BROAD_HITS violations (diff-scoped, bounded)"
elif [ "$BROAD_HITS" -gt 50 ]; then
  fail "Broad regex: $BROAD_HITS violations (not diff-scoped — too many)"
else
  fail "Broad regex: no violations from broad rule"
fi

cp "$RULES_FILE.bak" "$RULES_FILE"
rm -f "$RULES_FILE.bak"
echo ""

# ─── Test 6: Corrupt exemption state (resilience) ────
echo "[6/6] Resilience: Corrupt exemptions.json..."

# Write invalid JSON
echo '{ this is not valid json!!!' > .totem/exemptions.json

set +e
EXEMPT_OUTPUT=$(pnpm exec totem lint 2>&1)
EXEMPT_EXIT=$?
set -e

# Lint should complete — it ignores exemptions
if [ "$EXEMPT_EXIT" -le 1 ]; then
  pass "Corrupt exemptions: lint completed (exit $EXEMPT_EXIT)"
else
  fail "Corrupt exemptions: lint crashed (exit $EXEMPT_EXIT)"
fi

rm -f .totem/exemptions.json
echo ""

# ─── Summary ─────────────────────────────────────────
echo "═══════════════════════════════════════════"
echo "  Results: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi

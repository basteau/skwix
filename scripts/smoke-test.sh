#!/bin/bash
# Production smoke tests for Skwix
# Usage: ./scripts/smoke-test.sh [base_url]

BASE_URL="${1:-https://skwix.example}"
PASSED=0
FAILED=0

echo "🔍 Skwix Smoke Tests"
echo "   Target: $BASE_URL"
echo ""

pass() {
    echo "✅ $1"
    PASSED=$((PASSED + 1))
}

fail() {
    echo "❌ $1"
    FAILED=$((FAILED + 1))
}

# Health check
if curl -sf "$BASE_URL/up" > /dev/null 2>&1; then
    pass "Health endpoint (/up)"
else
    fail "Health endpoint (/up)"
fi

# Welcome page loads and contains expected content
if curl -sf "$BASE_URL/" 2>/dev/null | grep -qi "skwix"; then
    pass "Welcome page loads"
else
    fail "Welcome page loads"
fi

# Lobby page returns (even if redirects)
if curl -sfL "$BASE_URL/lobby" -o /dev/null 2>&1; then
    pass "Lobby accessible"
else
    fail "Lobby accessible"
fi

# Vite manifest exists (assets built)
if curl -sf "$BASE_URL/build/manifest.json" > /dev/null 2>&1; then
    pass "Vite assets built"
else
    fail "Vite assets built"
fi

# PWA manifest (webmanifest)
if curl -sf "$BASE_URL/manifest.webmanifest" > /dev/null 2>&1; then
    pass "PWA manifest"
else
    fail "PWA manifest"
fi

# Admin routes return (will redirect to auth but should not 500)
HTTP_CODE=$(curl -so /dev/null -w '%{http_code}' "$BASE_URL/admin" 2>/dev/null)
if [ "$HTTP_CODE" != "500" ] && [ "$HTTP_CODE" != "502" ] && [ "$HTTP_CODE" != "503" ]; then
    pass "Admin route (no 5xx)"
else
    fail "Admin route (HTTP $HTTP_CODE)"
fi

# Welcome route
if curl -sf "$BASE_URL/welcome" > /dev/null 2>&1; then
    pass "Welcome route"
else
    fail "Welcome route"
fi

# Static assets (favicon)
if curl -sf "$BASE_URL/favicon.ico" > /dev/null 2>&1; then
    pass "Static assets (favicon)"
else
    fail "Static assets (favicon)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Results: $PASSED passed, $FAILED failed"

if [ "$FAILED" -gt 0 ]; then
    exit 1
fi

echo "🎉 All smoke tests passed!"
exit 0

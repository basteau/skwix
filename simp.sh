#!/usr/bin/env bash
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
LOCKFILE="/tmp/simp.lock"
if [ -f "$LOCKFILE" ] && kill -0 "$(cat "$LOCKFILE" 2>/dev/null)" 2>/dev/null; then
  echo "simp already running"; exit 1
fi
echo $$ > "$LOCKFILE"
trap "rm -f $LOCKFILE" EXIT
mkdir -p docs
# === SETUP PHASE: If no tickets exist, run mise-en-place first ===
if [[ ! -d ".tickets" ]] || [[ -z "$(ls -A .tickets 2>/dev/null)" ]]; then
  echo "[simp] No tickets found. Starting mise-en-place setup..."
  SETUP_PROMPT='You are starting a new project with no tickets yet.
FIRST:
1. Read AGENTS.md file
2. Load "compound" skill → run "compound store" to initialize docs/ structure if empty
3. Load "chef" skill — ALL user communication goes through chef (Telegram)
4. Load "mise-en-place" skill
THEN:
- Notify user via chef: "🍳 No tickets found! Let'\''s cook up a plan..."
- Run mise-en-place using chef for all interview questions
- After tickets are created, notify user via chef and exit
This setup only runs once. After tickets exist, the main loop takes over.'
  echo "$SETUP_PROMPT" | amp --dangerously-allow-all -x 2>&1
  echo "[simp] Setup complete. Restarting to enter main loop..."
  sleep 2
fi
MAX_ITERATIONS=100
ITERATION=1
PROMPT='CRITICAL INSTRUCTIONS — Follow exactly:
COMMUNICATION STYLE:
- Notify user via chef at key moments: starting ticket, completion, and any blockers
- Keep messages concise but informative
FIRST (before any other work):
1. Read AGENTS.md file — follow all guidelines strictly
2. Load "compound" skill → run "compound retrieve" for current ticket context
3. Load "chef" skill — ALL user communication MUST use chef (never stdout)
4. Load "ticket" skill
5. Check `tk ready --limit 1` for next ticket
IF TICKET EXISTS:
- chef.mark() — checkpoint for gathering feedback + questions
- Notify user: which ticket you are starting and your approach
- Load "bullet-tracer" skill
- During implementation: use chef.choice() with { blocking: false, recommended: N } for non-blocking clarifying questions
- Implement ONLY that ticket using bullet tracer approach
AFTER IMPLEMENTATION (before QA):
- chef.gather() — returns { messages[], questions[] }
- ACT DIRECTLY on messages: fix code, adjust implementation, address concerns
- Use question answers (wasAnswered=false means default/recommended was used)
- chef.mark() — new checkpoint for QA phase
E2E TESTING (if ticket involves UI/frontend changes):
- Load "e2e-tester" skill
- ALWAYS test with MOBILE VIEWPORT (375x667 or similar) — this is a mobile-first PWA
- Use agent-browser to explore and verify the implemented feature works
- If app has Playwright tests: generate/update CI-ready test for the feature
- If Laravel app with Pest: consider adding Pest browser test (see reference/pest-browser.md)
- OCCASIONALLY (every 3-5 tickets): Load "ios-simulator-pwa-testing" skill for real device feel
- Skip this phase if ticket is backend-only or has no user-facing changes
QA PHASE:
- Can use chef.choice() with { blocking: false } for non-blocking questions during QA too
- Run project QA checks (lint, typecheck, tests) — all must pass
- Commit and push after verification
- `tk close `
- Notify user: brief summary of what was done
LAST (before ending iteration):
- Run "compound store" — persist learnings not captured in code (see compound skill for rules)
AFTER TICKET (or if no tickets):
- chef.gather() — get messages + resolve questions from QA phase
- chef.collect("✅ Done! Any remarks or additional work?", "lfg", 60000) — 1min timeout
- Combine: gathered messages + collect responses
Stopword is "lfg" (case-insensitive exact match: LFG/lfg both work).
IF user provided any feedback (gathered messages or collected responses):
- Convert ALL feedback into complete tickets using ticket skill
- Notify user via chef about created tickets
Then let the iteration end naturally. The bash script handles looping and checks for remaining tickets.'
echo "[simp] Starting loop (max $MAX_ITERATIONS iterations)"
READY=$(tk ready --limit 1 2>/dev/null | head -1) || true
if [[ -z "$READY" ]]; then
  echo "[simp] No tickets ready. Exiting."
  exit 0
fi
while [[ $ITERATION -le $MAX_ITERATIONS ]]; do
  echo "[simp] === Iteration $ITERATION ==="
  OUTPUT_FILE=$(mktemp)
  trap "rm -f $OUTPUT_FILE" EXIT
  echo "$PROMPT" | amp --dangerously-allow-all -x 2>&1 | tee "$OUTPUT_FILE"
  READY=$(tk ready --limit 1 2>/dev/null | head -1) || true
  if [[ -z "$READY" ]]; then
    echo "[simp] No more tickets. Exiting."
    break
  fi
  ITERATION=$((ITERATION + 1))
  sleep 2
done
echo "[simp] Finished after $ITERATION iteration(s)."

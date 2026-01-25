---
tags: [testing, e2e, playwright, agent-browser, architecture]
updated: 2026-01-25
related: [../SPEC.md]
---

# E2E Browser Testing Architecture

## Overview

E2E tests for Skwix use **Pest as the test orchestrator** and **Playwright MCP for browser automation**. Tests are deterministic through controlled environment settings.

## Folder Structure

```
tests/
  E2E/
    Config/
      e2e.php                 # central config (baseUrl, timeouts)
    Fixtures/
      GameFactory.php         # deterministic game/player/word setup
      States.php              # pending/active/completed helpers
    Pages/
      WelcomePage.php         # selectors + UI interactions per page
      LobbyPage.php
      WordlePage.php
      GuessPage.php
      FortunePage.php
      PlayersPage.php
      WinPage.php
      LosePage.php
    Flows/
      JoinFlow.php            # welcome -> join -> lobby
      WordleFlow.php          # complete wordle + assertions
      GuessFlow.php           # ask question + verify
      FortuneFlow.php         # spin wheel + verify
      FullGameFlow.php        # end-to-end narrative
    Support/
      PlaywrightHelper.php    # MCP browser interactions
      E2EDatabase.php         # migrate/seed/reset
      Time.php                # deterministic time control
    full-game.pest.php
    wordle.pest.php
    fortune.pest.php
    guess.pest.php
    invitation-flow.pest.php  # resend code modal flow
```

## Deterministic Environment (`.env.e2e`)

```env
APP_ENV=e2e
APP_DEBUG=true
APP_URL=http://127.0.0.1:8010
DB_CONNECTION=sqlite
DB_DATABASE=storage/e2e.sqlite
CACHE_STORE=array
# Use cookie session driver for E2E to avoid file synchronization issues
# Cookie sessions embed the entire session in the cookie, avoiding race conditions
SESSION_DRIVER=cookie

# Deterministic AI responses
AI_DRIVER=fake

# Deterministic wheel outcomes
FORTUNE_DRIVER=fake
E2E_FORTUNE_SEQUENCE=win,lose,win,lose

# Freeze time (after 8:00 so wordle is available)
# IMPORTANT: Must be FUTURE datetime to avoid session cookie expiration issues
# Cookie Max-Age = (frozen_time + session_lifetime) - real_time
# If frozen_time is in the past relative to real clock, cookies expire immediately (419 errors)
# Set to tomorrow or leave empty to use real time
E2E_NOW="2026-01-25 09:00:00"

# Disable PWA caching
PWA_ENABLED=false
```

## Data-Testid Selectors

Add `data-testid` to React components for stable selectors:

### Welcome Page
- `invite-code-input`, `join-game-button`
- `resend-code-trigger` - Button to open resend code modal
- `resend-email-input`, `resend-submit-button`
- `resend-success-message`, `resend-error-message`

### Lobby
- `countdown`, `player-list`, `player-card-{id}`

### Wordle Page
- `wordle-grid`
- `wordle-tile-r{row}-c{col}`
- `wordle-key-{enter|backspace|letter}`
- `wordle-message`, `points-header`

### Guess Page
- `guess-input`, `guess-submit-button`
- `guess-history`, `guess-item-{id}`
- `guess-points-display`

### Fortune Page
- `fortune-wager-input`
- `fortune-spin-button`, `fortune-half-button`, `fortune-max-button`
- `fortune-wheel`, `fortune-result`
- `fortune-points-display`

### Players Page
- `leaderboard`, `player-row-{id}`

### Win/Lose Pages
- `win-title`, `lose-title`
- `secret-word-reveal`, `winner-name`
- `prize-qr-code`

## Running Tests

```bash
# Single command to run all E2E tests
composer test:e2e

# What this does:
# 1. php artisan config:clear
# 2. php artisan migrate:fresh --env=e2e
# 3. php artisan serve --env=e2e --port=8010 &
# 4. php artisan test --group=e2e
# 5. Cleanup
```

## Key Test Scenarios

### Tier 1 (Critical)
1. Full game flow - win path
2. Full game flow - lose path
3. Wordle - invalid word rejection
4. Wordle - all 6 attempts
5. Fortune - wager boundaries
6. Guess - AI response + shared history

### Tier 2 (Important)
7. Players leaderboard updates
8. Lobby multi-player presence

## Browser Automation Approaches

### Recommended: agent-browser CLI (stable)

The `agent-browser` CLI is the **recommended approach** for E2E testing. It provides stable Playwright-based automation without browser extension dependencies.

```bash
# Install (if not already)
bun i -g agent-browser@latest

# Basic workflow
agent-browser open http://127.0.0.1:8010/welcome
agent-browser snapshot -i                              # Get interactive elements with refs
agent-browser fill @e1 "ABC123"                        # Fill by ref
agent-browser click @e2                                # Click by ref
agent-browser screenshot shot.png                      # Capture result
```

**Advantages:**
- No browser extension required
- Stable CDP connection
- Parallel sessions supported
- Headless or headed mode
- Works in CI/CD

### Alternative: Pest Browser Plugin (CI-ready)

For fully automated CI tests, consider Pest's native browser testing:

```bash
composer require pestphp/pest-plugin-browser --dev
npm install playwright@latest
npx playwright install
```

```php
// tests/Browser/WordleTest.php
it('allows player to complete wordle', function () {
    visit('/welcome')
        ->onMobile()  // Mobile-first!
        ->type('[data-testid="invite-code-input"]', 'ABC123')
        ->press('[data-testid="join-game-button"]')
        ->assertUrlIs('/wordle')
        ->assertSee('wordle-grid');
});
```

### Legacy: Playwriter MCP (Chrome Extension)

**⚠️ Known Stability Issues:**

The Playwriter MCP approach (Chrome extension + CDP) has frequent disconnection problems:

1. **CDP disconnects after 3-5 commands** — requires `reset` to reconnect
2. **Page shows `about:blank`** — connection lost, need reset
3. **Extension state not persisted** — must click extension on each tab
4. **No auto-reconnect** — manual intervention required

**Workarounds (if you must use Playwriter):**
- Run `reset` command proactively after navigation
- Keep commands simple (one action per execute)
- Check page state frequently with accessibility snapshot
- Use `agent-browser` instead for reliability

**When to use Playwriter:**
- Only when inspecting an already-open browser tab
- Quick one-off interactions
- When agent-browser isn't available

### How to Run E2E Tests

1. **Start the E2E server:**
   ```bash
   php artisan serve --env=e2e --port=8010
   ```

2. **Choose your approach:**
   - **agent-browser** (recommended): `agent-browser open http://127.0.0.1:8010/welcome`
   - **Pest browser**: `./vendor/bin/pest tests/Browser --headed`
   - **playwriter** (legacy): Say "use playwriter"

### agent-browser Commands Reference

| Action | Command |
|--------|---------|
| Navigate | `agent-browser open <url>` |
| Snapshot | `agent-browser snapshot -i` |
| Click | `agent-browser click @ref` |
| Fill input | `agent-browser fill @ref "text"` |
| Press key | `agent-browser press Enter` |
| Wait | `agent-browser wait @ref` |
| Get text | `agent-browser get text @ref` |
| Screenshot | `agent-browser screenshot path.png` |
| Get URL | `agent-browser get url` |
| Mobile view | `agent-browser set device "iPhone 14"` |

### Selector Pattern

All interactive elements have `data-testid` attributes. With agent-browser, use refs from snapshot:

```bash
# Snapshot shows refs like:
# textbox "Invite Code" [ref=e1]
# button "Join Game" [ref=e2]

agent-browser fill @e1 "ABC123"
agent-browser click @e2
```

Or use CSS selectors:
```bash
agent-browser find text "Join Game" click
agent-browser eval "document.querySelector('[data-testid=\"invite-code-input\"]').value = 'ABC123'"
```

### Example: Test Wordle Flow (agent-browser)

```bash
# Start with mobile viewport
agent-browser set device "iPhone 14"
agent-browser open http://127.0.0.1:8010/welcome
agent-browser snapshot -i
# -> textbox "Invite Code" [ref=e1], button "Join" [ref=e2]

agent-browser fill @e1 "ABC123"
agent-browser click @e2
agent-browser wait --url "**/wordle"
agent-browser snapshot -i

# Type word and submit
agent-browser press s
agent-browser press n
agent-browser press e
agent-browser press e
agent-browser press u
agent-browser press w
agent-browser press Enter
agent-browser wait "[data-testid='wordle-message']"
agent-browser screenshot wordle-result.png
```

## Avoiding Flakiness

1. **Animations**: Wait for result elements, not timeouts
2. **PWA caching**: Disable service workers in E2E
3. **AI nondeterminism**: Use fake AI driver
4. **Random wheel**: Use deterministic fortune driver
5. **Time-based logic**: Freeze time via E2E_NOW config
6. **Inertia navigation**: Wait for URL + key element

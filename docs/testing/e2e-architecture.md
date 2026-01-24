---
tags: [testing, e2e, playwright, architecture]
updated: 2026-01-24
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
```

## Deterministic Environment (`.env.e2e`)

```env
APP_ENV=e2e
APP_DEBUG=true
APP_URL=http://127.0.0.1:8010
DB_CONNECTION=sqlite
DB_DATABASE=storage/e2e.sqlite
CACHE_STORE=array
SESSION_DRIVER=file

# Deterministic AI responses
AI_DRIVER=fake

# Deterministic wheel outcomes
FORTUNE_DRIVER=fake
E2E_FORTUNE_SEQUENCE=win,lose,win,lose

# Freeze time (after 8:00 so wordle is available)
E2E_NOW=2026-01-01 09:00:00

# Disable PWA caching
PWA_ENABLED=false
```

## Data-Testid Selectors

Add `data-testid` to React components for stable selectors:

### Welcome Page
- `invite-code-input`, `join-game-button`

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

## Playwright MCP Integration

Use Playwright MCP for browser automation:
- Navigate to pages
- Fill inputs, click buttons
- Wait for elements
- Assert text content
- Take screenshots

Example usage:
```php
// Navigate and interact
$this->playwright->navigate('http://127.0.0.1:8010/welcome');
$this->playwright->fill('[data-testid="invite-code-input"]', $inviteCode);
$this->playwright->click('[data-testid="join-game-button"]');
$this->playwright->waitForSelector('[data-testid="countdown"]');
```

## Avoiding Flakiness

1. **Animations**: Wait for result elements, not timeouts
2. **PWA caching**: Disable service workers in E2E
3. **AI nondeterminism**: Use fake AI driver
4. **Random wheel**: Use deterministic fortune driver
5. **Time-based logic**: Freeze time via E2E_NOW config
6. **Inertia navigation**: Wait for URL + key element

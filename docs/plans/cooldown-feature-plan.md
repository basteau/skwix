# Cooldown Feature Implementation Plan

## Overview

Add an 8-hour cooldown between guesses for each player. After a player submits a question/guess, they must wait 8 hours before submitting another.

---

## 1. Backend Implementation

### 1.1 Database Migration

Create a new migration to track cooldown on the `players` table:

```php
// database/migrations/xxxx_add_cooldown_to_players_table.php

Schema::table('players', function (Blueprint $table) {
    $table->timestamp('last_guess_at')->nullable()->after('points');
});
```

**Why `players` table?** The cooldown is per-player, not per-question. Storing on `players` allows O(1) lookup instead of querying questions.

**Existing games compatibility:**
- Column defaults to `NULL` for all existing players
- `isOnCooldown()` returns `false` when `last_guess_at` is `NULL`
- Result: Existing players can make their first guess immediately after deploy
- Cooldown only activates *after* their first post-deploy guess
- No data backfill needed - works automatically

### 1.2 Configuration

Add cooldown setting to `config/game.php`:

```php
'guess_cooldown_hours' => env('GAME_GUESS_COOLDOWN_HOURS', 8),
```

### 1.3 Player Model Updates

Add cooldown helpers to `app/Models/Player.php`:

```php
protected function casts(): array
{
    return [
        'joined_at' => 'datetime',
        'points' => 'integer',
        'last_guess_at' => 'datetime',  // Add this
    ];
}

/**
 * Check if player is currently on cooldown.
 */
public function isOnCooldown(): bool
{
    if (!$this->last_guess_at) {
        return false;
    }
    
    $cooldownHours = config('game.guess_cooldown_hours', 8);
    return $this->last_guess_at->addHours($cooldownHours)->isFuture();
}

/**
 * Get remaining cooldown time in seconds (0 if no cooldown).
 */
public function getCooldownRemainingSeconds(): int
{
    if (!$this->last_guess_at) {
        return 0;
    }
    
    $cooldownHours = config('game.guess_cooldown_hours', 8);
    $cooldownEndsAt = $this->last_guess_at->addHours($cooldownHours);
    
    if ($cooldownEndsAt->isPast()) {
        return 0;
    }
    
    return (int) now()->diffInSeconds($cooldownEndsAt);
}

/**
 * Get the datetime when cooldown ends (null if no cooldown).
 */
public function getCooldownEndsAt(): ?Carbon
{
    if (!$this->last_guess_at) {
        return null;
    }
    
    $cooldownHours = config('game.guess_cooldown_hours', 8);
    $cooldownEndsAt = $this->last_guess_at->addHours($cooldownHours);
    
    return $cooldownEndsAt->isFuture() ? $cooldownEndsAt : null;
}
```

### 1.4 GuessController Updates

#### 1.4.1 Add cooldown check in `ask()` method

In `GuessController::ask()`, add cooldown validation after checking game status:

```php
// After: if ($game->status !== 'active')

// Check cooldown
if ($player->isOnCooldown()) {
    return response()->json([
        'error' => 'cooldown_active',
        'cooldown_remaining' => $player->getCooldownRemainingSeconds(),
        'cooldown_ends_at' => $player->getCooldownEndsAt()?->toISOString(),
    ], 429); // 429 Too Many Requests
}
```

#### 1.4.2 Update `last_guess_at` after successful guess

In both the regular Q&A flow and `handleDirectGuess()`, update the timestamp within the transaction:

```php
// In the DB::transaction block, after decrementing points:
$player->update(['last_guess_at' => now()]);
```

#### 1.4.3 Update `show()` method to include cooldown data

Add cooldown info to the Inertia props:

```php
return Inertia::render('play/guess', [
    'player' => [
        'id' => $player->id,
        'name' => $player->name,
        'points' => $player->points,
        'cooldown_remaining' => $player->getCooldownRemainingSeconds(),
        'cooldown_ends_at' => $player->getCooldownEndsAt()?->toISOString(),
    ],
    // ... rest of props
]);
```

### 1.5 Test Mode Handling

For test mode in `askTestMode()`, cooldown should be optional or disabled. Add check:

```php
// Skip cooldown check in test mode (already has session-based state)
```

---

## 2. Frontend Implementation

### 2.1 Type Updates

Update the `Props` interface in `guess.tsx`:

```typescript
interface Props {
    player?: {
        id: number;
        name: string;
        points: number;
        cooldown_remaining?: number;    // seconds
        cooldown_ends_at?: string;      // ISO string
    };
    // ... rest
}
```

### 2.2 Cooldown Timer Hook

Create a reusable hook `useCooldownTimer.ts`:

```typescript
// resources/js/hooks/use-cooldown-timer.ts

import { useEffect, useState } from 'react';

export function useCooldownTimer(initialSeconds: number = 0) {
    const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);

    useEffect(() => {
        setRemainingSeconds(initialSeconds);
    }, [initialSeconds]);

    useEffect(() => {
        if (remainingSeconds <= 0) return;

        const interval = setInterval(() => {
            setRemainingSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [remainingSeconds > 0]); // Only restart when going from 0 to >0

    return {
        remainingSeconds,
        isOnCooldown: remainingSeconds > 0,
        formatted: formatCooldown(remainingSeconds),
    };
}

function formatCooldown(seconds: number): string {
    if (seconds <= 0) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}u ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}
```

### 2.3 Cooldown UI Component

**Design principles (matching existing UI):**
- Uses same rounded corners (`rounded-lg`) as other elements
- Same muted background treatment as "points per vraag" indicator
- Same icon size (`size-3.5`) as Sparkles icon in existing UI
- Same text sizing (`text-xs`, `text-sm`) as existing indicators
- Mobile-first: compact single-line layout that fits narrow screens

```typescript
// resources/js/components/cooldown-indicator.tsx

import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CooldownIndicatorProps {
    remaining: string;
    className?: string;
}

export function CooldownIndicator({ remaining, className }: CooldownIndicatorProps) {
    return (
        <div
            className={cn(
                // Matches existing indicator styling in input area
                'inline-flex items-center gap-1.5 text-xs text-muted-foreground',
                className
            )}
        >
            <Timer className="size-3.5 shrink-0 animate-pulse" />
            <span>
                Cooldown: <span className="font-medium tabular-nums text-foreground">{remaining}</span>
            </span>
        </div>
    );
}
```

**Why this approach:**
- Inline with existing "X vragen over" indicator (same visual weight)
- No extra containers/cards (keeps input area clean)
- `shrink-0` on icon prevents squishing on narrow screens
- `tabular-nums` prevents layout shift as numbers change

### 2.4 Input Area Updates

**Mobile-responsive approach:**
- Replace the left-side indicator text conditionally (no extra vertical space)
- Cooldown replaces "X vragen over" - same position, same visual weight
- No additional UI elements that push content down on small screens

Modify the fixed input area in `guess.tsx`:

```typescript
// Add hook usage at component level
const { remainingSeconds, isOnCooldown, formatted } = useCooldownTimer(
    player?.cooldown_remaining ?? 0
);

// Update canAsk condition
const canAsk = points >= QUESTION_COST && 
               input.trim().length >= 3 && 
               !isOnCooldown;

// Update the indicator row (line ~469-478 in current file):
<div className="mb-3 flex items-center justify-between text-xs">
    <span className="flex items-center gap-1.5 text-muted-foreground">
        {isOnCooldown ? (
            <>
                <Timer className="size-3.5 shrink-0 animate-pulse" />
                <span>
                    Cooldown:{' '}
                    <span className="font-medium tabular-nums text-foreground">
                        {formatted}
                    </span>
                </span>
            </>
        ) : (
            <>
                <Sparkles className="size-3.5" />
                {questionsRemaining}{' '}
                {questionsRemaining === 1 ? 'vraag' : 'vragen'} over
            </>
        )}
    </span>
    <span className="font-medium text-primary">
        {QUESTION_COST} punten per vraag
    </span>
</div>

// Input disabled state (already handles this pattern):
<input
    disabled={isSubmitting || points < QUESTION_COST || isOnCooldown}
    // ... rest unchanged
/>

// Update bottom message (line ~517-522):
{points < QUESTION_COST && !isOnCooldown && (
    <p className="mt-3 text-center text-xs text-muted-foreground">
        Je hebt {QUESTION_COST} punten nodig om een vraag te stellen
    </p>
)}
```

**Why no separate cooldown message at bottom:**
- Cooldown is already visible in the indicator row
- Avoids redundant information
- Keeps vertical space minimal on mobile

### 2.5 Handle Cooldown Error Response

Update error handling in `handleSubmit` (defensive - shouldn't happen if UI is correct):

```typescript
const errorMessages: Record<string, string> = {
    insufficient_points: 'Niet genoeg punten',
    game_not_active: 'Spel is niet actief',
    ai_error: (data?.message as string) || 'Er ging iets mis',
    multi_guess: (data?.message as string) || 'Raad één woord tegelijk',
    cooldown_active: 'Wacht tot de cooldown voorbij is',
};
```

No special handling needed - the error message displays in the existing message area which already has proper mobile styling.

---

## 3. Rules/Info Modal Updates

### 3.1 Update GUESS_INFO

Update `game-info-modal.tsx`:

```typescript
export const GUESS_INFO: GameInfoContent = {
    title: 'Vragen Stellen',
    description: 'Stel ja/nee vragen om het geheime woord te raden.',
    rules: [
        { text: 'Elke vraag kost 10 punten' },
        { 
            icon: <Timer className="size-3.5 text-muted-foreground" />,
            text: '8 uur cooldown na elke vraag' 
        },
        { text: 'Iedereen ziet elkaars vragen' },
        { text: 'Raad correct = win de hoofdprijs!' },
        { text: 'Pas op: sabotage draait je antwoord om (ja↔nee)' },
    ],
    pointsInfo: 'Tip: check de Spelers tab om te saboteren of sabotages te onthullen.',
};
```

---

## 4. UX Design Decisions

### 4.1 Mobile-First Design

**Matching existing patterns:**
- Uses same `text-xs` as other indicators
- Same `gap-1.5` spacing as existing icon+text pairs  
- Same `flex items-center justify-between` layout in indicator row
- Timer icon same `size-3.5` as Sparkles icon

**No layout shifts:**
- Cooldown replaces "X vragen over" in same position
- `tabular-nums` prevents width changes as countdown ticks
- No extra vertical space consumed

**Touch-friendly:**
- No tiny tap targets added
- Disabled input remains full-width (easy to see state)
- Info modal already has touch-friendly close button

### 4.2 Visual Language

- **Timer icon** (`lucide-react/Timer`) - universally understood
- **Muted colors** - `text-muted-foreground` for cooldown text
- **Subtle pulse** - `animate-pulse` on icon only (not distracting)
- **Accent on time** - `text-foreground font-medium` makes countdown stand out

### 4.3 Disabled State

Existing input styling already handles this well:
```css
disabled:cursor-not-allowed disabled:opacity-50
```

Combined with the visible cooldown indicator, users understand why input is disabled.

### 4.4 Countdown Format (Dutch)

- **> 1 hour:** `7u 45m` (uur, minuten)
- **< 1 hour:** `45m 30s` (minuten, seconden)  
- **< 1 minute:** `30s` (seconden only)

Compact format fits mobile screens without wrapping.

---

## 5. Testing Plan

### 5.1 Backend Tests (Pest)

```php
// tests/Feature/GuessCooldownTest.php

it('prevents guessing during cooldown', function () {
    $player = Player::factory()->create(['last_guess_at' => now()]);
    
    actingAs($player->user)
        ->postJson('/play/guess/ask', ['question' => 'Is het een dier?'])
        ->assertStatus(429)
        ->assertJsonStructure(['error', 'cooldown_remaining', 'cooldown_ends_at']);
});

it('allows guessing after cooldown expires', function () {
    $player = Player::factory()->create([
        'last_guess_at' => now()->subHours(9)
    ]);
    
    actingAs($player->user)
        ->postJson('/play/guess/ask', ['question' => 'Is het een dier?'])
        ->assertStatus(200);
});

it('updates last_guess_at after successful guess', function () {
    $player = Player::factory()->create(['last_guess_at' => null]);
    
    actingAs($player->user)
        ->postJson('/play/guess/ask', ['question' => 'Is het een dier?']);
    
    expect($player->fresh()->last_guess_at)->not->toBeNull();
});

it('includes cooldown data in page props', function () {
    $player = Player::factory()->create(['last_guess_at' => now()]);
    
    actingAs($player->user)
        ->get('/play/guess')
        ->assertInertia(fn ($page) => $page
            ->has('player.cooldown_remaining')
            ->has('player.cooldown_ends_at')
        );
});
```

### 5.2 Model Unit Tests

```php
// tests/Unit/PlayerCooldownTest.php

it('detects active cooldown', function () {
    $player = Player::factory()->create(['last_guess_at' => now()]);
    expect($player->isOnCooldown())->toBeTrue();
});

it('detects expired cooldown', function () {
    $player = Player::factory()->create([
        'last_guess_at' => now()->subHours(9)
    ]);
    expect($player->isOnCooldown())->toBeFalse();
});

it('handles null last_guess_at', function () {
    $player = Player::factory()->create(['last_guess_at' => null]);
    expect($player->isOnCooldown())->toBeFalse();
    expect($player->getCooldownRemainingSeconds())->toBe(0);
});
```

### 5.3 E2E Test Scenario

```
1. Navigate to /play/guess
2. Submit a question
3. Verify input becomes disabled
4. Verify cooldown indicator appears with countdown
5. Verify info modal mentions cooldown rule
```

---

## 6. Implementation Order

1. **Migration** - Add `last_guess_at` column
2. **Config** - Add `guess_cooldown_hours`
3. **Player Model** - Add cooldown methods
4. **GuessController** - Add cooldown check + update
5. **useCooldownTimer hook** - Create frontend timer
6. **CooldownIndicator component** - Create UI component
7. **guess.tsx updates** - Integrate cooldown UI
8. **game-info-modal.tsx** - Update rules
9. **Tests** - Backend + E2E
10. **Run migrations** - Deploy

---

## 7. Rollback Plan

If issues arise:

1. Set `GAME_GUESS_COOLDOWN_HOURS=0` in `.env` to disable
2. Or revert migration with `php artisan migrate:rollback`
3. Frontend gracefully handles missing/zero cooldown

---

## 8. Future Considerations

- **Admin bypass**: Admins could skip cooldown for testing
- **Cooldown reduction**: Power-ups or Wordle bonuses could reduce cooldown
- **Variable cooldown**: Different cooldowns based on game phase
- **Notifications**: Push notification when cooldown ends (PWA)

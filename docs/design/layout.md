---
updated: 2026-01-24
---

# Layout Patterns - Skwix

## Mobile-First Approach

This is a PWA optimized for mobile. Design mobile-first, then adapt for tablet/desktop.

## Safe Areas

Always account for:
- `env(safe-area-inset-top)` - notch/status bar
- `env(safe-area-inset-bottom)` - home indicator
- Apply to headers, bottom nav, and fullscreen modals

## Page Container

```css
.page-container {
  min-height: 100dvh;
  padding-bottom: calc(64px + env(safe-area-inset-bottom)); /* Tab bar height */
}
```

## Main Layouts

### App Shell (Game Pages)
```
┌─────────────────────┐
│      Header         │ 56px
├─────────────────────┤
│                     │
│      Content        │ flex-1, scrollable
│                     │
├─────────────────────┤
│    Bottom Tabs      │ 64px + safe-area
└─────────────────────┘
```

### Fullscreen (Welcome, Win, Lose)
```
┌─────────────────────┐
│                     │
│                     │
│   Centered Content  │ 100dvh
│                     │
│                     │
└─────────────────────┘
```
- No header/tabs
- Content vertically centered
- Decorative background

### Modal/Dialog
```
┌─────────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│ backdrop
│▓▓┌─────────────┐▓▓▓▓│
│▓▓│   Modal     │▓▓▓▓│
│▓▓│   Content   │▓▓▓▓│
│▓▓└─────────────┘▓▓▓▓│
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│
└─────────────────────┘
```

## Grid System

### Content Width
- Mobile: 100% - `--space-4` padding each side
- Tablet: max-width 600px, centered
- Desktop: max-width 500px (keep mobile feel)

### Wordle Grid
- 5 columns, centered
- Gap: `--space-1`
- Max-width: 330px (5 × 62px + 4 × 6px gaps)

### Keyboard Grid
- 3 rows
- Row 1: 10 keys
- Row 2: 9 keys
- Row 3: 9 keys (including Enter, Delete)
- Centered, full width up to 500px

## Specific Page Layouts

### Welcome Screen
```
┌─────────────────────┐
│                     │
│    [Logo/Title]     │
│                     │
│    Description      │
│                     │
│  ┌───────────────┐  │
│  │ Invite Code   │  │
│  └───────────────┘  │
│                     │
│   [Join Button]     │
│                     │
│   ❄️ ❄️ ❄️ ❄️ ❄️      │ subtle snow
└─────────────────────┘
```

### Lobby Screen
```
┌─────────────────────┐
│   Waiting for...    │
│                     │
│  ┌────┐ ┌────┐      │
│  │ 👤 │ │ 👤 │      │
│  └────┘ └────┘      │ Player avatars
│  ┌────┐ ┌────┐      │ grid layout
│  │ 👤 │ │ 👤 │      │
│  └────┘ └────┘      │
│                     │
│  Game starts in:    │
│     02:15:30        │ countdown
│                     │
└─────────────────────┘
```

### Wordle Tab
```
┌─────────────────────┐
│      Header         │
├─────────────────────┤
│                     │
│  Points: 🏆 12      │
│                     │
│  ┌─┬─┬─┬─┬─┐        │
│  │ │ │ │ │ │        │ 6 rows
│  └─┴─┴─┴─┴─┘        │ Wordle grid
│  (repeat 5x)        │
│                     │
│  ┌─────────────┐    │
│  │  Keyboard   │    │ On-screen keyboard
│  │             │    │
│  └─────────────┘    │
├─────────────────────┤
│    Bottom Tabs      │
└─────────────────────┘
```

### Guess Tab
```
┌─────────────────────┐
│      Header         │
├─────────────────────┤
│  Points: 🏆 12      │
│  Cost: 3 pts/vraag  │
├─────────────────────┤
│                     │
│  Question History   │ Scrollable list
│  ├─ Q: Is het...?   │
│  │  A: Ja ✓         │
│  ├─ Q: Bevat...?    │
│  │  A: Nee ✗        │
│                     │
├─────────────────────┤
│  ┌───────────────┐  │
│  │ Your question │  │ Input
│  └───────────────┘  │
│     [Ask - 3 pts]   │
├─────────────────────┤
│    Bottom Tabs      │
└─────────────────────┘
```

### Fortune Tab
```
┌─────────────────────┐
│      Header         │
├─────────────────────┤
│  Points: 🏆 12      │
│                     │
│      ┌─────┐        │
│    ╱ ╲   ╲ ╱        │
│   │ WIN │LOSE│      │ Wheel
│    ╲ ╱   ╱ ╲        │
│      └─────┘        │
│        ▼            │ Pointer
│                     │
│  Wager: [___] pts   │
│                     │
│    [SPIN!]          │
├─────────────────────┤
│    Bottom Tabs      │
└─────────────────────┘
```

### Players Tab
```
┌─────────────────────┐
│      Header         │
├─────────────────────┤
│  Scoreboard         │
│                     │
│  ┌─────────────────┐│
│  │🥇 Player1  45pts││ Player cards
│  └─────────────────┘│ Ranked list
│  ┌─────────────────┐│
│  │🥈 Player2  38pts││
│  └─────────────────┘│
│  ┌─────────────────┐│
│  │🥉 Player3  32pts││
│  └─────────────────┘│
│  ...                │
├─────────────────────┤
│    Bottom Tabs      │
└─────────────────────┘
```

### Win Screen
```
┌─────────────────────┐
│  ❄️ CONFETTI ❄️      │
│                     │
│    🎉 GEFELICITEERD!│
│                     │
│      [Avatar]       │ Large
│      Winner Name    │
│                     │
│    ┌───────────┐    │
│    │  QR CODE  │    │ Prize
│    │           │    │
│    └───────────┘    │
│                     │
│  Scan voor je prijs │
│                     │
└─────────────────────┘
```

### Lose Screen
```
┌─────────────────────┐
│                     │
│   Beter volgende    │
│      keer! 💙       │
│                     │
│  ┌─────────────────┐│
│  │ Winner: [Name]  ││
│  │ Word: [ANSWER]  ││
│  └─────────────────┘│
│                     │
│    Game Stats       │
│    Your rank: #5    │
│                     │
│                     │
└─────────────────────┘
```

## Responsive Behavior

### Mobile (< 640px)
- Full width content
- Stack all elements vertically
- Bottom tab navigation

### Tablet (640px - 1024px)
- Center content, max-width 600px
- Larger touch targets
- Optional: side navigation

### Desktop (> 1024px)
- Keep mobile layout (it's a game!)
- Max-width 500px, centered
- Could add side panel with stats

## Scroll Behavior

### Question History
- Reverse chronological (newest at bottom)
- Auto-scroll to newest
- Pull to refresh

### Player List
- Fixed height container
- Internal scroll if >5 players visible

### Wordle Grid
- Never scrolls
- Keyboard fixed at bottom
- Grid centered in remaining space

## Animation Notes

See `motion.md` for animation tokens. Key layout animations:
- Page transitions: slide/fade
- Modal: fade + scale up
- Tab switch: instant (no animation)
- Scroll: native smooth

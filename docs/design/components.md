---
updated: 2026-01-24
---

# Component Patterns - Skwix

## Buttons

### Primary Button
- Background: `--color-primary`
- Text: `--color-text-inverse` (white)
- Padding: `--space-2` vertical, `--space-4` horizontal
- Border radius: `--radius-sm`
- Font weight: `--font-weight-semibold`
- Hover: `--color-primary-hover`
- Shadow: `--shadow-md` on hover

### Secondary Button
- Background: transparent
- Border: 1px `--color-primary`
- Text: `--color-primary`
- Same padding/radius as primary
- Hover: `--color-primary-light` background

### Ghost Button
- Background: transparent
- Text: `--color-text`
- No border
- Hover: `--color-background-subtle`

### Disabled State
- Opacity: 0.5
- Cursor: not-allowed
- No hover effects

### Button Sizes
- **sm**: height 36px, text `--text-sm`
- **md**: height 44px, text `--text-base` (default)
- **lg**: height 52px, text `--text-lg`

## Cards

### Standard Card
- Background: `--color-surface`
- Border: 1px `--color-border`
- Border radius: `--radius-md`
- Padding: `--space-4` to `--space-6`
- Shadow: `--shadow-sm`

### Elevated Card
- Same as standard
- Shadow: `--shadow-md`
- Use for interactive/important content

### Player Card (Leaderboard)
- Horizontal layout
- Avatar (48px circle) + name + stats
- Rank badge on left
- Points prominently displayed

## Forms

### Text Input
- Height: 44px
- Border: 1px `--color-border`
- Border radius: `--radius-sm`
- Padding: `--space-3` horizontal
- Focus: 2px ring `--color-primary`, border `--color-primary`
- Error: border `--color-error`
- Placeholder: `--color-text-muted`

### Invite Code Input
- Larger: height 56px
- Centered text, monospace font
- Letter spacing: 0.2em
- Uppercase transform

### Labels
- Position: above input
- Gap: `--space-1`
- Font: `--text-sm`, `--font-weight-medium`
- Color: `--color-text`

### Error Messages
- Below input
- Gap: `--space-1`
- Font: `--text-sm`
- Color: `--color-error`

## Wordle Grid

### Tile
- Size: 58px × 58px (mobile), 62px × 62px (tablet+)
- Border: 2px `--color-border`
- Border radius: `--radius-sm`
- Font: `--text-2xl`, `--font-weight-bold`, uppercase
- Gap between tiles: `--space-1`

### Tile States
- **Empty**: border `--color-border`, no background
- **Filled**: border `--color-border-strong`, no background
- **Correct**: background `--color-wordle-correct`, text white
- **Present**: background `--color-wordle-present`, text white
- **Absent**: background `--color-wordle-absent`, text white

### Keyboard
- 3 rows layout
- Key size: 43px height, flexible width
- Gap: `--space-1`
- Background: `--color-background-subtle`
- Border radius: `--radius-sm`
- Special keys (Enter, Delete): wider

## Wheel of Fortune

### Wheel Container
- Circular, 280px diameter (mobile)
- 8 equal segments, alternating colors
- `--color-wheel-win` and `--color-wheel-lose`
- Center dot with pointer
- Border: 4px `--color-primary`

### Spin Button
- Large primary button below wheel
- Disabled when no points
- Loading state during spin

### Result Display
- Large text showing +/- points
- Win: `--color-success` + celebration
- Lose: `--color-error` + sympathetic message

## Navigation

### Bottom Tab Bar
- Fixed to bottom
- Height: 64px + safe-area-inset-bottom
- Background: `--color-surface`
- Border top: 1px `--color-border`
- 4 tabs: Wordle, Guess, Fortune, Players

### Tab Item
- Icon (24px) + label (11px)
- Inactive: `--color-text-muted`
- Active: `--color-primary`
- Touch target: minimum 48px

### Header
- Height: 56px
- Background: `--color-surface`
- Border bottom: 1px `--color-border`
- Logo/title centered or left
- Menu/settings on right

## Avatar

### Sizes
- **xs**: 24px (inline mentions)
- **sm**: 32px (compact lists)
- **md**: 40px (default)
- **lg**: 48px (player cards)
- **xl**: 64px (profile)
- **2xl**: 96px (winner screen)

### Style
- Circular: `--radius-full`
- Border: 2px `--color-border`
- Fallback: initials on `--color-primary-light`

## Badges & Pills

### Point Badge
- Background: `--color-primary-light`
- Text: `--color-primary`
- Padding: `--space-1` `--space-2`
- Border radius: `--radius-full`
- Font: `--text-sm`, `--font-weight-semibold`

### Rank Badge
- Width/height: 28px
- Circular
- Gold (#FFD700), Silver (#C0C0C0), Bronze (#CD7F32) for top 3
- Others: `--color-background-subtle`

## Question History

### Question Item
- Player avatar (small) + question text
- Answer badge (Ja/Nee)
- Timestamp
- Alternating backgrounds for readability

### Answer Badge
- "Ja": `--color-success` background, white text
- "Nee": `--color-error` background, white text
- Border radius: `--radius-sm`
- Padding: `--space-1` `--space-2`

## Modals/Dialogs

### Standard Modal
- Max-width: 400px
- Background: `--color-surface`
- Border radius: `--radius-lg`
- Padding: `--space-6`
- Shadow: `--shadow-xl`
- Backdrop: oklch(0% 0 0 / 0.5)

### Celebration Modal (Winner)
- Full screen on mobile
- Confetti animation
- Large centered content
- Prominent QR code display

## Loading States

### Skeleton
- Animated gradient shimmer
- Background: `--color-background-subtle`
- Border radius matching element

### Spinner
- Color: `--color-primary`
- Size: 24px (default), 16px (small), 32px (large)

## Empty States

### Standard Empty
- Centered vertically
- Icon (64px, `--color-text-muted`)
- Heading: `--text-xl`, `--color-text`
- Description: `--text-base`, `--color-text-muted`
- Optional action button

## Notifications/Toasts

### Position
- Top center on mobile
- Safe area padding

### Style
- Background: `--color-text` (dark)
- Text: `--color-text-inverse` (light)
- Border radius: `--radius-md`
- Shadow: `--shadow-lg`
- Duration: 4000ms default

### Variants
- Success: green accent bar
- Error: red accent bar
- Info: blue accent bar

## Winter Decorations (Subtle)

### Snowflakes
- CSS-only animated snowflakes
- Very subtle, 10-20% opacity
- Only on landing/celebration screens
- Performance: use CSS transforms only

### Frost Edge
- Subtle gradient overlay on edges
- Blue-white fading effect
- Use sparingly

### Ice Pattern
- Subtle geometric pattern
- Background overlay at 3-5% opacity
- For lobby/waiting screens

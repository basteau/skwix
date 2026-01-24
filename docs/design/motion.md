---
updated: 2026-01-24
---

# Motion & Animation - Skwix

## Durations

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | 100ms | Button feedback, toggles |
| `--duration-fast` | 150ms | Micro-interactions, hover states |
| `--duration-normal` | 250ms | Standard transitions, tabs |
| `--duration-slow` | 400ms | Modal open/close, page transitions |
| `--duration-slower` | 600ms | Emphasis animations |
| `--duration-spin` | 3000ms | Wheel of fortune spin |

## Easing

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-default` | cubic-bezier(0.4, 0, 0.2, 1) | General purpose |
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) | Elements entering |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) | Elements exiting |
| `--ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | Symmetric transitions |
| `--ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) | Playful bounces |
| `--ease-spin-decel` | cubic-bezier(0.1, 0.8, 0.2, 1) | Wheel slowing down |

## Animation Patterns

### Button Press
```css
.button:active {
  transform: scale(0.97);
  transition: transform var(--duration-instant) var(--ease-default);
}
```

### Tile Flip (Wordle Reveal)
```css
@keyframes tile-flip {
  0% { transform: rotateX(0deg); }
  50% { transform: rotateX(90deg); }
  100% { transform: rotateX(0deg); }
}

.tile-reveal {
  animation: tile-flip var(--duration-slow) var(--ease-in-out);
}
```
- Stagger: 150ms delay between tiles

### Tile Pop (Letter Entry)
```css
@keyframes tile-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.tile-input {
  animation: tile-pop var(--duration-fast) var(--ease-bounce);
}
```

### Row Shake (Invalid Word)
```css
@keyframes row-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}

.row-invalid {
  animation: row-shake var(--duration-normal) var(--ease-default);
}
```

### Wheel Spin
```css
@keyframes wheel-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(var(--spin-degrees)); }
}

.wheel-spinning {
  animation: wheel-spin var(--duration-spin) var(--ease-spin-decel);
}
```
- `--spin-degrees`: calculated dynamically (3-5 full rotations + landing segment)

### Confetti (Win Celebration)
```css
@keyframes confetti-fall {
  0% { 
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% { 
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.confetti-piece {
  animation: confetti-fall 3s var(--ease-out) forwards;
}
```
- Stagger: random delays 0-2000ms
- Colors: mix of primary, secondary, success, warning

### Snowflake Float (Background)
```css
@keyframes snowflake-fall {
  0% { 
    transform: translateY(-20px) translateX(0) rotate(0deg);
    opacity: 0;
  }
  10% { opacity: 0.15; }
  90% { opacity: 0.15; }
  100% { 
    transform: translateY(100vh) translateX(30px) rotate(360deg);
    opacity: 0;
  }
}

.snowflake {
  animation: snowflake-fall 8s linear infinite;
}
```
- Very subtle: 10-20% opacity
- Stagger: varied delays and durations
- Performance: use will-change: transform

### Modal Entrance
```css
@keyframes modal-in {
  0% { 
    opacity: 0;
    transform: scale(0.95);
  }
  100% { 
    opacity: 1;
    transform: scale(1);
  }
}

.modal-enter {
  animation: modal-in var(--duration-slow) var(--ease-out);
}
```

### Modal Exit
```css
@keyframes modal-out {
  0% { 
    opacity: 1;
    transform: scale(1);
  }
  100% { 
    opacity: 0;
    transform: scale(0.95);
  }
}

.modal-exit {
  animation: modal-out var(--duration-normal) var(--ease-in);
}
```

### Tab Content Fade
```css
.tab-content {
  animation: fade-in var(--duration-fast) var(--ease-default);
}

@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}
```

### Points Counter
```css
@keyframes points-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); color: var(--color-success); }
  100% { transform: scale(1); }
}

.points-change {
  animation: points-pop var(--duration-slow) var(--ease-bounce);
}
```

### Skeleton Shimmer
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-background-subtle) 0%,
    var(--color-surface) 50%,
    var(--color-background-subtle) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
```

### Toast Slide In
```css
@keyframes toast-in {
  0% { 
    opacity: 0;
    transform: translateY(-20px);
  }
  100% { 
    opacity: 1;
    transform: translateY(0);
  }
}

.toast-enter {
  animation: toast-in var(--duration-normal) var(--ease-out);
}
```

## Reduced Motion

Always respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance Guidelines

1. **Use transform and opacity only** for animations
2. **Avoid animating layout properties** (width, height, margin, padding)
3. **Use will-change sparingly** - only for complex animations
4. **GPU acceleration**: transform: translateZ(0) for heavy animations
5. **Batch animations**: use requestAnimationFrame for JS animations
6. **Disable on low-end devices**: check navigator.hardwareConcurrency

## Interaction Feedback

| Action | Animation |
|--------|-----------|
| Button tap | Scale down 0.97 |
| Link hover | Color transition |
| Input focus | Border color + ring |
| Form submit | Button spinner |
| Wordle guess | Row shake (invalid) or tile flip (valid) |
| Wheel spin | 3-5 rotations with deceleration |
| Points change | Pop + color flash |
| Win | Full confetti explosion |
| Answer reveal | Fade in with slight scale |

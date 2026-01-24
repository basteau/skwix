---
updated: 2026-01-24
---

# Design Tokens - Skwix Winter Theme

## Colors (oklch)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | oklch(45% 0.15 230) | CTAs, links, active states - winter blue (WCAG AA) |
| `--color-primary-hover` | oklch(38% 0.15 230) | Hover states |
| `--color-primary-light` | oklch(92% 0.04 230) | Subtle backgrounds, highlights |
| `--color-secondary` | oklch(70% 0.12 220) | Ice blue accents |
| `--color-surface` | oklch(99% 0.005 230) | Card backgrounds - hint of blue |
| `--color-background` | oklch(100% 0 0) | Page background - pure white |
| `--color-background-subtle` | oklch(97% 0.01 230) | Alternate sections |
| `--color-text` | oklch(20% 0.02 250) | Body text - deep charcoal |
| `--color-text-muted` | oklch(45% 0.02 250) | Secondary text |
| `--color-text-inverse` | oklch(100% 0 0) | Text on dark/primary backgrounds |
| `--color-border` | oklch(90% 0.02 230) | Borders, dividers - subtle blue tint |
| `--color-border-strong` | oklch(80% 0.03 230) | Emphasized borders |
| `--color-success` | oklch(55% 0.18 145) | Success states, correct Wordle |
| `--color-warning` | oklch(65% 0.18 85) | Warnings, partial Wordle match |
| `--color-error` | oklch(55% 0.22 25) | Errors, wrong Wordle |
| `--color-wordle-correct` | oklch(55% 0.18 145) | Green - correct letter+position |
| `--color-wordle-present` | oklch(65% 0.18 85) | Yellow - correct letter, wrong position |
| `--color-wordle-absent` | oklch(55% 0.02 250) | Gray - letter not in word |
| `--color-wheel-win` | oklch(45% 0.15 230) | Wheel winning segments |
| `--color-wheel-lose` | oklch(65% 0.02 250) | Wheel losing segments |

## Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-display` | 'Inter', system-ui, sans-serif | Headings, display text |
| `--font-body` | 'Inter', system-ui, sans-serif | Body text |
| `--font-mono` | 'JetBrains Mono', ui-monospace, monospace | Code, Wordle letters |
| `--text-xs` | 0.75rem (12px) | Small labels, captions |
| `--text-sm` | 0.875rem (14px) | Secondary text, meta info |
| `--text-base` | 1rem (16px) | Body text |
| `--text-lg` | 1.125rem (18px) | Emphasis, large body |
| `--text-xl` | 1.25rem (20px) | Subheadings |
| `--text-2xl` | 1.5rem (24px) | Section headings |
| `--text-3xl` | 2rem (32px) | Page titles |
| `--text-4xl` | 2.5rem (40px) | Hero text |
| `--text-5xl` | 3rem (48px) | Victory/celebration text |
| `--font-weight-normal` | 400 | Regular text |
| `--font-weight-medium` | 500 | Slight emphasis |
| `--font-weight-semibold` | 600 | Buttons, labels |
| `--font-weight-bold` | 700 | Headings |
| `--leading-tight` | 1.2 | Headings |
| `--leading-normal` | 1.5 | Body text |
| `--leading-relaxed` | 1.75 | Large blocks |

## Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0.5` | 0.125rem (2px) | Micro gaps |
| `--space-1` | 0.25rem (4px) | Tight groupings |
| `--space-2` | 0.5rem (8px) | Related items |
| `--space-3` | 0.75rem (12px) | Compact spacing |
| `--space-4` | 1rem (16px) | Default gap |
| `--space-5` | 1.25rem (20px) | Medium spacing |
| `--space-6` | 1.5rem (24px) | Section padding |
| `--space-8` | 2rem (32px) | Large separation |
| `--space-10` | 2.5rem (40px) | Major gaps |
| `--space-12` | 3rem (48px) | Section separation |
| `--space-16` | 4rem (64px) | Page-level spacing |
| `--space-20` | 5rem (80px) | Hero sections |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Buttons, inputs |
| `--radius-md` | 10px | Cards, tiles |
| `--radius-lg` | 16px | Modals, large containers |
| `--radius-xl` | 24px | Feature cards |
| `--radius-full` | 9999px | Avatars, pills, badges |

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | 0 1px 2px oklch(0% 0 0 / 0.04) | Subtle lift |
| `--shadow-md` | 0 4px 8px oklch(0% 0 0 / 0.06) | Cards, buttons |
| `--shadow-lg` | 0 8px 16px oklch(0% 0 0 / 0.08) | Elevated cards |
| `--shadow-xl` | 0 16px 32px oklch(0% 0 0 / 0.12) | Modals, popovers |
| `--shadow-glow` | 0 0 24px oklch(45% 0.15 230 / 0.3) | Primary glow effect |

## Breakpoints

| Token | Value | Usage |
|-------|-------|-------|
| `--bp-sm` | 640px | Large phones |
| `--bp-md` | 768px | Tablets |
| `--bp-lg` | 1024px | Desktop |
| `--bp-xl` | 1280px | Wide desktop |

## Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | 0 | Default stacking |
| `--z-raised` | 10 | Cards, elevated elements |
| `--z-dropdown` | 100 | Dropdowns, popovers |
| `--z-sticky` | 200 | Sticky headers |
| `--z-overlay` | 300 | Overlays, backdrops |
| `--z-modal` | 400 | Modals, dialogs |
| `--z-toast` | 500 | Toasts, notifications |
| `--z-max` | 9999 | Critical overlays |

# Mobile Optimization

## Touch Targets

```css
/* Minimum 44x44px touch targets (Apple HIG) */
button, a, input[type="checkbox"], input[type="radio"] {
  min-width: 44px;
  min-height: 44px;
}

/* Adequate spacing between interactive elements */
.button-group button {
  margin: 8px;
}
```

## Prevent Unwanted Behaviors

```css
/* Disable text selection on UI elements */
.button, .nav-item {
  -webkit-user-select: none;
  user-select: none;
}

/* Disable tap highlight on iOS */
button, a {
  -webkit-tap-highlight-color: transparent;
}

/* Prevent pull-to-refresh in standalone mode */
html {
  overscroll-behavior-y: contain;
}

/* Disable callout on long press */
img, a {
  -webkit-touch-callout: none;
}
```

## Smooth Scrolling

```css
/* Native-feeling scroll */
.scrollable {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

/* Hide scrollbars on mobile but keep functionality */
.scrollable::-webkit-scrollbar {
  display: none;
}
.scrollable {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

## Input Optimization

```css
/* Prevent zoom on input focus (iOS) */
input, select, textarea {
  font-size: 16px; /* Minimum to prevent zoom */
}

/* Remove input styling on iOS */
input, textarea {
  -webkit-appearance: none;
  border-radius: 0;
}
```

## Performance

```html
<!-- Preconnect to critical origins -->
<link rel="preconnect" href="https://api.example.com">
<link rel="dns-prefetch" href="https://cdn.example.com">

<!-- Lazy load images -->
<img src="image.webp" loading="lazy" alt="Description">

<!-- Responsive images -->
<img
  srcset="image-320.webp 320w, image-640.webp 640w, image-1280.webp 1280w"
  sizes="(max-width: 640px) 100vw, 50vw"
  src="image-640.webp"
  alt="Description"
>
```

## Responsive Layout Strategy

```css
/* Mobile-first base styles */
.container {
  padding: 1rem;
  max-width: 100%;
}

/* Tablet breakpoint */
@media (min-width: 768px) {
  .container {
    max-width: 720px;
    margin: 0 auto;
  }
}

/* Desktop breakpoint */
@media (min-width: 1024px) {
  .container {
    max-width: 960px;
  }

  /* Show sidebar on desktop */
  .sidebar {
    display: block;
    width: 280px;
  }

  /* Switch from bottom nav to sidebar */
  .bottom-nav {
    display: none;
  }
}

/* Wide desktop */
@media (min-width: 1440px) {
  .container {
    max-width: 1200px;
  }
}
```

## Window Controls Overlay (Desktop PWA)

```json
{
  "display_override": ["window-controls-overlay"],
  "display": "standalone"
}
```

```css
/* Title bar area on desktop */
.titlebar {
  position: fixed;
  top: 0;
  left: env(titlebar-area-x, 0);
  width: env(titlebar-area-width, 100%);
  height: env(titlebar-area-height, 40px);
  -webkit-app-region: drag;
}

.titlebar button {
  -webkit-app-region: no-drag;
}
```

## iOS Safari Quirks

| Issue | Solution |
|-------|----------|
| No install prompt | Use "Add to Home Screen" from share menu |
| No push notifications | Not supported on iOS PWA (use web push in Safari) |
| Safe area not applied | Ensure `viewport-fit=cover` and CSS env() vars |
| Audio won't autoplay | Require user interaction first |
| Background sync limited | Use push notifications for updates |

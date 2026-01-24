# Testing Guidelines

This project is a **mobile-first PWA**. All testing must reflect this.

## Mobile Viewport Testing (REQUIRED)

Always test with mobile viewport dimensions:
- **iPhone SE**: 375x667
- **iPhone 14**: 390x844
- **iPhone 14 Pro Max**: 430x932

Use `agent-browser resize <width> <height>` before exploring.

## Touch Target Guidelines

- Minimum touch target size: 44x44px
- Adequate spacing between interactive elements
- Consider thumb zones for bottom navigation

## iOS Simulator Testing (OCCASIONAL)

Every 3-5 features or major UI changes, use the `ios-simulator-pwa-testing` skill to:
- Test PWA installation and home screen feel
- Verify safe area handling (notch, home indicator)
- Check native gesture interactions
- Debug any Safari-specific console issues

This catches issues browser testing misses and provides real device feel.

## E2E Test Requirements

When writing Playwright/Pest tests:
- Include mobile viewport in test configuration
- Test touch interactions where applicable
- Verify responsive layouts at mobile breakpoints

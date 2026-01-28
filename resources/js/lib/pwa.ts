/**
 * Detect if running in iOS standalone (PWA) mode.
 * In this mode, target="_blank" links open within the PWA without navigation controls.
 */
export function isIOSStandalone(): boolean {
    if (typeof window === 'undefined') return false;

    // iOS Safari standalone mode
    const isStandalone =
        'standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true;

    // Also check display-mode media query (for other browsers/platforms)
    const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Check if iOS (needed to apply iOS-specific workarounds)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    return isIOS && (isStandalone || isDisplayModeStandalone);
}

/**
 * Open a URL in a way that works correctly in iOS PWA mode.
 * In PWA mode, this opens in Safari. In normal mode, opens in new tab.
 */
export function openExternalUrl(url: string): void {
    if (isIOSStandalone()) {
        // In iOS standalone PWA mode, window.location navigates away
        // but at least the user can use Safari's back gesture or close the tab
        // Using a short delay helps ensure the navigation happens
        window.location.href = url;
    } else {
        // Normal browser: open in new tab
        window.open(url, '_blank', 'noopener');
    }
}

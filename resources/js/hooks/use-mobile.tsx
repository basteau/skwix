import { useEffect, useState, useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;

function getMediaQuery(): MediaQueryList | null {
    if (typeof window === 'undefined') return null;
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}

function subscribe(callback: () => void): () => void {
    const mql = getMediaQuery();
    if (!mql) return () => {};

    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
}

function getSnapshot(): boolean {
    return getMediaQuery()?.matches ?? false;
}

function getServerSnapshot(): boolean {
    return false;
}

/**
 * Detect if the viewport is mobile-sized.
 * 
 * Returns `undefined` during SSR and initial hydration to prevent hydration
 * mismatches. Check for `undefined` if you need to wait for the value.
 * 
 * For critical layout differences, prefer CSS `@media` queries instead.
 */
export function useIsMobile(): boolean | undefined {
    const [mounted, setMounted] = useState(false);
    const isMobileQuery = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return undefined;
    }

    return isMobileQuery;
}

/**
 * Detect if the viewport is mobile-sized.
 * 
 * Returns `false` during SSR (may cause hydration mismatch on mobile devices).
 * Use this only when you need a boolean value and can accept the mismatch.
 * 
 * For most cases, prefer `useIsMobile()` which returns `undefined` until mounted.
 */
export function useIsMobileUnsafe(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

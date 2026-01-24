import { useSyncExternalStore } from 'react';

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

export function useIsMobile(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

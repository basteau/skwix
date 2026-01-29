import { toast } from '@/components/ui/sonner';
import { getCsrfToken } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';
import { useEffect, useRef } from 'react';

export interface NotificationItem {
    id: number;
    message: string;
    created_at: string;
}

interface UseNotificationsOptions {
    notifications: NotificationItem[];
    enabled?: boolean;
}

/**
 * Track shown notification IDs per page session.
 * Uses a combination of performance.timeOrigin and Date.now() to generate
 * a unique session ID. This ensures toasts show again after refresh while
 * preventing duplicates during SPA navigation.
 *
 * Note: performance.timeOrigin alone was insufficient because it may be cached
 * by some browsers or bundlers. Adding Date.now() ensures uniqueness.
 * Only clicking "Begrepen" permanently dismisses via server-side tracking.
 */
const pageSessionId = (() => {
    const timeOrigin =
        typeof performance !== 'undefined'
            ? performance.timeOrigin.toString()
            : '0';
    // Add Date.now() to ensure uniqueness even if timeOrigin is cached
    return `${timeOrigin}-${Date.now()}`;
})();
const shownNotificationIds = new Set<string>();

// Clear on bfcache restore (back/forward navigation)
if (typeof window !== 'undefined') {
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            shownNotificationIds.clear();
        }
    });
}

/**
 * Create a session-scoped key for tracking shown notifications.
 * This ensures the Set effectively resets on page refresh since
 * the pageSessionId changes with each full page load.
 */
function getNotificationKey(notificationId: number): string {
    return `${pageSessionId}-${notificationId}`;
}

/**
 * Hook to display notification toasts on play pages.
 * Shows toast for each notification, with "Begrepen" button for server-side dismissal.
 * Uses module-level tracking to prevent duplicate toasts during SPA navigation,
 * but allows toasts to show again on full page refresh.
 */
export function useNotifications({
    notifications,
    enabled = true,
}: UseNotificationsOptions) {
    // Dismiss notification on server (only called when user clicks "Begrepen")
    const dismissNotificationOnServer = async (notificationId: number) => {
        try {
            await fetch(`/play/notification/${notificationId}/dismiss`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    Accept: 'application/json',
                },
            });
        } catch {
            // Silently fail
        }
    };

    // Track pending timeouts for cleanup
    const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

    // Show toast for new notifications
    // Uses setTimeout to defer toast calls - this is a known workaround for Sonner
    // not showing toasts when called during React's initial render/hydration phase.
    // See: https://github.com/emilkowalski/sonner/issues/168
    useEffect(() => {
        if (!enabled) return;

        // Clear any pending timeouts from previous renders
        timeoutRefs.current.forEach(clearTimeout);
        timeoutRefs.current = [];

        notifications.forEach((notification) => {
            const key = getNotificationKey(notification.id);
            if (!shownNotificationIds.has(key)) {
                // Mark as shown immediately to prevent duplicates during SPA navigation
                shownNotificationIds.add(key);

                // Defer toast call to next event loop tick to ensure Sonner is ready
                // This fixes the issue where toasts don't appear after page refresh
                const timeoutId = setTimeout(() => {
                    toast(notification.message, {
                        // Use session-scoped ID to ensure toast shows after page refresh
                        // Sonner's ID tracking can persist unexpectedly, so we include pageSessionId
                        id: `notification-${pageSessionId}-${notification.id}`,
                        icon: <Lightbulb className="size-5 text-amber-500" />,
                        duration: 8000,
                        className:
                            'bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200 dark:from-amber-900/20 dark:to-amber-800/10 dark:border-amber-700/30',
                        classNames: {
                            actionButton:
                                'bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md px-3 py-1.5 transition-colors',
                        },
                        action: {
                            label: 'Begrepen',
                            onClick: () =>
                                dismissNotificationOnServer(notification.id),
                        },
                    });
                }, 0);

                timeoutRefs.current.push(timeoutId);
            }
        });

        // Cleanup timeouts on unmount
        return () => {
            timeoutRefs.current.forEach(clearTimeout);
        };
    }, [notifications, enabled]);
}

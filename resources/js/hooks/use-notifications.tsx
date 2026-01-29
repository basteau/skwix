import { toast } from '@/components/ui/sonner';
import { getCsrfToken } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';
import { useEffect } from 'react';

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
 * Uses performance.timeOrigin which is set once per page load,
 * ensuring toasts show again after refresh while preventing
 * duplicates during SPA navigation. Only clicking "Begrepen"
 * permanently dismisses via server-side tracking.
 */
const pageSessionId =
    typeof performance !== 'undefined'
        ? performance.timeOrigin.toString()
        : Date.now().toString();
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

    // Show toast for new notifications
    useEffect(() => {
        if (!enabled) return;

        notifications.forEach((notification) => {
            const key = getNotificationKey(notification.id);
            if (!shownNotificationIds.has(key)) {
                // Mark as shown immediately to prevent duplicates during SPA navigation
                shownNotificationIds.add(key);

                toast(notification.message, {
                    // No ID - let our Set handle deduplication, Sonner's ID tracking persists unexpectedly
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
            }
        });
    }, [notifications, enabled]);
}

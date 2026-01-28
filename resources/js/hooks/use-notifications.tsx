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

const STORAGE_KEY = 'shown_notification_toasts';

/**
 * Get shown notification IDs from sessionStorage.
 * Uses sessionStorage so toasts show once per browser session,
 * but will show again if user closes/reopens the browser.
 */
function getShownNotificationIds(): Set<number> {
    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
            return new Set(JSON.parse(stored) as number[]);
        }
    } catch {
        // Ignore parsing errors
    }
    return new Set();
}

/**
 * Mark a notification as shown in sessionStorage.
 */
function markNotificationAsShown(id: number): void {
    try {
        const shown = getShownNotificationIds();
        shown.add(id);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...shown]));
    } catch {
        // Ignore storage errors
    }
}

/**
 * Clean up sessionStorage by removing IDs that are no longer active.
 * This prevents unbounded growth of stored IDs.
 */
function cleanupShownIds(activeIds: Set<number>): void {
    try {
        const shown = getShownNotificationIds();
        const cleaned = [...shown].filter((id) => activeIds.has(id));
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    } catch {
        // Ignore storage errors
    }
}

/**
 * Hook to display notification toasts on play pages.
 * Shows toast for each notification, with "Begrepen" button for server-side dismissal.
 * Uses sessionStorage to prevent duplicate toasts when switching between pages.
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

        const shownIds = getShownNotificationIds();
        const activeIds = new Set(notifications.map((n) => n.id));

        // Clean up old IDs that are no longer active (prevents unbounded growth)
        cleanupShownIds(activeIds);

        notifications.forEach((notification) => {
            if (!shownIds.has(notification.id)) {
                // Mark as shown immediately to prevent duplicates
                markNotificationAsShown(notification.id);

                toast(notification.message, {
                    id: `notification-${notification.id}`, // Unique toast ID prevents duplicates
                    icon: <Lightbulb className="size-5 text-amber-500" />,
                    duration: 8000,
                    className:
                        'bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200 dark:from-amber-900/20 dark:to-amber-800/10 dark:border-amber-700/30',
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

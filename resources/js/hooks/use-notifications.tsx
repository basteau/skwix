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
 * Hook to display notification toasts on play pages.
 * Shows toast for each notification, with "Begrepen" button for server-side dismissal.
 */
export function useNotifications({
    notifications,
    enabled = true,
}: UseNotificationsOptions) {
    const toastShownRef = useRef<Set<number>>(new Set());

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
            if (!toastShownRef.current.has(notification.id)) {
                toastShownRef.current.add(notification.id);
                toast(notification.message, {
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

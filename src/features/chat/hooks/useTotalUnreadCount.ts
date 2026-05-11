import { useState, useEffect } from 'react';
import { getStreamClient, isStreamConnected } from '../stream/streamClient';
import { useAuthStore } from '@/features/auth/stores/authStore';

/**
 * Hook to provide the total number of channels with unread messages.
 * This is used for the badge count in the Navbar.
 */
export const useTotalUnreadCount = () => {
    const { isAuthenticated } = useAuthStore();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            return;
        }

        let isMounted = true;
        let client: any = null;

        const updateFromClient = () => {
            if (!isMounted || !client) return;
            const count = client.user?.unread_channels ?? 0;
            setUnreadCount(count);
        };

        const init = () => {
            try {
                if (!isStreamConnected()) return false;
                client = getStreamClient();
                
                // Initial count
                updateFromClient();

                // Listen to ALL events that might affect unread counts
                const listener = client.on((event: any) => {
                    if (event.unread_channels !== undefined) {
                        setUnreadCount(event.unread_channels);
                    } else if (event.total_unread_count !== undefined) {
                        // Sometimes only total_unread_count comes, but unread_channels usually follows
                        // or we can just pull it from the user object
                        updateFromClient();
                    } else if (
                        ['message.new', 'notification.message_new', 'notification.mark_read', 'message.read', 'notification.mark_unread'].includes(event.type)
                    ) {
                        updateFromClient();
                    }
                });

                const connectionSub = client.on('connection.changed', (event: any) => {
                    if (event.online) updateFromClient();
                });

                return () => {
                    listener.unsubscribe();
                    connectionSub.unsubscribe();
                };
            } catch (err) {
                return false;
            }
        };

        let cleanup = init();

        // If not connected yet, poll until it is
        const intervalId = setInterval(() => {
            if (!cleanup) {
                cleanup = init();
                if (cleanup) clearInterval(intervalId);
            } else {
                // Occasional sync just in case
                updateFromClient();
            }
        }, 8000);

        // Listen for manual syncs
        const handleSync = () => updateFromClient();
        window.addEventListener('unread-count-sync', handleSync);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
            window.removeEventListener('unread-count-sync', handleSync);
            if (cleanup && typeof cleanup === 'function') cleanup();
        };
    }, [isAuthenticated]);

    return unreadCount;
};

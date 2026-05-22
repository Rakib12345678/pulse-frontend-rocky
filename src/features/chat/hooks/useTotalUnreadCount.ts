import { useState, useEffect, useRef } from 'react';
import { getStreamClient, isStreamConnected } from '../stream/streamClient';
import { useAuthStore } from '@/features/auth/stores/authStore';

const RELEVANT_EVENTS = [
    'message.new',
    'message.read',
    'notification.message_new',
    'notification.mark_read',
    'notification.mark_unread',
    'notification.added_to_channel',
    'notification.removed_from_channel',
    'channel.deleted',
    'notification.channel_deleted',
    'connection.changed',
    'connection.recovered'
];

/**
 * Hook to provide the total number of channels with unread messages.
 * This is used for the badge count in the Navbar.
 */
export const useTotalUnreadCount = () => {
    const { isAuthenticated } = useAuthStore();
    const [unreadCount, setUnreadCount] = useState(0);
    
    const lastCountRef = useRef<number>(0);
    const pendingCountRef = useRef<number | null>(null);
    const updateTimeoutRef = useRef<any>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            lastCountRef.current = 0;
            pendingCountRef.current = null;
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
                updateTimeoutRef.current = null;
            }
            return;
        }

        let isMounted = true;
        let client: any = null;

        const scheduleUpdate = (explicitCount?: number) => {
            if (!isMounted || !client) return;

            if (explicitCount !== undefined) {
                pendingCountRef.current = explicitCount;
            }

            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }

            updateTimeoutRef.current = setTimeout(() => {
                if (!isMounted || !client) return;

                const count = pendingCountRef.current !== null
                    ? pendingCountRef.current
                    : (client.user?.unread_channels ?? 0);

                pendingCountRef.current = null;

                if (count !== lastCountRef.current) {
                    lastCountRef.current = count;
                    setUnreadCount(count);
                }
            }, 100); // 100ms debounce/coalesce window
        };

        const init = () => {
            try {
                if (!isStreamConnected()) return false;
                client = getStreamClient();
                
                // Initial count
                const initialCount = client.user?.unread_channels ?? 0;
                lastCountRef.current = initialCount;
                setUnreadCount(initialCount);

                // Listen to events
                const listener = client.on((event: any) => {
                    if (event.unread_channels !== undefined) {
                        scheduleUpdate(event.unread_channels);
                    } else if (RELEVANT_EVENTS.includes(event.type)) {
                        scheduleUpdate();
                    }
                });

                const connectionSub = client.on('connection.changed', (event: any) => {
                    if (event.online) {
                        scheduleUpdate();
                    }
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
        let intervalId: any = null;

        if (!cleanup) {
            // If not connected yet, poll until it is
            intervalId = setInterval(() => {
                cleanup = init();
                if (cleanup) {
                    clearInterval(intervalId);
                }
            }, 2000); // Poll faster (every 2s instead of 8s) for better responsiveness on initial load
        }

        // Listen for manual syncs
        const handleSync = () => {
            scheduleUpdate();
        };
        window.addEventListener('unread-count-sync', handleSync);

        return () => {
            isMounted = false;
            if (intervalId) clearInterval(intervalId);
            window.removeEventListener('unread-count-sync', handleSync);
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
            if (cleanup && typeof cleanup === 'function') {
                cleanup();
            }
        };
    }, [isAuthenticated]);

    return unreadCount;
};
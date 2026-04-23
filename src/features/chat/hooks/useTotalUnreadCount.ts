import { useState, useEffect, useCallback, useRef } from 'react';
import { getStreamClient, isStreamConnected } from '../stream/streamClient';
import { useAuthStore } from '@/features/auth/stores/authStore';

/**
 * Hook to provide the total number of channels with unread messages.
 * This is used for the badge count in the Navbar.
 */
export const useTotalUnreadCount = () => {
    const { isAuthenticated } = useAuthStore();
    const [unreadCount, setUnreadCount] = useState(0);
    const lastSyncTime = useRef(0);

    const updateCount = useCallback(async () => {
        if (!isStreamConnected()) return;
        
        // Rate limit manual syncs to once every 2 seconds unless forced
        const now = Date.now();
        if (now - lastSyncTime.current < 2000) return;
        lastSyncTime.current = now;

        try {
            const client = getStreamClient();
            
            // First, try the built-in property as it's fast
            const sdkCount = (client.user as any)?.unread_channels ?? 0;
            
            // Then perform a query to verify/correct the count
            // We query active channels and filter manually to ensure type safety and accuracy
            const response = await client.queryChannels(
                { members: { $in: [client.userID!] } },
                { last_message_at: -1 },
                { limit: 30, watch: false }
            );
            
            const actualCount = Array.isArray(response) 
                ? response.filter(c => c.countUnread() > 0).length 
                : sdkCount;
            setUnreadCount(actualCount);
        } catch (err: any) {
            // Client not ready or query failed
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setUnreadCount(0);
            return;
        }

        let isMounted = true;
        let unsubscribe: (() => void) | null = null;

        const setupListeners = () => {
            try {
                if (!isStreamConnected()) return;
                const client = getStreamClient();

                if (unsubscribe) unsubscribe();

                const handleEvent = (event: any) => {
                    if (!isMounted) return;
                    
                    // notification.unread_count provides the new counts directly
                    if (event.unread_channels !== undefined) {
                        setUnreadCount(event.unread_channels);
                    } else if (
                        ['message.new', 'notification.message_new', 'notification.mark_read', 'notification.unread_count', 'message.read', 'notification.mark_unread'].includes(event.type)
                    ) {
                        // For other events, we trigger a sync to be sure
                        setTimeout(() => {
                            if (isMounted) updateCount();
                        }, 500);
                    }
                };

                const listener = client.on(handleEvent);
                const connectionSub = client.on('connection.changed', (event) => {
                    if (event.online) updateCount();
                });

                unsubscribe = () => {
                    listener.unsubscribe();
                    connectionSub.unsubscribe();
                    unsubscribe = null;
                };
                
                updateCount();
            } catch {
                // Client not ready
            }
        };

        setupListeners();

        const intervalId = setInterval(() => {
            if (!unsubscribe && isStreamConnected()) {
                setupListeners();
            } else if (isStreamConnected()) {
                updateCount();
            }
        }, 8000); // Polling every 8s as fallback

        return () => {
            isMounted = false;
            clearInterval(intervalId);
            if (unsubscribe) unsubscribe();
        };
    }, [isAuthenticated, updateCount]);

    return unreadCount;
};

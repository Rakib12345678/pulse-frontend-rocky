import { useEffect } from 'react';
import type { Call } from '@stream-io/video-react-sdk';

/**
 * Event-Driven Visibility Tracking.
 * Sends a single event when the tab is hidden or shown.
 * Does NOT disconnect the user from the video/audio feed.
 */
export function useParticipantPresence(call: Call | null, isViewer: boolean) {
    useEffect(() => {
        // Only viewers/co-hosts report their visibility. Hosts don't need to.
        if (!call || !isViewer) return;

        const handleVisibilityChange = () => {
            const isVisible = document.visibilityState === 'visible';

            call.sendCustomEvent({
                type: 'viewer-visibility',
                isVisible: isVisible,
            }).catch((err) => {
                console.error('[Visibility] Failed to send state:', err);
            });
        };

        // Send initial state immediately when they join
        handleVisibilityChange();

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [call, isViewer]);
}
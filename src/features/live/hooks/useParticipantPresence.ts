import { useEffect, useRef, useCallback } from 'react';
import type { Call } from '@stream-io/video-react-sdk';

/**
 * Hook that sends presence heartbeat events to the Stream call
 * while the user's tab/page is visible. Stops when hidden/blurred
 * (screen lock, tab switch, app background).
 *
 * Only used by viewers — hosts/co-hosts are always shown.
 */
export function useParticipantPresence(call: Call | null, enabled: boolean) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isVisibleRef = useRef(true);

    const sendHeartbeat = useCallback(() => {
        if (!call) return;
        call.sendCustomEvent({
            type: 'presence-heartbeat',
        }).catch((err) => {
            console.error('[useParticipantPresence] Failed to send heartbeat:', err);
        });
    }, [call]);

    const sendInactive = useCallback(() => {
        if (!call) return;
        call.sendCustomEvent({
            type: 'presence-inactive',
        }).catch((err) => {
            console.error('[useParticipantPresence] Failed to send inactive:', err);
        });
    }, [call]);

    const startHeartbeat = useCallback(() => {
        if (intervalRef.current) return;
        // Send one immediately
        sendHeartbeat();
        intervalRef.current = setInterval(sendHeartbeat, 5000);
    }, [sendHeartbeat]);

    const stopHeartbeat = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!enabled || !call) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                isVisibleRef.current = false;
                stopHeartbeat();
                sendInactive();
            } else {
                isVisibleRef.current = true;
                startHeartbeat();
            }
        };

        const handleBlur = () => {
            isVisibleRef.current = false;
            stopHeartbeat();
            sendInactive();
        };

        const handleFocus = () => {
            isVisibleRef.current = true;
            startHeartbeat();
        };

        // Start heartbeating immediately
        startHeartbeat();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            stopHeartbeat();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [enabled, call, startHeartbeat, stopHeartbeat, sendInactive]);
}

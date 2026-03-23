
import { useState, useEffect, useCallback, useRef } from 'react';
import { TRANSLATE_KEY } from '../utils/chatConstants';

const TRANSLATION_EVENT = 'chat:translation_toggled';

export const useTranslationPreference = (myId: string) => {
    const key = TRANSLATE_KEY(myId);

    const [enabled, setEnabled] = useState<boolean>(() => {
        try { return localStorage.getItem(key) === 'true'; } catch { return false; }
    });

    // Keep a ref so setTranslate always reads the latest value without stale closure
    const enabledRef = useRef(enabled);
    enabledRef.current = enabled;

    const setTranslate = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
        const next = typeof val === 'function' ? val(enabledRef.current) : val;
        enabledRef.current = next;
        setEnabled(next);
        try { localStorage.setItem(key, String(next)); } catch {}
        // Notify other instances in the same tab (e.g., sidebar vs. chat window)
        window.dispatchEvent(new CustomEvent(TRANSLATION_EVENT, { detail: next }));
    }, [key]);

    useEffect(() => {
        // Sync across browser tabs via StorageEvent
        const handleStorage = (e: StorageEvent) => {
            if (e.key === key) {
                const next = e.newValue === 'true';
                enabledRef.current = next;
                setEnabled(next);
            }
        };
        // Sync within the same tab (other mounted instances of this hook)
        const handleCustom = (e: CustomEvent<boolean>) => {
            // Only update if value actually changed to avoid unnecessary re-renders
            if (enabledRef.current !== e.detail) {
                enabledRef.current = e.detail;
                setEnabled(e.detail);
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener(TRANSLATION_EVENT, handleCustom as EventListener);
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener(TRANSLATION_EVENT, handleCustom as EventListener);
        };
    }, [key]);

    return { translateEnabled: enabled, setTranslate };
};
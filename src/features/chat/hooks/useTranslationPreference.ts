import { useState, useEffect, useCallback } from 'react';
import { TRANSLATE_KEY } from '../utils/chatConstants';

const TRANSLATION_EVENT = 'chat:translation_toggled';

export const useTranslationPreference = (myId: string) => {
    const key = TRANSLATE_KEY(myId);
    
    const [enabled, setEnabled] = useState<boolean>(() => {
        try { return localStorage.getItem(key) === 'true'; } catch { return false; }
    });

    const setTranslate = useCallback((val: boolean | ((prev: boolean) => boolean)) => {
        setEnabled(prev => {
            const next = typeof val === 'function' ? val(prev) : val;
            try { localStorage.setItem(key, String(next)); } catch {}
            // Dispatch custom event for same-tab sync
            window.dispatchEvent(new CustomEvent(TRANSLATION_EVENT, { detail: next }));
            return next;
        });
    }, [key]);

    useEffect(() => {
        // Sync across tabs
        const handleStorage = (e: StorageEvent) => {
            if (e.key === key) setEnabled(e.newValue === 'true');
        };
        // Sync within same tab
        const handleCustom = (e: any) => {
            setEnabled(e.detail);
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener(TRANSLATION_EVENT, handleCustom);
        
        return () => {
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener(TRANSLATION_EVENT, handleCustom);
        };
    }, [key]);

    return { translateEnabled: enabled, setTranslate };
};

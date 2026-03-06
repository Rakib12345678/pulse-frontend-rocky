import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
    const [isOnline, setIsOnline] = useState(true);

    useEffect(() => {
        const checkOnline = async () => {
            if (!navigator.onLine) { setIsOnline(false); return; }
            try {
                await fetch('https://www.gstatic.com/generate_204', {
                    method: 'HEAD',
                    cache: 'no-store',
                    mode: 'no-cors',
                    signal: AbortSignal.timeout(3000),
                });
                setIsOnline(true);
            } catch {
                setIsOnline(false);
            }
        };

        checkOnline();
        window.addEventListener('online', checkOnline);
        window.addEventListener('offline', checkOnline);
        const interval = setInterval(checkOnline, 10_000);

        return () => {
            window.removeEventListener('online', checkOnline);
            window.removeEventListener('offline', checkOnline);
            clearInterval(interval);
        };
    }, []);

    return isOnline;
};
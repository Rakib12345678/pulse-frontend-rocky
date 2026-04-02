import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import api from '@/lib/api';
import { connectStreamUser, disconnectStreamUser } from '../stream/streamClient';
import { loadStreamCredentials, saveStreamCredentials } from '@/features/chat/stream/streamCredentials';
import { toAbsoluteUrl } from '@/features/chat/utils/chat';
import { SESSION_ACTIVE_KEY } from '@/features/chat/utils/chatConstants';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;
if (!STREAM_API_KEY) {
    throw new Error('[StreamInit] Missing VITE_STREAM_API_KEY — add it to your .env file');
}

interface TokenResponse { token: string; }

export const useStreamInit = () => {
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user?.id) {
            disconnectStreamUser();
            sessionStorage.removeItem(SESSION_ACTIVE_KEY);
            return;
        }

        const init = async () => {
            try {
                const userId = String(user.id);
                const fullName = user.fullName ?? '';
                const userName = user.username ?? userId;
                const avatar   = toAbsoluteUrl(user.profileImage);

                const saved = loadStreamCredentials();
                
                // CRITICAL: If the saved user is different from the current user, 
                // we MUST clear the active session before connecting.
                if (saved && saved.userId !== userId) {
                    sessionStorage.removeItem(SESSION_ACTIVE_KEY);
                }

                if (saved && saved.userId === userId) {
                    try {
                        await connectStreamUser(saved.userId, saved.userName, avatar, saved.apiKey, saved.token, fullName);
                    } catch (err) {
                        console.warn('[StreamInit] Saved token failed or expired, fetching new token...', err);
                        // Fallback to fetch new token
                        const { data } = await api.get<TokenResponse>('/chat/token');
                        await connectStreamUser(userId, userName, avatar, STREAM_API_KEY, data.token, fullName);
                        saveStreamCredentials({ apiKey: STREAM_API_KEY, token: data.token, userId, userName, avatar, fullName });
                    }
                } else {
                    const { data } = await api.get<TokenResponse>('/chat/token');
                    await connectStreamUser(userId, userName, avatar, STREAM_API_KEY, data.token, fullName);
                    saveStreamCredentials({ apiKey: STREAM_API_KEY, token: data.token, userId, userName, avatar, fullName });
                }
            } catch (err) {
                console.error('[StreamInit] Failed to connect:', err);
            }
        };

        init();
    }, [user?.id]);
};
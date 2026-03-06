import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import api from '@/lib/api';
import { connectStreamUser, isStreamConnected } from '../stream/streamClient';
import {
    loadStreamCredentials,
    saveStreamCredentials,
} from '@/features/chat/stream/streamCredentials';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY ?? '';

interface TokenResponse {
    token: string;
}

export const useStreamInit = () => {
    const { user } = useAuthStore();

    useEffect(() => {
        if (!user?.id) return;
        if (isStreamConnected()) return;

        const init = async () => {
            try {
                const userId   = String(user.id);
                const fullName = user.fullName ?? '';
                const userName = user.username ?? userId;
                const avatar   = user.profileImage ?? '';

                // ------ restore from sessionStorage -----
                const saved = loadStreamCredentials();
                if (saved && saved.userId === userId) {
                    await connectStreamUser(
                        saved.userId,
                        saved.userName,
                        saved.avatar,
                        saved.apiKey,
                        saved.token,
                        fullName,
                    );
                    console.log('[StreamInit] Restored from session for', userId);
                    return;
                }

                // -------- Fetch token from backend ------
                const { data } = await api.get<TokenResponse>('/chat/token');

                const apiKey = saved?.apiKey ?? STREAM_API_KEY;
                if (!apiKey) {
                    console.error('[StreamInit] No Stream API key available. Set VITE_STREAM_API_KEY in .env');
                    return;
                }

                await connectStreamUser(userId, userName, avatar, apiKey, data.token, fullName);

                saveStreamCredentials({
                    apiKey,
                    token:    data.token,
                    userId,
                    userName,
                    avatar,
                    fullName,
                });

                console.log('[StreamInit] Connected for', userId, '| fullName:', fullName);

            } catch (err) {
                console.error('[StreamInit] Failed to connect:', err);
            }
        };

        init();
    }, [user?.id]);
};
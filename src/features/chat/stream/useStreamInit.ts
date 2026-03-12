import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import api from '@/lib/api';
import { connectStreamUser, isStreamConnected } from '../stream/streamClient';
import {
    loadStreamCredentials,
    saveStreamCredentials,
} from '@/features/chat/stream/streamCredentials';
import { toAbsoluteUrl } from '@/features/chat/utils/chat';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;
if (!STREAM_API_KEY) {
    throw new Error('[StreamInit] Missing VITE_STREAM_API_KEY — add it to your .env file');
}

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
                const userId = String(user.id);
                const fullName = user.fullName ?? '';
                const userName = user.username ?? userId;
                const avatar = toAbsoluteUrl(user.profileImage);

                // ----- Restore from sessionStorage -------
                const saved = loadStreamCredentials();
                if (saved && saved.userId === userId) {
                    await connectStreamUser(
                        saved.userId,
                        saved.userName,
                        avatar,
                        saved.apiKey,
                        saved.token,
                        fullName,
                    );
                } else {
                    // ---- Fetch token from backend -----
                    const { data } = await api.get<TokenResponse>('/chat/token');

                    await connectStreamUser(userId, userName, avatar, STREAM_API_KEY, data.token, fullName);

                    saveStreamCredentials({
                        apiKey: STREAM_API_KEY,
                        token: data.token,
                        userId,
                        userName,
                        avatar,
                        fullName,
                    });
                }

                // connectStreamUser already calls upsertUser internally — no need to repeat it here.
                console.log('[StreamInit] Connected for', userId, '| fullName:', fullName);

            } catch (err) {
                console.error('[StreamInit] Failed to connect:', err);
            }
        };

        init();
    }, [user?.id]);
};
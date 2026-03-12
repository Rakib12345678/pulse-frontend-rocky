import { STREAM_CREDS_KEY } from '@/features/chat/utils/chatConstants';

export interface StreamCredentials {
    apiKey: string;
    token: string;
    userId: string;
    userName: string;
    avatar: string;
    fullName?: string;
}

export const saveStreamCredentials = (creds: StreamCredentials): void => {
    sessionStorage.setItem(STREAM_CREDS_KEY, JSON.stringify(creds));
};

export const loadStreamCredentials = (): StreamCredentials | null => {
    try {
        const raw = sessionStorage.getItem(STREAM_CREDS_KEY);
        return raw ? (JSON.parse(raw) as StreamCredentials) : null;
    } catch {
        return null;
    }
};

export const clearStreamCredentials = (): void => {
    sessionStorage.removeItem(STREAM_CREDS_KEY);
};
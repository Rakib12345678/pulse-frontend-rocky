import { StreamChat } from 'stream-chat';
import {
    saveStreamCredentials,
    clearStreamCredentials,
} from './streamCredentials';
import { toAbsoluteUrl } from '@/features/chat/utils/chat';

let clientInstance: StreamChat | null = null;

export const getStreamClient = (apiKey?: string): StreamChat => {
    if (!clientInstance) {
        if (!apiKey) throw new Error('StreamChat: apiKey required on first call');
        clientInstance = StreamChat.getInstance(apiKey);
    }
    return clientInstance;
};

export const isStreamConnected = (): boolean => {
    return !!(clientInstance?.userID);
};

export const connectStreamUser = async (
    userId: string,
    userName: string,
    avatar: string,
    apiKey: string,
    token: string,
    fullName?: string,
): Promise<void> => {
    const client = getStreamClient(apiKey);
    const absoluteAvatar = toAbsoluteUrl(avatar);

    if (client.userID === userId) return;
    if (client.userID) await client.disconnectUser();

    await client.connectUser(
        {
            id: userId,
            name: userName,
            image: absoluteAvatar,
            ...({ fullName: fullName ?? userName } as Record<string, unknown>),
        },
        token,
    );

    try {
        await client.upsertUser({
            id: userId,
            name: userName,
            image: absoluteAvatar,
            fullName: fullName ?? userName,
        } as any);
    } catch (err) {
        console.warn('[StreamClient] upsertUser failed:', err);
    }

    saveStreamCredentials({
        apiKey,
        token,
        userId,
        userName,
        avatar: absoluteAvatar,
        fullName,
    });
};

export const disconnectStreamUser = async (): Promise<void> => {
    if (clientInstance?.userID) {
        await clientInstance.disconnectUser();
        clearStreamCredentials();
        clientInstance = null;
    }
};
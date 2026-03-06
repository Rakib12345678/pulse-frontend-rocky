import { StreamChat } from 'stream-chat';
import { saveStreamCredentials, clearStreamCredentials } from './streamCredentials';

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
    userId:   string,
    userName: string,
    avatar:   string,
    apiKey:   string,
    token:    string,
    fullName?: string,
): Promise<void> => {
    const client = getStreamClient(apiKey);
    if (client.userID === userId) return;
    if (client.userID) await client.disconnectUser();

    await client.connectUser(
        {
            id:    userId,
            name:  userName,
            image: avatar,
            ...({ fullName: fullName ?? userName } as Record<string, unknown>),
        },
        token,
    );

    saveStreamCredentials({ apiKey, token, userId, userName, avatar, fullName });
};

export const disconnectStreamUser = async (): Promise<void> => {
    if (clientInstance?.userID) {
        await clientInstance.disconnectUser();
        clearStreamCredentials();
        clientInstance = null;
    }
};
import { StreamChat } from 'stream-chat';

let _client: StreamChat | null = null;

export const getStreamClient = (): StreamChat => {
    if (!_client) throw new Error('[StreamClient] Not initialised — call connectStreamUser first');
    return _client;
};

export const isStreamConnected = (): boolean =>
    !!_client && !!_client.userID;
export const connectStreamUser = async (
    userId:   string,
    userName: string,
    avatar:   string,
    apiKey:   string,
    token:    string,
    fullName?: string,
): Promise<void> => {
    // Reuse existing client if already connected as the same user
    if (_client?.userID === userId) return;

    // Disconnect any previous session cleanly
    if (_client) {
        await _client.disconnectUser().catch(() => {});
        _client = null;
    }

    _client = StreamChat.getInstance(apiKey);

    await _client.connectUser(
        {
            id:   userId,
            name: fullName?.trim() || userName,
            username: userName,
            image: avatar,
            ...(fullName?.trim() ? { fullName: fullName.trim() } : {}),
        },
        token,
    );
};

export const disconnectStreamUser = async (): Promise<void> => {
    if (!_client) return;
    await _client.disconnectUser().catch(() => {});
    _client = null;
};
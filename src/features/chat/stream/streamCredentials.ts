export interface StreamCredentials {
    apiKey: string;
    token: string;
    userId: string;
    userName: string;
    avatar: string;
    fullName?: string;
}

let _credentials: StreamCredentials | null = null;

export const saveStreamCredentials = (creds: StreamCredentials): void => {
    _credentials = creds;
};

export const loadStreamCredentials = (): StreamCredentials | null => _credentials;

export const clearStreamCredentials = (): void => {
    _credentials = null;
};
const STORAGE_KEY = 'stream_creds';

export interface StreamCredentials {
    apiKey:    string;
    token:     string;
    userId:    string;
    userName:  string;
    avatar:    string;
    fullName?: string;
}

export const saveStreamCredentials = (creds: StreamCredentials): void => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
};

export const loadStreamCredentials = (): StreamCredentials | null => {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
};

export const clearStreamCredentials = (): void => {
    sessionStorage.removeItem(STORAGE_KEY);
};
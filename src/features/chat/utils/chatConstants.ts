/** Per-user translate toggle: localStorage */
export const TRANSLATE_KEY = (uid: string | number) => `chat:translate:${uid}`;

/** Pinned conversation IDs: sessionStorage */
export const PINNED_STORAGE_KEY = 'chat_pinned';

/** Active conversation for current tab: sessionStorage */
export const SESSION_ACTIVE_KEY = 'chat_active';

/** Stream SDK credentials: sessionStorage */
export const STREAM_CREDS_KEY = 'stream_creds';
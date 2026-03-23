export const TRANSLATE_KEY = (uid: string | number) => `chat:translate:${uid}`;

/** Pinned conversation IDs — sessionStorage, tab-scoped */
export const PINNED_STORAGE_KEY = 'chat_pinned';

/** Active conversation for current tab — sessionStorage, restored on refresh */
export const SESSION_ACTIVE_KEY = 'chat_active';

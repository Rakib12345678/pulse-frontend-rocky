export const TRANSLATE_KEY = (uid: string | number) => `chat:translate:${uid}`;

/** Pinned conversation IDs — sessionStorage, tab-scoped */
export const PINNED_STORAGE_KEY = 'chat_pinned';

/** Active conversation for current tab — sessionStorage, restored on refresh */
export const SESSION_ACTIVE_KEY = 'chat_active';

/** Muted conversation IDs — sessionStorage */
export const MUTED_STORAGE_KEY = 'chat_muted';

/** Archived conversation IDs — sessionStorage */
export const ARCHIVED_STORAGE_KEY = 'chat_archived';

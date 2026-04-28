export const queryKeys = {
    auth: {
        all: ['auth'] as const,
        user: () => [...queryKeys.auth.all, 'user'] as const,
    },
    live: {
        all: ['live'] as const,
        detail: (id: string) => [...queryKeys.live.all, id] as const,
        feed: () => [...queryKeys.live.all, 'feed'] as const,
    },
    chat: {
        all: ['chat'] as const,
        list: () => [...queryKeys.chat.all, 'list'] as const,
        messages: (id: string) => [...queryKeys.chat.all, 'messages', id] as const,
    },
    reports: {
        all: ['reports'] as const,
        reasons: () => [...queryKeys.reports.all, 'reasons'] as const,
    },
}

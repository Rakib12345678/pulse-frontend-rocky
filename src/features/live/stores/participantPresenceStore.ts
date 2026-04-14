import { create } from 'zustand';

const PRESENCE_TIMEOUT_MS = 20_000; // 20 seconds

interface ParticipantPresenceState {
    /** Map of userId -> last active timestamp */
    lastActiveMap: Record<string, number>;
    /** Mark a user as active (sets their timestamp to now) */
    markActive: (userId: string) => void;
    /** Mark a user as inactive (removes their entry) */
    markInactive: (userId: string) => void;
    /** Returns true if the user has heartbeated within the timeout */
    isActive: (userId: string) => boolean;
    /** Get all user IDs that are currently active */
    getActiveUserIds: () => string[];
    /** Prune stale entries older than the timeout */
    pruneStale: () => void;
    /** Clear all entries (for cleanup on unmount) */
    clear: () => void;
}

export const useParticipantPresenceStore = create<ParticipantPresenceState>((set, get) => ({
    lastActiveMap: {},

    markActive: (userId: string) => {
        set((state) => ({
            lastActiveMap: {
                ...state.lastActiveMap,
                [userId]: Date.now(),
            },
        }));
    },

    markInactive: (userId: string) => {
        set((state) => {
            const { [userId]: _, ...rest } = state.lastActiveMap;
            return { lastActiveMap: rest };
        });
    },

    isActive: (userId: string) => {
        const ts = get().lastActiveMap[userId];
        if (!ts) return false;
        return Date.now() - ts < PRESENCE_TIMEOUT_MS;
    },

    getActiveUserIds: () => {
        const now = Date.now();
        const map = get().lastActiveMap;
        return Object.entries(map)
            .filter(([, ts]) => now - ts < PRESENCE_TIMEOUT_MS)
            .map(([id]) => id);
    },

    pruneStale: () => {
        const now = Date.now();
        set((state) => {
            const pruned: Record<string, number> = {};
            for (const [id, ts] of Object.entries(state.lastActiveMap)) {
                if (now - ts < PRESENCE_TIMEOUT_MS) {
                    pruned[id] = ts;
                }
            }
            return { lastActiveMap: pruned };
        });
    },

    clear: () => {
        set({ lastActiveMap: {} });
    },
}));

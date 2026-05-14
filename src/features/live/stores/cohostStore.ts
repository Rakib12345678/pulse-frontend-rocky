import { create } from 'zustand';

interface CohostState {
    cohostIds: Set<string>;
    addCohost: (userId: string) => void;
    removeCohost: (userId: string) => void;
    setCohosts: (userIds: string[]) => void;
    clearAll: () => void;
}

export const useCohostStore = create<CohostState>((set) => ({
    cohostIds: new Set<string>(),
    addCohost: (userId) => set((state) => {
        const next = new Set(state.cohostIds);
        next.add(userId);
        return { cohostIds: next };
    }),
    removeCohost: (userId) => set((state) => {
        const next = new Set(state.cohostIds);
        next.delete(userId);
        return { cohostIds: next };
    }),
    setCohosts: (userIds) => set(() => ({
        cohostIds: new Set(userIds)
    })),
    clearAll: () => set({ cohostIds: new Set() }),
}));
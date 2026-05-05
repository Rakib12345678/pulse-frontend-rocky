import { create } from 'zustand';

interface ViewerVisibilityState {
    hiddenUsers: Set<string>;
    setHidden: (userId: string) => void;
    setVisible: (userId: string) => void;
    clear: () => void;
}

export const useViewerVisibilityStore = create<ViewerVisibilityState>((set) => ({
    hiddenUsers: new Set(),

    setHidden: (userId: string) => set((state) => {
        const newSet = new Set(state.hiddenUsers);
        newSet.add(userId);
        return { hiddenUsers: newSet };
    }),

    setVisible: (userId: string) => set((state) => {
        const newSet = new Set(state.hiddenUsers);
        newSet.delete(userId);
        return { hiddenUsers: newSet };
    }),

    clear: () => set({ hiddenUsers: new Set() }),
}));
import { create } from 'zustand';

interface UserProfileStore {
    isOpen: boolean;
    username: string | null;
    showFullscreen: boolean;
    openModal: (username: string) => void;
    closeModal: () => void;
    setShowFullscreen: (show: boolean) => void;
}

export const useUserProfileStore = create<UserProfileStore>((set) => ({
    isOpen: false,
    username: null,
    showFullscreen: false,
    openModal: (username) => set({ isOpen: true, username, showFullscreen: false }),
    closeModal: () => set({ isOpen: false, username: null, showFullscreen: false }),
    setShowFullscreen: (show) => set({ showFullscreen: show }),
}));

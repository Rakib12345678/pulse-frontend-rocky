import { create } from 'zustand';

interface UserProfileStore {
    isOpen: boolean;
    username: string | null;
    openModal: (username: string) => void;
    closeModal: () => void;
}

export const useUserProfileStore = create<UserProfileStore>((set) => ({
    isOpen: false,
    username: null,
    openModal: (username) => set({ isOpen: true, username }),
    closeModal: () => set({ isOpen: false, username: null }),
}));

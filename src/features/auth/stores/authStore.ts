import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: number;
  email: string;
  phone?: string;
  googleId?: string;
  status: string;
  emailVerified: boolean;
  eighteenPlus: boolean;
  followerCount: number,
  followingCount: number,
  postCount: number,
  username?: string;
  displayName?: string;
  fullName?: string;
  bio?: string;
  location?: string;
  profileImage?: string;
  coins?: number;
  followedByMe?: boolean;
  preferredLanguage?: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
  isHydrated: boolean;
  setAuth: (payload: { accessToken: string; refreshToken: string; user: User; newUser: boolean }) => void;
  updateUser: (userData: Partial<User>) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null, 
      user: null,
      isAuthenticated: false,
      isNewUser: false,

      setAuth: (payload) => set({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken, 
        user: payload.user,
        isNewUser: payload.newUser,
        isAuthenticated: true,
      }),

      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),

      clearAuth: () => set({
        accessToken: null,
        refreshToken: null, 
        user: null,
        isAuthenticated: false,
        isNewUser: false,
      }),

      isHydrated: false,
      setHydrated: () => set({ isHydrated: true }),
    }),
    { 
      name: 'auth-storage',
      partialize: (state) => ({ 
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user, 
        isNewUser: state.isNewUser,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      }
    }
  )
);
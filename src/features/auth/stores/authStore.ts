import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Wallet {
  coinBalance: number;
  diamondBalance: number;
}

export type OnboardingState =
  | 'EIGHTEEN_PLUS_UPDATE'
  | 'PROFILE_DETAILS'
  | 'INTEREST_UPDATE'
  | 'COMPLETED';

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
  isDefaultImage?: boolean;
  coins?: number;
  followedByMe?: boolean;
  preferredLanguage?: string;
  onboardingState?: OnboardingState;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  wallet: Wallet | null;
  isAuthenticated: boolean;
  isNewUser: boolean;
  isHydrated: boolean;
  setAuth: (payload: { accessToken: string; refreshToken: string; user: User; newUser: boolean; wallet: Wallet }) => void;
  updateUser: (userData: Partial<User>) => void;
  updateWallet: (walletData: Partial<Wallet>) => void;
  clearAuth: () => void;
  setAuthenticated: (val: boolean) => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      wallet: null,
      isAuthenticated: false,
      isNewUser: false,

      setAuth: (payload) => set({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
        wallet: payload.wallet,
        isNewUser: payload.newUser,
        isAuthenticated: !payload.user?.onboardingState ||
          payload.user?.onboardingState === 'COMPLETED' ||
          payload.user?.onboardingState === 'INTEREST_UPDATE',
      }),

      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),

      updateWallet: (walletData) => set((state) => ({
        wallet: state.wallet ? { ...state.wallet, ...walletData } : (walletData as Wallet)
      })),

      setAuthenticated: (val) => set({ isAuthenticated: val }),

      clearAuth: () => set({
        accessToken: null,
        refreshToken: null,
        user: null,
        wallet: null,
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
        wallet: state.wallet,
        isNewUser: state.isNewUser,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      }
    }
  )
);
import { create } from 'zustand';
import type { CoinPackage } from '../coinPackages';
import { paymentService, type SessionStatusResponse } from '../services/payment.service';
import { useAuthStore } from '@/features/auth/stores/authStore';

export type CoinsStep = 'select' | 'checkout' | 'result';
export type ResultStatus = 'loading' | 'success' | 'failure' | 'expired';

interface CoinsState {
  isOpen: boolean;
  step: CoinsStep;
  selectedPackage: CoinPackage | null;
  resultStatus: ResultStatus;
  sessionData: SessionStatusResponse | null;

  openModal: () => void;
  closeModal: () => void;
  setStep: (step: CoinsStep) => void;
  selectPackage: (pkg: CoinPackage) => void;
  setResultStatus: (status: ResultStatus) => void;
  reset: () => void;
  handleStripeRedirect: (sessionId: string, status: string) => Promise<void>;
}

export const useCoinsStore = create<CoinsState>((set) => ({
  isOpen: false,
  step: 'select',
  selectedPackage: null,
  resultStatus: 'success',
  sessionData: null,

  openModal: () => set({ isOpen: true, step: 'select', selectedPackage: null, sessionData: null }),
  closeModal: () => set({ isOpen: false }),
  setStep: (step) => set({ step }),
  selectPackage: (pkg) => set({ selectedPackage: pkg, step: 'checkout' }),
  setResultStatus: (status) => set({ resultStatus: status }),
  reset: () => set({ step: 'select', selectedPackage: null, resultStatus: 'success', sessionData: null }),

  handleStripeRedirect: async (sessionId: string, stripeReturnStatus: string) => {
    let restoredPackage = null;
    try {
      const stored = localStorage.getItem('pulse_pending_coin_package');
      if (stored) {
        restoredPackage = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to restore package:', e);
    }

    // Open modal directly to result view with loading state
    set({
      isOpen: true,
      step: 'result',
      resultStatus: 'loading',
      selectedPackage: restoredPackage,
      sessionData: null
    });

    if (!sessionId) {
      set({ resultStatus: 'failure' });
      return;
    }

    if (stripeReturnStatus === 'cancel') {
      set({ resultStatus: 'failure' });
      return;
    }

    try {
      const res = await paymentService.getSessionStatus(sessionId);
      const backendStatus = res.status?.toUpperCase();

      if (backendStatus === 'SUCCESS' || backendStatus === 'SUCCEEDED' || backendStatus === 'COMPLETE') {
        set({ resultStatus: 'success', sessionData: res });
        // Refresh wallet balance
        try {
          const wallet = await paymentService.getWalletBalance();
          useAuthStore.getState().updateWallet(wallet);
          // Note: consumer components should invalidate ['walletBalance'] if needed
        } catch (err) {
          console.error('Failed to refresh wallet:', err);
        }
      } else if (backendStatus === 'EXPIRED') {
        set({ resultStatus: 'expired', sessionData: res });
      } else {
        set({ resultStatus: 'failure', sessionData: res });
      }
    } catch (error) {
      console.error('Failed to verify session status:', error);
      set({ resultStatus: 'failure' });
    }
  }
}));

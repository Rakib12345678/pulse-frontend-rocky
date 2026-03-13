import { create } from 'zustand';
import type { CoinPackage } from '../coinPackages';

export type CoinsStep = 'select' | 'checkout' | 'result';
export type PaymentMethod = 'card' | 'upi';
export type ResultStatus = 'success' | 'failure';

interface CoinsState {
  isOpen: boolean;
  step: CoinsStep;
  selectedPackage: CoinPackage | null;
  paymentMethod: PaymentMethod;
  resultStatus: ResultStatus;

  openModal: () => void;
  closeModal: () => void;
  setStep: (step: CoinsStep) => void;
  selectPackage: (pkg: CoinPackage) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setResultStatus: (status: ResultStatus) => void;
  reset: () => void;
}

export const useCoinsStore = create<CoinsState>((set) => ({
  isOpen: false,
  step: 'select',
  selectedPackage: null,
  paymentMethod: 'card',
  resultStatus: 'success',

  openModal: () => set({ isOpen: true, step: 'select', selectedPackage: null, paymentMethod: 'card' }),
  closeModal: () => set({ isOpen: false }),
  setStep: (step) => set({ step }),
  selectPackage: (pkg) => set({ selectedPackage: pkg, step: 'checkout' }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setResultStatus: (status) => set({ resultStatus: status }),
  reset: () => set({ step: 'select', selectedPackage: null, paymentMethod: 'card', resultStatus: 'success' }),
}));

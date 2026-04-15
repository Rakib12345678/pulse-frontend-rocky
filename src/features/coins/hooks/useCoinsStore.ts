import { create } from 'zustand';
import type { CoinPackage } from '../coinPackages';

export type CoinsStep = 'select' | 'checkout' | 'result';
export type ResultStatus = 'success' | 'failure';

interface CoinsState {
  isOpen: boolean;
  step: CoinsStep;
  selectedPackage: CoinPackage | null;
  resultStatus: ResultStatus;

  openModal: () => void;
  closeModal: () => void;
  setStep: (step: CoinsStep) => void;
  selectPackage: (pkg: CoinPackage) => void;
  setResultStatus: (status: ResultStatus) => void;
  reset: () => void;
}

export const useCoinsStore = create<CoinsState>((set) => ({
  isOpen: false,
  step: 'select',
  selectedPackage: null,
  resultStatus: 'success',

  openModal: () => set({ isOpen: true, step: 'select', selectedPackage: null }),
  closeModal: () => set({ isOpen: false }),
  setStep: (step) => set({ step }),
  selectPackage: (pkg) => set({ selectedPackage: pkg, step: 'checkout' }),
  setResultStatus: (status) => set({ resultStatus: status }),
  reset: () => set({ step: 'select', selectedPackage: null, resultStatus: 'success' }),
}));

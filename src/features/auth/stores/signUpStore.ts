import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SignUpStep =
    | 'welcome'
    | 'input'
    | 'otp'
    | 'age'
    | 'details'
    | 'interests';

interface SignUpState {
    isOpen: boolean;
    currentStep: SignUpStep;
    mode: 'signup' | 'login';
    // Form Data
    method: 'phone' | 'email';
    countryCode: string;
    identifier: string;
    isAdult: boolean;
    googleIdToken: string | null;
    onAgeVerified?: () => void;

    // Pause/resume for legal pages
    pausedForLegal: boolean;

    // Actions
    openModal: () => void;
    closeModal: () => void;
    pauseModal: () => void;
    resumeModal: () => void;
    setStep: (step: SignUpStep) => void;
    setMode: (mode: 'signup' | 'login') => void;
    setMethod: (method: 'phone' | 'email') => void;
    setCountryCode: (code: string) => void;
    setIdentifier: (val: string) => void;
    setIsAdult: (val: boolean) => void;
    setGoogleIdToken: (token: string | null) => void;
    setOnAgeVerified: (cb: () => void) => void;
    reset: () => void;
}

export const useSignUpStore = create<SignUpState>()(
    persist(
        (set) => ({
            isOpen: false,
            currentStep: 'welcome',
            mode: 'signup',
            method: 'phone',
            countryCode: '+91',
            identifier: '',
            isAdult: false,
            googleIdToken: null,
            onAgeVerified: undefined,
            pausedForLegal: false,

            openModal: () => set({ isOpen: true }),
            closeModal: () => set({
                isOpen: false,
                currentStep: 'welcome',
                pausedForLegal: false,
            }),
            pauseModal: () => set({ isOpen: false, pausedForLegal: true }),
            resumeModal: () => set({ isOpen: true, pausedForLegal: false }),
            setStep: (step) => set({ currentStep: step }),
            setMode: (mode) => set({ mode }),
            setMethod: (method) => set({ method }),
            setCountryCode: (code) => set({ countryCode: code }),
            setIdentifier: (val) => set({ identifier: val }),
            setIsAdult: (val) => set({ isAdult: val }),
            setGoogleIdToken: (token) => set({ googleIdToken: token }),
            setOnAgeVerified: (cb) => set({ onAgeVerified: cb }),

            reset: () => set({
                currentStep: 'welcome',
                mode: 'signup',
                method: 'phone',
                countryCode: '+91',
                identifier: '',
                isAdult: false,
                googleIdToken: null,
                onAgeVerified: undefined,
                pausedForLegal: false,
            }),
        }),
        {
            name: 'signup-storage',
            partialize: (state) => ({
                isOpen: state.isOpen,
                currentStep: state.currentStep,
                pausedForLegal: state.pausedForLegal,
            }),
            // On rehydration: if modal was not open, reset step to welcome
            onRehydrateStorage: () => (state) => {
                if (state && !state.isOpen && !state.pausedForLegal) {
                    state.currentStep = 'welcome';
                }
            },
        }
    )
);
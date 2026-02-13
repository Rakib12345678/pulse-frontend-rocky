import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SignUpStep =
    | 'welcome'
    | 'input'
    | 'otp'
    | 'age'
    | 'details';

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

    // Actions
    openModal: () => void;
    closeModal: () => void;
    setStep: (step: SignUpStep) => void;
    setMode: (mode: 'signup' | 'login') => void;
    setMethod: (method: 'phone' | 'email') => void;
    setCountryCode: (code: string) => void;
    setIdentifier: (val: string) => void;
    setIsAdult: (val: boolean) => void; // Added setter
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

            openModal: () => set({ isOpen: true }),
            closeModal: () => set({ isOpen: false }),
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
                onAgeVerified: undefined
            }),
        }),
        {
            name: 'signup-storage',
            partialize: (state) => ({
                currentStep: state.currentStep,
            }),
        }
    )
);
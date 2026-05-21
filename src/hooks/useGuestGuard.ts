import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';

/**
 * Opens the auth modal (sign-up → input step) — safe to call from any
 * event handler, no React context needed.
 */
export const openAuthModal = () => {
    const { openModal, setStep, setMode } = useSignUpStore.getState();
    setMode('signup');
    setStep('input');
    openModal();
};

/**
 * Hook that exposes `isGuest` and a `guardAction` helper.
 *
 * Usage:
 *   const { isGuest, guardAction } = useGuestGuard();
 *   guardAction(() => navigate(...)); // runs callback only when authenticated
 */
export const useGuestGuard = () => {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

    const guardAction = (fn?: () => void): boolean => {
        if (!isAuthenticated) {
            openAuthModal();
            return false;
        }
        fn?.();
        return true;
    };

    return { isGuest: !isAuthenticated, guardAction };
};

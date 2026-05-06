import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import type { OnboardingState } from '@/features/auth/stores/authStore';

export function useAuth() {
    const setAuth = useAuthStore((s) => s.setAuth);
    const setShowSuspendedModal = useAuthStore((s) => s.setShowSuspendedModal);

    // Sign Up Store Actions
    const closeSignUp = useSignUpStore((s) => s.closeModal);
    const setSignUpStep = useSignUpStore((s) => s.setStep);

    const navigate = useNavigate();

    const processAuth = useMutation({
        mutationFn: async ({ url, payload, redirect = true }: { url: string; payload: any; redirect?: boolean }) => {
            const res = await api.post(url, payload);
            return { ...res.data, redirect };
        },
        onSuccess: (data) => {
            setAuth({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                user: data.user,
                wallet: data.wallet,
                newUser: data.newUser
            });

            const onboardingState: OnboardingState | undefined = data.user?.onboardingState;

            if (onboardingState && onboardingState !== 'COMPLETED') {
                // User has a pending onboarding step — route them to the correct step.
                if (onboardingState === 'EIGHTEEN_PLUS_UPDATE') {
                    setSignUpStep('age');
                } else if (onboardingState === 'PROFILE_DETAILS') {
                    setSignUpStep('details');
                } else if (onboardingState === 'INTEREST_UPDATE') {
                    setSignUpStep('interests');
                }
            } else {
                // Onboarding complete — close modal and optionally navigate
                closeSignUp();
                console.log('useAuth: onSuccess', { newUser: data.newUser, redirect: data.redirect, onboardingState });
                if (data.redirect !== false) {
                    console.log('useAuth: Redirecting to /for-you');
                    navigate({ to: '/for-you' });
                } else {
                    console.log('useAuth: Redirect suppressed');
                }
                if (data.redirect !== false) {
                    toast.success("Welcome back!");
                }
            }
        },
        onError: (err: any) => {
            const status = err.response?.status;
            const msg: string = err.response?.data?.message || "";
            const isSuspended =
                status === 403 &&
                msg.toLowerCase().includes('suspended');

            if (isSuspended) {
                closeSignUp();
                setShowSuspendedModal(true);
            } else {
                toast.error(msg || "Authentication failed. Please try again.");
            }
        }
    });

    return {
        authenticate: processAuth.mutate,
        isLoading: processAuth.isPending
    };
}
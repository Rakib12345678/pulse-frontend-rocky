import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';

export function useAuth() {
    const setAuth = useAuthStore((s) => s.setAuth);
    
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

            if (data.newUser) {
                // New user - continue with signup flow at age step
                setSignUpStep('age');
                toast.success("Account created! Please verify your age.");
            } else {
                // Existing user - close modal and navigate to home
                closeSignUp();
                console.log('useAuth: onSuccess', { newUser: data.newUser, redirect: data.redirect });
                if (data.redirect !== false) {
                    console.log('useAuth: Redirecting to /for-you');
                    navigate({ to: '/for-you' });
                } else {
                    console.log('useAuth: Redirect suppressed');
                }
                // Only show welcome back toast if it's an explicit login action (redirect is true)
                if (data.redirect !== false) {
                    toast.success("Welcome back!");
                }
            }
        },
        onError: (err: any) => {
            const msg = err.response?.data?.message || "Authentication failed. Please try again.";
            toast.error(msg);
        }
    });

    return { 
        authenticate: processAuth.mutate, 
        isLoading: processAuth.isPending 
    };
}
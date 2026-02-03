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
        mutationFn: async ({ url, payload }: { url: string; payload: any }) => {
            const res = await api.post(url, payload);
            return res.data;
        },
        onSuccess: (data) => {
            setAuth({
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                user: data.user,
                newUser: data.newUser
            });

            if (data.newUser) {
                // New user - continue with signup flow at age step
                setSignUpStep('age');
                toast.success("Account created! Please verify your age.");
            } else {
                // Existing user - close modal and navigate to home
                closeSignUp();
                navigate({ to: '/for-you' });
                toast.success("Welcome back!");
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
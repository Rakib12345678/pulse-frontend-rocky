import api from '@/lib/api';

// Types
export interface SignUpPayload {
    method: 'phone' | 'email';
    identifier: string; // phone number or email addres
}

export interface VerifyOtpPayload {
    identifier: string;
    otp: string;
}

export interface ProfilePayload {
    username?: string;
    fullName: string;
    location: string;
    bio: string;
    profileImage?: string;
    eighteenPlus?: boolean;
}

export const authService = {
    // 1. Send OTP / Initiate Signup
    initiateSignup: async (payload: SignUpPayload) => {
        if (payload.method === 'email') {
            return api.post('/otp/send', { email: payload.identifier });
        }
        console.log('API: Sending OTP to Phone', payload.identifier);
        return new Promise((resolve) => setTimeout(resolve, 1000));
    },

    // Resend OTP
    resendOtp: async (identifier: string, method: 'email' | 'phone') => {
        if (method === 'email') {
            return api.post('/otp/resend', { email: identifier });
        }
        console.log('API: Resending OTP to Phone', identifier);
        return new Promise((resolve) => setTimeout(resolve, 1000));
    },

    // 2. Verify OTP
    verifyOtp: async (payload: VerifyOtpPayload) => {
        return api.post('/otp/verify', {
            email: payload.identifier,
            otp: payload.otp
        });
    },

    // Check Username Availability
    checkUsernameAvailable: async (username: string) => {
        const response = await api.get('/users/username-available', {
            params: { username }
        });
        return response.data;
    },

    // 3. Update Profile Details
    updateProfile: async (payload: ProfilePayload) => {
        return api.put('/users/me', payload);
    },

    // 4. Get Categories
    getCategories: async () => {
        const response = await api.get('/categories');
        return response.data as { id: number; name: string; createdAt: string; updatedAt: string }[];
    },

    // 5. Set Interests
    setInterests: async (categories: string[]) => {
        return api.put('/users/me/interests', { categories });
    },

    // 6. Update 18+ Consent (for OAuth users)
    updateAgeConsent: async (eighteenPlus: boolean) => {
        return api.put('/users/me/18plus-consent', { eighteenPlus });
    }
};
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
    username: string;
    displayName: string;
    location: string;
    bio: string;
    avatar?: File | string | null;
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

    // 3. Update Profile Details
    updateProfile: async (payload: ProfilePayload) => {
        //TODO with backend put later on
        console.log('API: Updating profile', payload);
        return new Promise((resolve) => setTimeout(resolve, 1000));
    },

    // 4. Set Interests
    //TODO with backend later on
    setInterests: async (interests: string[]) => {
        console.log('API: Setting interests', interests);
        return new Promise((resolve) => setTimeout(resolve, 1000));
    },

    // 5. Update 18+ Consent (for OAuth users)
    updateAgeConsent: async (eighteenPlus: boolean) => {
        return api.put('/users/me/18plus-consent', { eighteenPlus });
    }
};
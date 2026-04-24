import api from '@/lib/api';

export interface CheckoutSessionRequest {
    coinId: number;
    successUrl?: string;
    cancelUrl?: string;
}

export interface CheckoutSessionResponse {
    sessionId: string;
    checkoutUrl: string;
    clientSecret?: string;
    publishableKey?: string;
    status?: string;
    amount?: number;
    coins?: number;
    currency?: string;
}

export interface SessionStatusResponse {
    paymentIntentId: string;
    status: string;
    providerPaymentId: string;
    amount: number;
    coins: number;
    currency: string;
}

export interface WalletResponse {
    coinBalance: number;
    diamondBalance: number;
}

export type TransactionType = 'coin' | 'diamond';

export interface WalletHistoryItem {
    fullname: string;
    username: string;
    noOfCoin: number;
    isSent: boolean;
    createdAt: string;
    sentOn?: string;
}

export interface WalletHistoryPage {
    items: WalletHistoryItem[];
    page: number;
    size: number;
    hasMore: boolean;
}

export type WalletHistoryFilter = 'all' | 'credit' | 'debit';

export interface EarningHistoryItem {
    fullname: string;
    username: string;
    noOfCoin: number;
    isSent: boolean;
    createdAt: string;
    sentOn?: string;
}

export interface EarningHistoryPage {
    items: EarningHistoryItem[];
    page: number;
    size: number;
    hasMore: boolean;
}

export type EarningHistoryFilter = 'all' | 'diamond_received' | 'diamond_withdrawn';

export interface PayoutAccountResponse {
    status: 'NOT_STARTED' | 'ONBOARDING_IN_PROGRESS' | 'REQUIRES_INFORMATION' | 'UNDER_REVIEW' | 'PAYOUTS_ENABLED' | 'DISABLED';
    bankDetails?: {
        last4: string;
        bankName: string;
    };
}

export interface OnboardingLinkRequest {
    returnUrl: string;
    refreshUrl: string;
    country: string;
}

export interface OnboardingLinkResponse {
    onboardingUrl: string;
}

export interface WithdrawalRequest {
    amount: number;
    currency: string;
}

export const paymentService = {
    /**
     * Create a Stripe Checkout Session
     */
    createCheckoutSession: async (data: CheckoutSessionRequest): Promise<CheckoutSessionResponse> => {
        const response = await api.post('/payments/checkout-session', data);
        return response.data;
    },

    /**
     * Get the final status of a Stripe session (called after redirect back)
     */
    getSessionStatus: async (sessionId: string): Promise<SessionStatusResponse> => {
        const response = await api.get('/payments/session-status', {
            params: { sessionId }
        });
        return response.data;
    },

    getWalletBalance: async (): Promise<WalletResponse> => {
        const response = await api.get('/users/wallet');
        return response.data;
    },

    getWalletHistory: async (
        filter: WalletHistoryFilter,
        page: number,
        size = 20
    ): Promise<WalletHistoryPage> => {
        const params: Record<string, unknown> = { page, size };
        if (filter !== 'all') params.filter = filter;

        const response = await api.get('/users/wallet/history', { params });
        const raw: WalletHistoryItem[] = response.data ?? [];

        return {
            items: raw,
            page,
            size,
            hasMore: raw.length === size,
        };
    },

    getWithdrawThreshold: async (): Promise<{ threshold: number }> => {
        const response = await api.get('/users/wallet/earning/withdraw-threshold');
        return response.data;
    },

    /**
     * Fetch diamond earning/withdrawal history
     */
    getEarningHistory: async (
        filter: EarningHistoryFilter,
        page: number,
        size = 20
    ): Promise<EarningHistoryPage> => {
        const params: Record<string, unknown> = { filter, page, size };
        const response = await api.get('/users/wallet/earning/history', { params });
        const raw: EarningHistoryItem[] = response.data ?? [];

        return {
            items: raw,
            page,
            size,
            hasMore: raw.length === size,
        };
    },

    /**
     * Stripe Connect Payouts (Commented out)
     */
    /* 
    getPayoutAccount: async (): Promise<PayoutAccountResponse> => {
        const response = await api.get('/creator-payouts/account');
        return response.data;
    },

    createOnboardingLink: async (data: OnboardingLinkRequest): Promise<OnboardingLinkResponse> => {
        const response = await api.post('/creator-payouts/account-link', data);
        return response.data;
    },

    requestWithdrawal: async (data: WithdrawalRequest): Promise<any> => {
        const response = await api.post('/creator-payouts/withdrawals', data);
        return response.data;
    },
    */
};

import api from '@/lib/api';

export interface CreateOrderResponse {
    orderId: string;
    amount: number;
}

export interface PaymentRequest {
    orderId: string;
    amount: number;
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
    noOfCoin: number; // For diamonds, this is number of diamonds
    isSent: boolean;
    createdAt: string;
}

export interface EarningHistoryPage {
    items: EarningHistoryItem[];
    page: number;
    size: number;
    hasMore: boolean;
}

export type EarningHistoryFilter = 'all' | 'diamond_received' | 'diamond_withdrawn';

export const paymentService = {
    createOrder: async (coinId: string | number): Promise<CreateOrderResponse> => {
        const response = await api.post('/create-order', { coinId: Number(coinId) });
        return response.data;
    },

    processPayment: async (data: PaymentRequest): Promise<void> => {
        const response = await api.post('/payment', data);
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
};

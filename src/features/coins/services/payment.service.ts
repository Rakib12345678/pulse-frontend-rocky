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

export const paymentService = {
    /**
     * Create a new order for a coin package
     */
    createOrder: async (coinId: string | number): Promise<CreateOrderResponse> => {
        const response = await api.post('/create-order', { coinId: Number(coinId) });
        return response.data;
    },

    /**
     * Process actual payment for an order
     */
    processPayment: async (data: PaymentRequest): Promise<void> => {
        const response = await api.post('/payment', data);
        return response.data;
    },

    /**
     * Fetch user's current wallet balance
     */
    getWalletBalance: async (): Promise<WalletResponse> => {
        const response = await api.get('/users/wallet');
        return response.data;
    }
};

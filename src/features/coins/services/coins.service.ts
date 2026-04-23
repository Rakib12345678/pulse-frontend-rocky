import api from '@/lib/api';

export interface CoinEntity {
    id: number;
    noOfCoin: number;
    price: number;
    currency: 'DOLLER' | 'INR';
    bannerImage: string;
    badge?: string;
    bonus?: string;
}

export interface CreateCoinRequest {
    noOfCoin: number;
    price: number;
    currency: 'DOLLER' | 'INR';
    bannerImage: string;
}

export const coinsService = {
    /**
     * List coin entities with optional currency filter and pagination
     */
    getCoins: async (currency?: 'DOLLER' | 'INR', page = 0, size = 20): Promise<CoinEntity[]> => {
        const response = await api.get('/coins', {
            params: { currency, page, size }
        });
        return response.data;
    },

    /**
     * Fetch a single coin entity by id
     */
    getCoin: async (id: number): Promise<CoinEntity> => {
        const response = await api.get(`/coins/${id}`);
        return response.data;
    },

    /**
     * Create a new coin entity
     */
    createCoin: async (data: CreateCoinRequest): Promise<CoinEntity> => {
        const response = await api.post('/coins', data);
        return response.data;
    },

    /**
     * Update an existing coin entity
     */
    updateCoin: async (id: number, data: CreateCoinRequest): Promise<CoinEntity> => {
        const response = await api.put(`/coins/${id}`, data);
        return response.data;
    },

    /**
     * Delete a coin entity
     */
    deleteCoin: async (id: number): Promise<void> => {
        await api.delete(`/coins/${id}`);
    }
};

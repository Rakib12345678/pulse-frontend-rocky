import api from '@/lib/api';

export interface GiftEntity {
    id: number;
    name: string;
    iconUrl: string;
    noOfCoin: number;
}

export interface CreateGiftRequest {
    name: string;
    noOfCoin: number;
    iconUrl: string;
}

export interface SendGiftRequest {
    giftId: number;
    callId: string;
    targetUserId: string;
}

export interface SendGiftResponse {
    giftId: number;
    callId: string;
    viewerCoinBalance: number;
}

export const giftsService = {
    /**
     * Fetch all gifts
     */
    getGifts: async (): Promise<GiftEntity[]> => {
        const response = await api.get('/gifts');
        return response.data;
    },

    /**
     * Fetch a single gift by id
     */
    getGift: async (id: number): Promise<GiftEntity> => {
        const response = await api.get(`/gifts/${id}`);
        return response.data;
    },

    /**
     * Add a new gift
     */
    createGift: async (data: CreateGiftRequest): Promise<GiftEntity> => {
        const response = await api.post('/gifts', data);
        return response.data;
    },

    /**
     * Update an existing gift by id
     */
    updateGift: async (id: number, data: CreateGiftRequest): Promise<GiftEntity> => {
        const response = await api.put(`/gifts/${id}`, data);
        return response.data;
    },

    /**
     * Delete a gift by id
     */
    deleteGift: async (id: number): Promise<void> => {
        await api.delete(`/gifts/${id}`);
    },

    /**
     * Send a gift to a live creator
     */
    sendGift: async (data: SendGiftRequest): Promise<SendGiftResponse> => {
        const response = await api.post('/gifts/send', data);
        return response.data;
    }
};

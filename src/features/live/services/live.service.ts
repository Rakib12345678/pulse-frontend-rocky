import api from '@/lib/api';

// Types for GetStream integration
export interface CreateLiveStreamPayload {
    title: string;
    category: string;
}

export interface LiveStreamResponse {
    callId: string;
    callType: string;
    token: string;
}

// Type for stream listing from /stream/feed endpoint
export interface FeedStreamItem {
    username?: string | null;
    callId: string;
    callType: string;
    title: string;
    category?: string | null;
    profileImage: string | null;
    createdByUserId: string;
    participantCount: number;
    followerCount: number;
    createdAt: string;
    isLive: boolean;
    mobileVideoUrl?: string | null;
    thumbnailUrl?: string | null;
    cohosts?: { username: string; profileImage: string; status: string }[];
}

export interface StreamFeedResponse {
    data: FeedStreamItem[];
    nextCursor: string | null;
    hasMore: boolean;
}

export interface JoinStreamResponse {
    callId: string;
    callType: string;
    token: string;
}

export const liveService = {
    // Create and start a live stream
    createLiveStream: async (payload: CreateLiveStreamPayload): Promise<LiveStreamResponse> => {
        try {
            // Updated to match backend swagger: POST /api/stream/go-live
            const response = await api.post('/stream/go-live', payload);
            return response.data;
        } catch (error) {
            console.error('Failed to create live stream:', error);
            throw error;
        }
    },

    // End a live stream
    endLiveStream: async (callId: string, save: boolean = true): Promise<void> => {
        try {
            // Updated to match backend swagger: POST /api/stream/end?callId=...&save=...
            await api.post('/stream/end', null, {
                params: { callId, save }
            });
        } catch (error) {
            console.error('Failed to end live stream:', error);
            throw error;
        }
    },

    // Start recording for a live stream
    startRecording: async (callId: string): Promise<void> => {
        try {
            await api.post('/stream/recording/start', null, {
                params: { callId }
            });
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw error;
        }
    },

    // Update stream settings
    updateStreamSettings: async (streamId: string, settings: Partial<CreateLiveStreamPayload>): Promise<void> => {
        try {
            await api.put(`/live/${streamId}/settings`, settings);
        } catch (error) {
            console.error('Failed to update stream settings:', error);
            throw error;
        }
    },

    // Get GetStream token for client-side SDK
    getStreamToken: async (): Promise<string> => {
        try {
            const response = await api.get('/live/token');
            return response.data.token;
        } catch (error) {
            console.error('Failed to get stream token:', error);
            throw error;
        }
    },

    // Get stream feed with pagination
    getStreamFeed: async (cursor?: string, limit: number = 10): Promise<StreamFeedResponse> => {
        try {
            const response = await api.get('/stream/feed', {
                params: { cursor, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get stream feed:', error);
            throw error;
        }
    },

    joinStream: async (callId: string): Promise<JoinStreamResponse> => {
        try {
            const response = await api.post('/stream/join', null, {
                params: { callId }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to join stream:', error);
            throw error;
        }
    },

    // Add a co-host to the stream
    addCoHost: async (callId: string, username: string): Promise<void> => {
        try {
            await api.post('/stream/cohost/add', { callId, username, add: true });
        } catch (error) {
            console.error('Failed to add co-host:', error);
            throw error;
        }
    },

    // Remove a co-host from the stream
    removeCoHost: async (callId: string, username: string): Promise<void> => {
        try {
            await api.post('/stream/cohost/leave', { callId, username, add: true });
        } catch (error) {
            console.error('Failed to remove co-host:', error);
            throw error;
        }
    },


    syncParticipants: async (callId: string, cohosts: { username: string; profileImage: string; status: string }[]): Promise<void> => {
        try {
            await api.post('/stream/sync-participants', { cohosts }, { params: { callId } });
        } catch (error) {
            console.error('Failed to sync participants:', error);
            throw error;
        }
    },

    getStreamByCallId: async (callId: string): Promise<FeedStreamItem> => {
        try {
            const response = await api.get(`/stream/details`, {
                params: { callId }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get stream details:', error);
            throw error;
        }
    }
};

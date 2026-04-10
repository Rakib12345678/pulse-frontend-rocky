import api from '@/lib/api';

export interface UserProfile {
    id: number;
    username: string;
    fullName: string;
    bio: string;
    location: string;
    profileImage: string;
    status: string;
    eighteenPlus: boolean;
    followerCount: number;
    followingCount: number;
    postCount: number;
    createdAt: string;
    followedByMe: boolean;
    blockedByMe: boolean;
}

export const userService = {
    getUserProfile: async (username: string) => {
        return api.get<UserProfile>(`/users/${username}`);
    },

    followUser: async (targetUserId: number) => {
        return api.post('/users/follow', { targetUserId, follow: true });
    },

    unfollowUser: async (targetUserId: number) => {
        return api.post('/users/unfollow', { targetUserId, follow: true });
    },

    blockUser: async (targetUserId: number) => {
        return api.post('/users/block', { targetUserId, block: true });
    },

    unblockUser: async (targetUserId: number) => {
        return api.post('/users/unblock', { targetUserId, block: false });
    },

    getFollowStatuses: async (users: { userId: number; username: string }[]) => {
        const response = await api.post<{ userId: number; username: string; isFollowing: boolean }[]>('/users/follow/status', users);
        return response.data;
    },

    getUserStream: async (): Promise<{
        isLive: boolean;
        callId: string | null;
        callType: string | null;
        title: string | null;
        category: string | null;
        hasActiveHost?: boolean;
    }> => {
        try {
            const response = await api.get('/users/stream');
            return response.data;
        } catch (error: any) {
            // If the user is not live, the API currently returns a 404.
            if (error.response?.status === 404) {
                return {
                    isLive: false,
                    callId: null,
                    callType: null,
                    title: null,
                    category: null,
                };
            }
            throw error;
        }
    },
};

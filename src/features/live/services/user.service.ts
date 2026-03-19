import api  from '@/lib/api';

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

    // Check if the current authenticated user has an active live stream
    getUserStream: async (): Promise<{
        isLive: boolean;
        callId: string | null;
        callType: string | null;
        title: string | null;
        category: string | null;
        hasActiveHost?: boolean;
    }> => {
        const response = await api.get('/users/stream');
        return response.data;
    },
};

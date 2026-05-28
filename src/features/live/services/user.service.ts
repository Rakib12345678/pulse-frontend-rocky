import api from '@/lib/api';
import { getStreamClient, isStreamConnected, connectStreamUser } from '@/features/chat/stream/streamClient';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { toAbsoluteUrl } from '@/features/chat/utils/chat';

const ensureStreamConnected = async () => {
    if (isStreamConnected()) return getStreamClient();
    
    try {
        const currentUser = useAuthStore.getState().user;
        if (!currentUser) return null;
        
        console.log('[BlockFlow] Stream not connected. Connecting on the fly...');
        const { data } = await api.get<{ token: string }>('/chat/token');
        const userId = String(currentUser.id);
        const userName = currentUser.username ?? userId;
        const avatar = toAbsoluteUrl(currentUser.profileImage);
        const fullName = currentUser.fullName ?? '';
        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        
        await connectStreamUser(userId, userName, avatar, apiKey, data.token, fullName);
        console.log('[BlockFlow] Stream connected successfully on the fly.');
        return getStreamClient();
    } catch (err) {
        console.error('[BlockFlow] Failed to connect Stream on the fly:', err);
        return null;
    }
};

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
    isLive?: boolean;
    callId?: string | null;
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
        const response = await api.post('/users/block', { targetUserId, block: true });

        // Update channel metadata on Stream Chat
        try {
            const client = await ensureStreamConnected();
            if (client) {
                console.log('[BlockFlow] Querying channels for block. Me:', client.userID, 'Target:', targetUserId);
                
                // Query all channels where I am a member (with hidden channels)
                const chans = await client.queryChannels({
                    members: { $in: [client.userID!] }
                } as any, {}, { has_hidden: true } as any);
                
                // Locate the direct channel in-memory to bypass any GetStream parser bugs
                const targetChan = chans.find(c => {
                    const memberIds = Object.keys(c.state.members);
                    return memberIds.includes(String(targetUserId));
                });
                
                if (targetChan) {
                    console.log('[BlockFlow] Found matching channel:', targetChan.cid);
                    console.log('[BlockFlow] Attempting to set metadata blocked_by:', client.userID);
                    try {
                        await targetChan.updatePartial({ set: { blocked_by: client.userID! } } as any);
                    } catch (metaErr) {
                        console.warn('[BlockFlow] Client key restricted from updating channel metadata. Relying on message-based fallback signal.', metaErr);
                    }

                    console.log('[BlockFlow] Sending persistent silent block signal message...');
                    await targetChan.sendMessage({
                        text: 'block_signal',
                        silent: true,
                        custom_type: 'block_signal',
                        blocked_by: client.userID!,
                    } as any);

                    await targetChan.show(); // Ensure channel is visible on both ends
                    console.log('[BlockFlow] Channel successfully blocked, signaled and shown.');
                } else {
                    console.warn('[BlockFlow] No matching channel found between users.');
                }
            }
        } catch (err) {
            console.error('[BlockFlow] Failed to update Stream channel metadata for block:', err);
        }

        window.dispatchEvent(new CustomEvent('stream-blocks-changed'));
        return response;
    },

    unblockUser: async (targetUserId: number) => {
        const response = await api.post('/users/unblock', { targetUserId, block: false });

        // Update channel metadata on Stream Chat
        try {
            const client = await ensureStreamConnected();
            if (client) {
                console.log('[BlockFlow] Querying channels for unblock. Me:', client.userID, 'Target:', targetUserId);
                
                const chans = await client.queryChannels({
                    members: { $in: [client.userID!] }
                } as any, {}, { has_hidden: true } as any);
                
                const targetChan = chans.find(c => {
                    const memberIds = Object.keys(c.state.members);
                    return memberIds.includes(String(targetUserId));
                });
                
                if (targetChan) {
                    console.log('[BlockFlow] Found matching channel:', targetChan.cid);
                    console.log('[BlockFlow] Attempting to unset metadata blocked_by');
                    try {
                        await targetChan.updatePartial({ unset: ['blocked_by'] } as any);
                    } catch (metaErr) {
                        console.warn('[BlockFlow] Client key restricted from updating channel metadata. Relying on message-based fallback signal.', metaErr);
                    }

                    console.log('[BlockFlow] Sending persistent silent unblock signal message...');
                    await targetChan.sendMessage({
                        text: 'unblock_signal',
                        silent: true,
                        custom_type: 'unblock_signal',
                        blocked_by: '',
                    } as any);

                    await targetChan.show(); // Ensure channel is visible on both ends
                    console.log('[BlockFlow] Channel successfully unblocked, signaled and shown.');
                } else {
                    console.warn('[BlockFlow] No matching channel found between users.');
                }
            }
        } catch (err) {
            console.error('[BlockFlow] Failed to update Stream channel metadata for unblock:', err);
        }

        window.dispatchEvent(new CustomEvent('stream-blocks-changed'));
        return response;
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

import api from '@/lib/api';
import { getStreamClient, connectStreamUser } from '../stream/streamClient';
import { channelToConversation } from '../utils/chatMappers';
import type { Conversation, DirectChatResponse, Language, GiftData } from '../types/chat.types';

export const chatService = {

    getConversationById: async (channelCid: string): Promise<Conversation> => {
        const client = getStreamClient();
        const myId   = client.userID ?? '';
        const [type, id] = channelCid.split(':');
        const channel = client.channel(type, id);
        await channel.watch();
        return channelToConversation(channel, myId);
    },

    startDirectChat: async (
        targetUserId: number,
        currentUser: { id: string; name: string; avatar: string },
        targetUser?: { name: string; avatar: string },
    ): Promise<{ channelCid: string }> => {
        const { data } = await api.post<DirectChatResponse>('/chat/direct', { targetUserId });
        const { chatApiKey, chatChannelType, chatChannelId, chatToken } = data;

        await connectStreamUser(currentUser.id, currentUser.name, currentUser.avatar, chatApiKey, chatToken);

        const client  = getStreamClient();
        const channel = client.channel(chatChannelType, chatChannelId);
        await channel.watch();
        if (targetUser?.name) {
            try {
                const safeName = targetUser.name.trim().slice(0, 100);
                if (safeName) {
                    await channel.update({ name: safeName } as any);
                }
            } catch {
                // non-critical — channel already has correct member data
            }
        }

        return { channelCid: channel.cid };
    },

    sendMessage: async (payload: {
        targetUserId: number;
        text: string;
        conversationId: string;
    }): Promise<{ id: string; time: string }> => {
        const { data } = await api.post<any>('/chat/send', {
            targetUserId: payload.targetUserId,
            text:         payload.text,
        });
        const raw = data?.message ?? data;
        return {
            id:   raw?.id   ?? '',
            time: raw?.created_at ?? new Date().toISOString(),
        };
    },

    forwardMessage: async (targetUserId: number, text: string): Promise<void> => {
        try {
            await api.post('/chat/forward', { targetUserId, text });
        } catch (err: any) {
            if (err?.response?.status === 404) {
                const client  = getStreamClient();
                const channel = client.channel('messaging', { members: [client.userID!, String(targetUserId)] });
                await channel.create();
                await channel.sendMessage({ text });
            } else {
                throw err;
            }
        }
    },
    
    hideOrDeleteConversation: async (channelCid: string): Promise<void> => {
        const client = getStreamClient();
        const [type, id] = channelCid.split(':');
        const channel    = client.channel(type, id);
        await channel.watch();
        try {
            await channel.delete();
        } catch {
            await channel.hide(client.userID ?? undefined);
        }
    },

    getTargetUserId: async (channelCid: string): Promise<number> => {
        const client = getStreamClient();
        const myId   = client.userID ?? '';
        const [type, id] = channelCid.split(':');
        const channel    = client.channel(type, id);
        await channel.watch();
        const other = Object.values(channel.state.members).find(m => m.user_id !== myId);
        return parseInt(other?.user_id ?? '0', 10);
    },

    getLanguages: async (): Promise<Language[]> => {
        const { data } = await api.get<Language[]>('/users/languages');
        return data ?? [];
    },

    updateUserLanguage: async (languageCode: string): Promise<void> => {
        await api.put('/users/me/language', { languageCode });
    },

    getGifts: async (): Promise<GiftData[]> => {
        const { data } = await api.get<GiftData[]>('/gifts');
        return data ?? [];
    },
};
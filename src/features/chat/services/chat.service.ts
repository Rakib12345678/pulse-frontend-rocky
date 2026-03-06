import type { Channel } from 'stream-chat';
import api from '@/lib/api';
import { getStreamClient, connectStreamUser } from '../stream/streamClient';
import type {
    Conversation,
    DirectChatResponse,
    Message,
    MessageStatus,
    SendMessagePayload,
} from '../types/chat.types';

const BASE_URL = 'https://api.dev.pulselive.zendot.in';

const toAbsoluteUrl = (url: string | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BASE_URL}/${url.replace(/^\//, '')}`;
};

const toIso = (val: unknown): string => {
    if (!val) return new Date().toISOString();
    if (val instanceof Date) return val.toISOString();
    return String(val);
};

const getReadStatus = (
    channel:      Channel,
    myUserId:     string,
    msgCreatedAt: unknown,
): MessageStatus => {
    const readBy  = Object.values(channel.state.read ?? {});
    const members = Object.values(channel.state.members ?? {});
    const msgTime = new Date(toIso(msgCreatedAt));

    const otherRead = readBy.some(r => {
        if (r.user?.id === myUserId) return false;
        if (!r.last_read) return false;
        return new Date(toIso(r.last_read)) > msgTime;
    });
    if (otherRead) return 'read';

    const otherOnline = members.some(m => {
        if (m.user_id === myUserId) return false;
        return m.user?.online === true;
    });
    if (otherOnline) return 'delivered';

    const otherDelivered = readBy.some(r => {
        if (r.user?.id === myUserId) return false;
        const d = (r as any).last_delivered_at;
        if (!d) return false;
        return new Date(toIso(d)) > msgTime;
    });
    if (otherDelivered) return 'delivered';

    return 'sent';
};

const mapChannel = (channel: Channel, myUserId: string): Conversation => {
    const otherMember = Object.values(channel.state.members)
        .find(m => m.user_id !== myUserId);

    const lastMsg = channel.state.latestMessages.at(-1);

    const lastMessageStatus: MessageStatus =
        lastMsg && (lastMsg.user_id === myUserId || lastMsg.user?.id === myUserId)
            ? getReadStatus(channel, myUserId, lastMsg.created_at)
            : undefined;

    const streamUser = otherMember?.user as Record<string, any> | undefined;
    const participantName =
        (streamUser?.fullName as string | undefined) ||
        (streamUser?.name    as string | undefined)  ||
        streamUser?.id || 'Unknown';

    return {
        id:          channel.cid,
        channelType: channel.type,
        channelId:   channel.id ?? '',
        participant: {
            id:     otherMember?.user_id ?? '',
            name:   participantName,
            avatar: toAbsoluteUrl(streamUser?.image as string | undefined),
        },
        lastMessage:       lastMsg?.text ?? '',
        lastMessageTime:   toIso(lastMsg?.created_at ?? channel.data?.created_at),
        unreadCount:       channel.countUnread(),
        lastMessageStatus,
        isOnline:          otherMember?.user?.online ?? false,
        lastActive:        otherMember?.user?.last_active
                           ? toIso(otherMember.user.last_active)
                           : undefined,
    };
};

const mapMessage = (
    msg:        any,
    channelCid: string,
    myUserId:   string,
    channel?:   Channel,
): Message => {
    const isMe = msg.user_id === myUserId || msg.user?.id === myUserId;
    let status: MessageStatus = undefined;
    if (isMe) {
        status = channel ? getReadStatus(channel, myUserId, msg.created_at) : 'sent';
    }
    return {
        id:             msg.id,
        conversationId: channelCid,
        senderId:       msg.user_id ?? msg.user?.id ?? '',
        text:           msg.text ?? '',
        time:           toIso(msg.created_at),
        status,
    };
};

export const chatService = {

    getConversationById: async (channelCid: string): Promise<Conversation> => {
        const client     = getStreamClient();
        const myId       = client.userID!;
        const [type, id] = channelCid.split(':');
        const channel    = client.channel(type, id);
        await channel.watch();
        return mapChannel(channel, myId);
    },

    startDirectChat: async (
        targetUserId: number,
        currentUser:  { id: string; name: string; avatar: string },
        targetUser?:  { name: string; avatar: string },
    ): Promise<{ conversationId: string; conversation: Conversation }> => {
        const { data } = await api.post<DirectChatResponse>('/chat/direct', { targetUserId });
        const { chatApiKey, chatChannelType, chatChannelId, chatToken } = data;

        await connectStreamUser(
            currentUser.id,
            currentUser.name,
            currentUser.avatar,
            chatApiKey,
            chatToken,
        );

        const client  = getStreamClient();
        const channel = client.channel(chatChannelType, chatChannelId);
        await channel.watch();

        const conversation = mapChannel(channel, currentUser.id);
        if (targetUser?.name)   conversation.participant.name   = targetUser.name;
        if (targetUser?.avatar) conversation.participant.avatar = targetUser.avatar;

        return { conversationId: channel.cid, conversation };
    },

    getConversations: async (): Promise<Conversation[]> => {
        const client = getStreamClient();
        const myId   = client.userID!;

        const channels = await client.queryChannels(
            { type: 'messaging', members: { $in: [myId] } },
            { last_message_at: -1 },
            { watch: true, state: true, presence: true },
        );

        return channels
            .filter(ch => ch.state.latestMessages.length > 0)
            .map(ch => mapChannel(ch, myId));
    },

    getMessages: async (
        channelCid: string,
        cursor?: string,
    ): Promise<{ messages: Message[]; nextCursor?: string }> => {
        const client     = getStreamClient();
        const myId       = client.userID!;
        const [type, id] = channelCid.split(':');
        const channel    = client.channel(type, id);
        await channel.watch();

        const result = await channel.query({
            messages: { limit: 30, ...(cursor ? { id_lt: cursor } : {}) },
        });

        const msgs       = result.messages ?? [];
        const mapped     = msgs.map(m => mapMessage(m, channelCid, myId, channel));
        const nextCursor = msgs.length === 30 ? msgs[0].id : undefined;

        return { messages: mapped, nextCursor };
    },

    sendMessage: async (payload: SendMessagePayload): Promise<Message> => {
        const { data } = await api.post<Message>('/chat/send', {
            targetUserId: payload.targetUserId,
            text:         payload.text,
        });
        return data;
    },

    deleteMessage: async (messageId: string): Promise<void> => {
        const client = getStreamClient();
        await client.deleteMessage(messageId);
    },

    markAsRead: async (channelCid: string): Promise<void> => {
        const client     = getStreamClient();
        const [type, id] = channelCid.split(':');
        await client.channel(type, id).markRead();
    },

    searchConversations: async (query: string): Promise<Conversation[]> => {
        const client = getStreamClient();
        const myId   = client.userID!;
        const channels = await client.queryChannels(
            { type: 'messaging', members: { $in: [myId] }, 'member.user.name': { $autocomplete: query } },
            { last_message_at: -1 },
            { watch: true, state: true, presence: true },
        );
        return channels
            .filter(ch => ch.state.latestMessages.length > 0)
            .map(ch => mapChannel(ch, myId));
    },
};
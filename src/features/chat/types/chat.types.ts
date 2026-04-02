export interface ChatUser {
    id: string;
    name: string;
    fullName?: string;
    avatar: string;
    isOnline?: boolean;
    lastActive?: string;
}

export interface Language {
    code: string;
    name: string;
}

export interface GiftData {
    id: number;
    name: string;
    iconUrl: string;
    noOfCoin: number;
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | undefined;

export interface Reaction {
    type: string;
    user_id: string;
    emoji?: string;
    user?: ChatUser;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    originalText: string;
    time: string;
    status: MessageStatus;
    attachments?: { type: string; imageUrl: string }[];
    reactions?: {
        latest: Reaction[];
        own: Reaction[];
        counts: Record<string, number>;
    };
    isGiftMessage?: boolean;
    giftIconUrl?: string;
    giftName?: string;
    giftCost?: string;
}

export interface Conversation {
    id: string;
    channelType: string;
    channelId: string;
    participant: ChatUser;
    lastMessage: string;
    lastMessageOriginal: string;
    lastMessageSenderId: string;
    lastMessageTime: string;
    unreadCount: number;
    lastMessageStatus?: MessageStatus;
    isOnline?: boolean;
    lastActive?: string;
    isMuted?: boolean;
    isArchived?: boolean;
    isGiftMessage?: boolean;
}

export interface SendMessagePayload {
    conversationId: string;
    targetUserId: number;
    text: string;
}

export interface DirectChatResponse {
    chatApiKey: string;
    chatChannelType: string;
    chatChannelId: string;
    chatToken: string;
    targetUserId: number;
}
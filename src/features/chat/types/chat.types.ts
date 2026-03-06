export interface ChatUser {
    id: string;
    name: string;
    avatar: string;
}

// incoming message (no tick shown)
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | undefined;

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text: string;
    time: string;
    status: MessageStatus;
}

export interface Conversation {
    id: string;
    channelType: string;
    channelId: string;
    participant: ChatUser;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
    lastMessageStatus?: MessageStatus;
    isOnline?: boolean;
    lastActive?: string;
}

export interface SendMessagePayload {
    conversationId: string;
    targetUserId:   number;
    text: string;
}

export interface DirectChatResponse {
    chatApiKey:      string;
    chatChannelType: string;
    chatChannelId:   string;
    chatToken:       string;
    targetUserId:    number;
}
import type { Channel } from 'stream-chat';
import { toAbsoluteUrl } from './chat';
import { getDisplayName } from './ChatUtils';
import type { Conversation, Message, MessageStatus } from '../types/chat.types';

export const toIso = (d: any): string => {
    if (!d) return new Date().toISOString();
    return d instanceof Date ? d.toISOString() : String(d);
};

export const deriveStatus = (msg: any, myId: string, read: Record<string, any>): MessageStatus => {
    if (msg.user?.id !== myId && msg.user_id !== myId) return undefined;
    if (msg.status === 'sending') return 'pending';
    const msgTime = new Date(toIso(msg.created_at));
    let anyDelivered = false;
    for (const [uid, r] of Object.entries(read)) {
        if (uid === myId) continue;
        if (!r?.last_read) continue;
        if (new Date(r.last_read) >= msgTime) return 'read';
        anyDelivered = true;
    }
    return anyDelivered ? 'delivered' : 'sent';
};

export const streamMsgToMessage = (msg: any, myId: string, cid: string, read: Record<string, any>): Message => {
    const attachments = msg.attachments?.map((a: any) => ({
        type: a.type || 'image',
        imageUrl: a.image_url || a.asset_url || a.thumb_url || a.url || '',
    })).filter((a: any) => a.imageUrl) || [];

    // Also check custom fields if attachments were stripped
    if (msg.imageUrl || msg.image_url) {
        attachments.push({ type: 'image', imageUrl: msg.imageUrl || msg.image_url });
    }

    const uniqueAttachments = attachments.filter((att: any, index: number, self: any[]) =>
        index === self.findIndex((t: any) => t.imageUrl === att.imageUrl)
    );

    const textToUse = msg.original_text || msg.text || '';
    const attachmentsToUse = uniqueAttachments.length > 0 ? uniqueAttachments : undefined;

    return {
        id: msg.id,
        conversationId: cid,
        senderId: msg.user?.id ?? msg.user_id ?? '',
        text: msg.text ?? '',
        originalText: textToUse || (attachmentsToUse ? '📷 Image' : ''),
        time: toIso(msg.created_at),
        status: deriveStatus(msg, myId, read),
        attachments: attachmentsToUse,
    };
};

export const channelToConversation = (
    channel: Channel,
    myId: string,
    participantNameOverride?: string,
): Conversation => {
    const members     = Object.values(channel.state.members).filter(
        m => (m.user?.id || m.user_id) !== myId,
    );
    const participant = members[0]?.user;
    const streamUser  = participant as Record<string, any> | undefined;
    const allMsgs = channel.state.messages;
    const lastMsg = allMsgs.slice().reverse().find(m => 
        m.text?.trim() !== 'has joined the live' && 
        (m as any).original_text?.trim() !== 'has joined the live'
    );

    let lastMessageStatus: MessageStatus = undefined;
    if (lastMsg?.user?.id === myId || (lastMsg as any)?.user_id === myId) {
        lastMessageStatus = deriveStatus(lastMsg, myId, channel.state.read);
    }

    const participantName =
        participantNameOverride ||
        getDisplayName(streamUser) ||
        'Unknown';

    let lastMsgText = lastMsg?.text ?? '';
    let lastMsgOriginal = (lastMsg as any)?.original_text ?? lastMsg?.text ?? '';

    if (lastMsgText.includes('[IMAGE:')) {
        lastMsgText = lastMsgText.replace(/\[IMAGE:(.*?)\]/g, '').trim() || '📷 Image';
    }
    if (lastMsgOriginal.includes('[IMAGE:')) {
        lastMsgOriginal = lastMsgOriginal.replace(/\[IMAGE:(.*?)\]/g, '').trim() || '📷 Image';
    }
    if (lastMsgText.includes('[GIFT:')) {
        lastMsgText = lastMsgText.replace(/\[GIFT:(.*?):(\d+)\]/g, '').trim() || '🎁 Gift';
    }
    if (lastMsgOriginal.includes('[GIFT:')) {
        lastMsgOriginal = lastMsgOriginal.replace(/\[GIFT:(.*?):(\d+)\]/g, '').trim() || '🎁 Gift';
    }

    return {
        id: channel.cid,
        channelType: channel.type,
        channelId: channel.id ?? '',
        participant: {
            id: participant?.id ?? members[0]?.user_id ?? '',
            name: participantName,
            avatar: toAbsoluteUrl(streamUser?.image as string | undefined),
            fullName: (streamUser?.fullName || streamUser?.full_name) as string | undefined,
        },
        lastMessage: lastMsgText,
        lastMessageOriginal: lastMsgOriginal,
        lastMessageSenderId: lastMsg?.user?.id ?? (lastMsg as any)?.user_id ?? '',
        lastMessageTime: toIso(lastMsg?.created_at ?? channel.data?.created_at),
        unreadCount: channel.countUnread(),
        lastMessageStatus,
        isOnline: participant?.online ?? false,
        lastActive: participant?.last_active ? toIso(participant.last_active) : undefined,
    };
};
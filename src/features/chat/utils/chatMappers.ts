import type { Channel } from 'stream-chat';
import { toAbsoluteUrl } from './chat';
import { getDisplayName } from './ChatUtils';
import type { Conversation, Message, MessageStatus } from '../types/chat.types';

export const toIso = (d: any): string => {
    if (!d) return new Date().toISOString();
    return d instanceof Date ? d.toISOString() : String(d);
};

export const deriveStatus = (msg: any, myId: string, read: Record<string, any>, isOnline?: boolean): MessageStatus => {
    if (msg.user?.id !== myId && msg.user_id !== myId) return undefined;
    if (msg.status === 'sending') return 'pending';
    const msgTime = new Date(toIso(msg.created_at));
    for (const [uid, r] of Object.entries(read)) {
        if (uid === myId) continue;
        if (!r?.last_read) continue;
        if (new Date(r.last_read) >= msgTime) return 'read';
    }
    if (isOnline !== undefined) {
        return isOnline ? 'delivered' : 'sent';
    }
    return 'delivered';
};

export const streamMsgToMessage = (msg: any, myId: string, cid: string, read: Record<string, any>, isOnline?: boolean): Message => {
    const attachments = msg.attachments?.map((a: any) => ({
        type: a.type || 'image',
        imageUrl: a.image_url || a.asset_url || a.thumb_url || a.url || '',
        _isLinkPreview: !!(a.og_scrape_url || a.title_link || a.title),
    })).filter((a: any) => a.imageUrl && !a._isLinkPreview) || [];

    // Also check custom fields if attachments were stripped
    if (msg.imageUrl || msg.image_url) {
        attachments.push({ type: 'image', imageUrl: msg.imageUrl || msg.image_url });
    }

    const uniqueAttachments = attachments.filter((att: any, index: number, self: any[]) =>
        index === self.findIndex((t: any) => t.imageUrl === att.imageUrl)
    );

    // Hunt for original text in various Stream i18n structures if missing
    const i18n = msg.i18n || (msg as any).translations || {};
    const originalFromI18n = i18n.original_text || i18n.text_en;
    const textToUse = msg.original_text || originalFromI18n || msg.text || '';

    const attachmentsToUse = uniqueAttachments.length > 0 ? uniqueAttachments : undefined;
    const reactionCounts = msg.reaction_counts || {};
    const rawLatest = [...(msg.latest_reactions || msg.reactions || [])];
    const ownReactionsRaw = msg.own_reactions || [];

    // Ensure own reactions are always included in latest (fixes optimistic update missing details)
    ownReactionsRaw.forEach((ownR: any) => {
        const exists = rawLatest.some(r => r.type === ownR.type && (r.user?.id || r.user_id) === (ownR.user?.id || ownR.user_id));
        if (!exists) {
            rawLatest.push(ownR);
        }
    });

    const latestReactions = rawLatest.map((r: any) => ({
        ...r,
        type: r.type,
        user_id: r.user?.id || r.user_id,
        user: r.user ? {
            id: r.user.id,
            username: r.user.username || (r.user.name && !/^\d+$/.test(r.user.name) ? r.user.name : undefined),
            name: r.user.fullName ?? r.user.full_name ?? r.user.name ?? r.user.id,
            avatar: toAbsoluteUrl(r.user.image),
        } : undefined,
    }));
    const ownReactions = ownReactionsRaw.map((r: any) => ({
        ...r,
        type: r.type,
        user_id: r.user?.id || r.user_id,
    }));

    return {
        id: msg.id,
        conversationId: cid,
        senderId: msg.user?.id ?? msg.user_id ?? '',
        text: msg.text ?? '',
        originalText: textToUse || (attachmentsToUse ? '📷 Image' : ''),
        time: toIso(msg.created_at),
        status: deriveStatus(msg, myId, read, isOnline),
        attachments: attachmentsToUse,
        reactions: {
            latest: latestReactions,
            own: ownReactions,
            counts: reactionCounts,
        },
        isGiftMessage: (msg as any).isGiftMessage,
        giftIconUrl: (msg as any).giftIconUrl,
        giftName: (msg as any).giftName,
        giftCost: (msg as any).giftCost,
        customType: msg.custom_type || (msg as any).customType || msg.type,
    };
};

export const channelToConversation = (
    channel: Channel,
    myId: string,
    participantNameOverride?: string,
): Conversation => {
    const members = Object.values(channel.state.members).filter(
        m => (m.user?.id || m.user_id) !== myId,
    );
    const participant = members[0]?.user;
    const streamUser = participant as Record<string, any> | undefined;
    const allMsgs = channel.state.messages;
    const lastMsg = allMsgs.slice().reverse().find(m =>
        m.text?.trim() !== 'has joined the live' &&
        (m as any).original_text?.trim() !== 'has joined the live' &&
        m.text !== 'block_signal' &&
        m.text !== 'unblock_signal' &&
        (m as any).custom_type !== 'block_signal' &&
        (m as any).custom_type !== 'unblock_signal' &&
        (m as any).customType !== 'block_signal' &&
        (m as any).customType !== 'unblock_signal'
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
    const hasImageAttachments = !!(
        lastMsg?.attachments &&
        lastMsg.attachments.some((a: any) => 
            (a.type === 'image' || (a.image_url || a.asset_url || a.thumb_url || a.url || '').match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i)) && 
            !a.og_scrape_url && 
            !a.title_link && 
            !a.title
        )
    );

    // Identify and clean image/gift tags even if translated.
    // We check both original and translated text to be safe.
    const imageTagRegex = /https?:\/\/\S+\.(jpg|jpeg|png|gif|webp|bmp)\b/i;
    const giftTagRegex = /\[?[\s\S]*?GIFT:[\s\S]*?\]?/i;

    const isImageTag = hasImageAttachments ||
        imageTagRegex.test(lastMsgOriginal) ||
        imageTagRegex.test(lastMsgText);

    const isGiftTag = giftTagRegex.test(lastMsgOriginal) ||
        giftTagRegex.test(lastMsgText);

    if (isGiftTag || (lastMsg as any)?.isGiftMessage) {
        lastMsgOriginal = `🎁 ${(lastMsg as any)?.giftName || 'Gift'}`;
        lastMsgText = lastMsgOriginal;
    } else if (isImageTag) {
        lastMsgOriginal = '📷 Photo';
        lastMsgText = '📷 Photo';
    }
    // Scan messages to find the latest block/unblock signal persistently
    let blockedBy = (channel.data as any)?.blocked_by as string | undefined;
    
    const signalMsgs = allMsgs.slice().reverse();
    const latestSignal = signalMsgs.find(m => 
        m.text === 'block_signal' || 
        m.text === 'unblock_signal' || 
        (m as any).custom_type === 'block_signal' || 
        (m as any).custom_type === 'unblock_signal' ||
        (m as any).customType === 'block_signal' ||
        (m as any).customType === 'unblock_signal'
    );
    if (latestSignal) {
        if (latestSignal.text === 'block_signal' || (latestSignal as any).custom_type === 'block_signal' || (latestSignal as any).customType === 'block_signal') {
            blockedBy = latestSignal.user?.id || (latestSignal as any).user_id || latestSignal.user_id;
        } else {
            blockedBy = undefined;
        }
    }
    const isBlocked = !!blockedBy;

    const participantAvatar = isBlocked ? '' : toAbsoluteUrl(streamUser?.image as string | undefined);
    const participantOnline = isBlocked ? false : (participant?.online ?? false);
    const participantLastActive = isBlocked ? undefined : (participant?.last_active ? toIso(participant.last_active) : undefined);

    return {
        id: channel.cid,
        channelType: channel.type,
        channelId: channel.id ?? '',
        participant: {
            id: participant?.id ?? members[0]?.user_id ?? '',
            name: participantName,
            username: streamUser?.username || (streamUser?.name && !/^\d+$/.test(streamUser.name) ? streamUser.name : undefined),
            avatar: participantAvatar,
            fullName: (streamUser?.fullName || streamUser?.full_name) as string | undefined,
        },
        lastMessage: lastMsgText,
        lastMessageOriginal: lastMsgOriginal,
        lastMessageSenderId: lastMsg?.user?.id ?? (lastMsg as any)?.user_id ?? '',
        lastMessageTime: toIso(lastMsg?.created_at ?? channel.data?.created_at),
        unreadCount: (() => {
            const rawCount = channel.countUnread();
            if (rawCount > 0) return rawCount;
            // Fallback for muted channels where server-side countUnread() returns 0 by default
            const myRead = channel.state.read[myId];
            const lastReadTime = myRead?.last_read ? new Date(myRead.last_read).getTime() : 0;
            const unreadMessages = allMsgs.filter(m => {
                if ((m.user?.id || m.user_id) === myId) return false;
                const text = m.text?.trim() || '';
                if (text === 'has joined the live') return false;
                const msgTime = new Date(m.created_at || '').getTime();
                return msgTime > lastReadTime;
            });
            return unreadMessages.length;
        })(),
        lastMessageStatus,
        isOnline: participantOnline,
        lastActive: participantLastActive,
        blockedBy,
    };
};
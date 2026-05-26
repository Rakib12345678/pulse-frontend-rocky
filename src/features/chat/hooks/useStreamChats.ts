import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Channel } from 'stream-chat';
import { getStreamClient, isStreamConnected } from '../stream/streamClient';
import { chatService } from '../services/chat.service';
import { giftsService } from '@/features/gifts/services/gifts.service';
import { channelToConversation, streamMsgToMessage } from '../utils/chatMappers';
import { getDisplayName } from '../utils/ChatUtils';
import type { Conversation, Message, MessageStatus } from '../types/chat.types';
import { ARCHIVED_STORAGE_KEY, MUTED_STORAGE_KEY } from '../utils/chatConstants';
import { useAuthStore } from '@/features/auth/stores/authStore';
import api from '@/lib/api';


export interface UseStreamChatReturn {
    conversations: Conversation[];
    convLoading: boolean;
    reloadChannels: () => Promise<void>;
    activeChannel: Channel | null;
    messages: Message[];
    msgLoading: boolean;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    setActiveConvId: (cid: string | null) => void;
    sendMessage: (text: string) => Promise<void>;
    sendImage: (file: File) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    sendReaction: (messageId: string, reactionType: string) => Promise<void>;
    deleteReaction: (messageId: string, reactionType: string) => Promise<void>;
    markAsRead: () => void;
    startDirectChat: (targetUserId: number, targetName?: string, targetAvatar?: string) => Promise<Conversation>;
    archiveConversation: (id: string) => void;
    unarchiveConversation: (id: string) => void;
    muteConversation: (id: string) => void;
    unmuteConversation: (id: string) => void;
    blockedUserIds: string[];
}

const getArchived = (): string[] => {
    try { return JSON.parse(sessionStorage.getItem(ARCHIVED_STORAGE_KEY) || '[]'); } catch { return []; }
};
const setArchived = (ids: string[]) => sessionStorage.setItem(ARCHIVED_STORAGE_KEY, JSON.stringify(ids));

export const useStreamChat = (myId: string, streamReady: boolean): UseStreamChatReturn => {
    const queryClient = useQueryClient();
    const timeoutsRef = useRef<number[]>([]);

    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach(clearTimeout);
            timeoutsRef.current = [];
        };
    }, []);

    const [channels, setChannels] = useState<Channel[]>([]);
    const [convLoading, setConvLoading] = useState(true);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [streamMsgs, setStreamMsgs] = useState<Message[]>([]);
    const [pendingMessages, setPendingMessages] = useState<Message[]>([]);
    const { wallet, updateWallet } = useAuthStore();

    const messages = useMemo(() => {
        const confirmedTexts = new Set(streamMsgs.map(m => m.originalText));
        const activePending = pendingMessages.filter(pm =>
            pm.conversationId === activeConvId && !confirmedTexts.has(pm.originalText)
        );
        return [...streamMsgs, ...activePending];
    }, [streamMsgs, pendingMessages, activeConvId]);

    const [msgLoading, setMsgLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [mutedIds, setMutedIds] = useState<string[]>([]);
    const [archivedIds, setArchivedIds] = useState<string[]>(getArchived);
    const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

    const activeChannel = useMemo(() => (
        activeConvId ? channels.find(c => c.cid === activeConvId) || null : null
    ), [channels, activeConvId]);

    // ── fetch blocked users from backend ──────────────────────────────────────
    const fetchBlockedUsers = useCallback(async () => {
        try {
            const { data } = await api.get('/users/blocked');
            if (Array.isArray(data)) {
                setBlockedUserIds(data.map((u: any) => String(u.id)));
            }
        } catch {
            // silently ignore – block list is best-effort
        }
    }, []);

    useEffect(() => {
        if (!streamReady) return;
        fetchBlockedUsers();

        // Re-fetch whenever block/unblock happens (dispatched by user.service)
        const handleBlocksChanged = () => fetchBlockedUsers();
        window.addEventListener('stream-blocks-changed', handleBlocksChanged);
        return () => window.removeEventListener('stream-blocks-changed', handleBlocksChanged);
    }, [streamReady, fetchBlockedUsers]);

    const nameCache = useRef<Record<string, string>>({});
    const cacheName = useCallback((ch: Channel) => {
        if (nameCache.current[ch.cid]) return;
        const members = Object.values(ch.state.members || {});
        const other = members.find(m => m.user_id !== myId);
        const user = other?.user;
        if (!user) return;

        const name = getDisplayName(user);
        if (name && name !== 'Unknown') nameCache.current[ch.cid] = name;
    }, [myId]);

    const [optimisticPreviews, setOptimisticPreviews] = useState<
        Record<string, { text: string; time: string; status: MessageStatus; isGiftMessage?: boolean }>
    >({});

    const syncMessages = useCallback((ch: Channel) => {
        const mapped = ch.state.messages.map(m => streamMsgToMessage(m, myId, ch.cid, ch.state.read));
        setStreamMsgs(mapped);
    }, [myId]);

    // ── load channel list ─────────────────────────────────────────────────────
    const reloadChannels = useCallback(async () => {
        if (!isStreamConnected()) return;
        try {
            const client = getStreamClient();
            const chans = await client.queryChannels(
                { type: 'messaging', members: { $in: [client.userID!] } },
                { last_message_at: -1 },
                { watch: true, presence: true, limit: 30 },
            );
            chans.forEach(cacheName);
            setChannels([...chans]);
        } catch { /* keep current state */ }
        finally { setConvLoading(false); }
    }, [cacheName]);

    useEffect(() => {
        if (!streamReady) return;
        reloadChannels();
    }, [streamReady, reloadChannels]);

    // ── global events → sidebar re-render ────────────────────────────────────
    useEffect(() => {
        if (!streamReady) return;
        const client = getStreamClient();
        const forceResync = () => setChannels(prev => [...prev]);
        const syncMutes = (event?: any) => {
            const mutes = event?.me?.channel_mutes || (client as any).user?.channel_mutes || [];
            const ids = mutes.map((m: any) => m.channel?.cid).filter((cid: any): cid is string => !!cid);
            setMutedIds(ids);
        };

        syncMutes();

        const subs = [
            client.on('message.new', reloadChannels),
            client.on('message.read', forceResync),
            client.on('message.delivered', forceResync),
            client.on('user.presence.changed', forceResync),
            client.on('user.updated', forceResync),
            client.on('notification.mark_read', forceResync),
            client.on('notification.added_to_channel', reloadChannels),
            client.on('notification.message_new', reloadChannels),
            client.on('notification.channel_mutes_updated', syncMutes),
            client.on('channel.deleted', reloadChannels),
            client.on('channel.hidden', reloadChannels),
            client.on('reaction.new', forceResync),
            client.on('reaction.deleted', forceResync),
            client.on('reaction.updated', forceResync),
        ];
        return () => subs.forEach(s => s.unsubscribe());
    }, [streamReady, reloadChannels]);

    // ── conversations memo ────────────────────────────────────────────────────
    const conversations = useMemo(
        () => {
            const client = isStreamConnected() ? getStreamClient() : null;

            const allConvs = channels.map(ch => {
                const conv = channelToConversation(ch, myId, nameCache.current[ch.cid]);
                const participantId = conv.participant.id;
                const isBlocked = blockedUserIds.includes(participantId);

                const liveUser = isBlocked
                    ? null
                    : (client?.state?.users?.[participantId] as Record<string, any> | undefined);

                // Robust online check:
                // 1. Check live state from client.state.users (most accurate for watched users)
                // 2. Check the conversation's initial mapping
                // 3. Fallback: if they were active in the last 60 seconds, treat as online for UI responsiveness
                const lastActiveTime = liveUser?.last_active || conv.lastActive;
                const isRecentlyActive = !isBlocked && lastActiveTime && (new Date().getTime() - new Date(lastActiveTime).getTime() < 60000);

                const isOnline = !isBlocked && (liveUser?.online === true || conv.isOnline === true || !!isRecentlyActive);

                const lastActive = isBlocked ? undefined : (lastActiveTime
                    ? new Date(lastActiveTime).toISOString()
                    : conv.lastActive);
                const unreadCount = ch.cid === activeConvId ? 0 : conv.unreadCount;

                const isGift = conv.lastMessageOriginal?.startsWith('GIFT:') || conv.lastMessage?.startsWith('GIFT:');

                const base: Conversation = {
                    ...conv,
                    isOnline,
                    lastActive,
                    unreadCount,
                    isMuted: mutedIds.includes(ch.cid),
                    isArchived: archivedIds.includes(ch.cid),
                    lastMessage: isGift ? '🎁 Gift' : conv.lastMessage,
                    lastMessageOriginal: isGift ? '🎁 Gift' : conv.lastMessageOriginal,
                    isGiftMessage: isGift,
                    // Mask avatar for blocked participants
                    participant: isBlocked
                        ? { ...conv.participant, avatar: '' }
                        : conv.participant,
                };

                const preview = optimisticPreviews[ch.cid];
                if (!preview) return base;
                const isOptimisticGift = preview.isGiftMessage || preview.text.startsWith('[GIFT:');
                return {
                    ...base,
                    lastMessage: isOptimisticGift ? '🎁 Gift' : preview.text,
                    lastMessageOriginal: isOptimisticGift ? '🎁 Gift' : preview.text,
                    lastMessageSenderId: myId,
                    lastMessageTime: preview.time,
                    lastMessageStatus: preview.status,
                    isGiftMessage: isOptimisticGift,
                };
            });

            return allConvs;
        },
        [channels, myId, activeConvId, optimisticPreviews, mutedIds, archivedIds, blockedUserIds]
    );

    // ── message events → chat view re-render ──────────────────────────────────
    useEffect(() => {
        if (!activeChannel) { setStreamMsgs([]); return; }
        syncMessages(activeChannel);

        const subs = [
            activeChannel.on('message.new', () => syncMessages(activeChannel)),
            activeChannel.on('message.updated', () => syncMessages(activeChannel)),
            activeChannel.on('message.deleted', () => syncMessages(activeChannel)),
            activeChannel.on('message.read', () => syncMessages(activeChannel)),
            activeChannel.on('message.delivered', () => syncMessages(activeChannel)),
            activeChannel.on('reaction.new', (event) => {
                if (event.message && event.reaction) {
                    const msg = activeChannel.state.messages.find(m => m.id === event.message!.id);
                    if (msg) {
                        if (!msg.latest_reactions) msg.latest_reactions = [];
                        const exists = msg.latest_reactions.some(
                            r => r.type === event.reaction!.type && (r.user?.id || r.user_id) === (event.reaction!.user?.id || event.reaction!.user_id)
                        );
                        if (!exists) {
                            msg.latest_reactions.unshift(event.reaction);
                        }
                    }
                }
                syncMessages(activeChannel);
            }),
            activeChannel.on('reaction.deleted', () => syncMessages(activeChannel)),
            activeChannel.on('reaction.updated', () => syncMessages(activeChannel)),
        ];

        return () => subs.forEach(s => s.unsubscribe());
    }, [activeChannel, syncMessages]);

    // ── pagination ────────────────────────────────────────────────────────────
    const loadMore = useCallback(async () => {
        if (!activeChannel || msgLoading || !hasMore) return;
        setMsgLoading(true);
        try {
            const lastMsg = activeChannel.state.messages[0];
            const response = await activeChannel.query({
                messages: { limit: 15, id_lt: lastMsg?.id },
            });
            if (response.messages.length < 15) setHasMore(false);
            syncMessages(activeChannel);
        } catch { /* ... */ }
        finally { setMsgLoading(false); }
    }, [activeChannel, msgLoading, hasMore, syncMessages]);

    // ── send ──────────────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (text: string) => {
        if (!activeChannel || !myId) return;
        const conv = channelToConversation(activeChannel, myId, nameCache.current[activeChannel.cid]);

        const giftMatch = text.match(/[\[\(\【]GIFT:(\d+):(https?:\/\/[^:]+):([^:]+):(\d+)[\]\)\】]/i);
        const isGiftMsg = !!giftMatch;

        const tempId = `pending-${Date.now()}`;
        const tempMsg: Message = {
            id: tempId,
            conversationId: activeChannel.cid,
            senderId: myId,
            text,
            originalText: text,
            time: new Date().toISOString(),
            status: 'pending',
            isGiftMessage: isGiftMsg,
        };

        if (isGiftMsg && giftMatch) {
            tempMsg.giftIconUrl = giftMatch[2];
            tempMsg.giftName = giftMatch[3];
            tempMsg.giftCost = giftMatch[4];
        }

        setPendingMessages(prev => [...prev, tempMsg]);

        try {
            if (isGiftMsg && giftMatch) {
                const giftId = parseInt(giftMatch[1], 10);
                try {
                    const response = await giftsService.sendGift({
                        giftId,
                        targetUserId: conv.participant.id,
                        source: 'CHAT'
                    });
                    if (response && typeof response.viewerCoinBalance === 'number') {
                        updateWallet({ coinBalance: response.viewerCoinBalance });
                        queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
                    }
                } catch (giftErr) {
                    console.error('[StreamChat] Gift send failed:', giftErr);
                    throw giftErr;
                }
            }

            // Rely on backend relay to avoid duplication
            await chatService.sendMessage({

                conversationId: activeChannel.cid,
                targetUserId: Number(conv.participant.id),
                text,
            });

            // Clear optimistic preview after a short delay
            const timerId = window.setTimeout(() => {
                setOptimisticPreviews(prev => {
                    const next = { ...prev };
                    delete next[activeChannel.cid];
                    return next;
                });
                setPendingMessages(prev => prev.filter(m => m.id !== tempId));
                timeoutsRef.current = timeoutsRef.current.filter(t => t !== timerId);
            }, 1000);
            timeoutsRef.current.push(timerId);

        } catch (err: any) {
            console.error('[StreamChat] Send failed:', err);
            setPendingMessages(prev => prev.filter(m => m.id !== tempId));
            setOptimisticPreviews(prev => {
                const next = { ...prev };
                delete next[activeChannel.cid];
                return next;
            });
            throw err;
        }
    }, [activeChannel, myId, wallet, updateWallet]);

    // ── send image ────────────────────────────────────────────────────────────
    const sendImage = useCallback(async (file: File) => {
        if (!activeChannel || !myId) return;
        const conv = channelToConversation(activeChannel, myId, nameCache.current[activeChannel.cid]);

        const now = new Date().toISOString();
        const tempId = `pending-${Date.now()}`;
        const tempMsg: Message = {
            id: tempId,
            conversationId: activeChannel.cid,
            senderId: myId,
            text: '📷 Image',
            originalText: '',
            time: now,
            status: 'pending',
            attachments: [{ type: 'image', imageUrl: '' }], // Triggers meOnlyImage
        };


        setPendingMessages(prev => [...prev, tempMsg]);
        setOptimisticPreviews(prev => ({
            ...prev,
            [activeChannel.cid]: { text: '📷 Image', time: now, status: 'pending' },
        }));

        try {
            const response = await activeChannel.sendImage(file);

            // Rely on backend relay to avoid duplication
            await chatService.sendMessage({
                conversationId: activeChannel.cid,
                targetUserId: Number(conv.participant.id),
                text: `[IMAGE:${response.file}]`
            });

            // Clear optimistic preview after a short delay
            const timerId = window.setTimeout(() => {
                setOptimisticPreviews(prev => {
                    const next = { ...prev };
                    delete next[activeChannel.cid];
                    return next;
                });
                setPendingMessages(prev => prev.filter(m => m.id !== tempId));
                timeoutsRef.current = timeoutsRef.current.filter(t => t !== timerId);
            }, 1000);
            timeoutsRef.current.push(timerId);

        } catch (err) {
            console.error('[StreamChat] Image send failed:', err);
            setPendingMessages(prev => prev.filter(m => m.id !== tempId));
            setOptimisticPreviews(prev => {
                const next = { ...prev };
                delete next[activeChannel.cid];
                return next;
            });
            throw new Error('Failed to send image');
        }
    }, [activeChannel, myId]);



    // ── delete ────────────────────────────────────────────────────────────────
    const deleteMessage = useCallback(async (messageId: string) => {
        if (!activeChannel) return;
        const msg = activeChannel.state.messages.find(m => m.id === messageId);
        // Remove restriction to allow deleting messages from others (for moderation/local hiding)
        // if (msg && (msg.user?.id ?? (msg as any).user_id) !== myId) return;

        try {
            const client = getStreamClient();
            await client.deleteMessage(messageId, true);
            syncMessages(activeChannel); // Immediate local sync
        } catch (err) {
            console.error('[StreamChat] failed to delete message', messageId, err);
            throw err;
        }
    }, [activeChannel, myId]);

    // ── send reaction ─────────────────────────────────────────────────────────
    const sendReaction = useCallback(async (messageId: string, reactionType: string, extra?: Record<string, any>) => {
        if (!activeChannel) return;
        try {
            await activeChannel.sendReaction(messageId, { type: reactionType, ...extra }, { enforce_unique: true });
            syncMessages(activeChannel); // Immediate local sync
        } catch (err) {
            console.error('[StreamChat] failed to send reaction', messageId, err);
            throw err;
        }
    }, [activeChannel]);

    // ── delete reaction ───────────────────────────────────────────────────────
    const deleteReaction = useCallback(async (messageId: string, reactionType: string) => {
        if (!activeChannel) return;
        try {
            await activeChannel.deleteReaction(messageId, reactionType);
            syncMessages(activeChannel); // Immediate local sync
        } catch (err) {
            console.error('[StreamChat] failed to delete reaction', messageId, err);
            throw err;
        }
    }, [activeChannel]);

    // ── mark as read ──────────────────────────────────────────────────────────
    const markAsRead = useCallback(() => {
        if (!activeChannel) return;
        activeChannel.markRead()
            .then(() => {
                syncMessages(activeChannel);
                // Trigger navbar unread count update
                window.dispatchEvent(new CustomEvent('unread-count-sync'));
            })
            .catch(() => { });
    }, [activeChannel, syncMessages]);

    // ── start direct chat ─────────────────────────────────────────────────────
    const startDirectChat = useCallback(async (
        targetUserId: number,
        targetName?: string,
        targetAvatar?: string,
    ): Promise<Conversation> => {
        const { channelCid } = await chatService.startDirectChat(
            targetUserId,
            { id: myId, name: '', avatar: '' },
            targetName ? { name: targetName, avatar: targetAvatar ?? '' } : undefined,
        );
        await reloadChannels();
        const client = getStreamClient();
        const [type, chanId] = channelCid.split(':');
        const channel = client.channel(type, chanId);
        return channelToConversation(channel, myId, nameCache.current[channelCid]);
    }, [myId, reloadChannels]);

    // ── mute/archive helpers ──────────────────────────────────────────────────
    const muteConversation = useCallback(async (cid: string) => {
        console.log('[StreamChat] muteConversation triggered for:', cid);
        if (!isStreamConnected()) {
            console.warn('[StreamChat] Cannot mute: stream not connected');
            return;
        }
        try {
            const client = getStreamClient();
            const [type, id] = cid.split(':');
            console.log('[StreamChat] Calling channel.mute() for:', type, id);
            const channel = client.channel(type, id);
            await channel.mute();
            console.log('[StreamChat] channel.mute() call completed');
        } catch (err) {
            console.error('[StreamChat] mute failed', cid, err);
        }
    }, []);

    const unmuteConversation = useCallback(async (cid: string) => {
        console.log('[StreamChat] unmuteConversation triggered for:', cid);
        if (!isStreamConnected()) {
            console.warn('[StreamChat] Cannot unmute: stream not connected');
            return;
        }
        try {
            const client = getStreamClient();
            const [type, id] = cid.split(':');
            console.log('[StreamChat] Calling channel.unmute() for:', type, id);
            const channel = client.channel(type, id);
            await channel.unmute();
            console.log('[StreamChat] channel.unmute() call completed');
        } catch (err) {
            console.error('[StreamChat] unmute failed', cid, err);
        }
    }, []);

    const archiveConversation = useCallback((id: string) => {
        setArchivedIds(prev => {
            if (prev.includes(id)) return prev;
            const next = [...prev, id];
            setArchived(next);
            return next;
        });
    }, []);

    const unarchiveConversation = useCallback((id: string) => {
        setArchivedIds(prev => {
            const next = prev.filter(aid => aid !== id);
            setArchived(next);
            return next;
        });
    }, []);

    return {
        conversations, convLoading, reloadChannels,
        activeChannel, messages, msgLoading, hasMore, loadMore,
        setActiveConvId,
        sendMessage, sendImage, deleteMessage, markAsRead, startDirectChat,
        sendReaction, deleteReaction,
        archiveConversation, unarchiveConversation, muteConversation, unmuteConversation,
        blockedUserIds,
    };

};
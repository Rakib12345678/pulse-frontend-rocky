import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Channel } from 'stream-chat';
import { getStreamClient, isStreamConnected } from '../stream/streamClient';
import { chatService } from '../services/chat.service';
import { channelToConversation, streamMsgToMessage } from '../utils/chatMappers';
import { getDisplayName } from '../utils/ChatUtils';
import type { Conversation, Message, MessageStatus } from '../types/chat.types';

let _counter = 0;
const tempId = () => `optimistic-${++_counter}`;

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
    markAsRead: () => void;
    startDirectChat: (targetUserId: number, targetName?: string, targetAvatar?: string) => Promise<Conversation>;
}

export const useStreamChat = (myId: string, streamReady: boolean): UseStreamChatReturn => {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [convLoading, setConvLoading] = useState(true);

    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
    const [streamMsgs, setStreamMsgs] = useState<Message[]>([]);
    const [optimistic, setOptimistic] = useState<Message[]>([]);
    const [msgLoading, setMsgLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    const channelSubsRef = useRef<Array<{ unsubscribe: () => void }>>([]);

    const nameCache = useRef<Record<string, string>>({});

    const cacheName = useCallback((ch: Channel) => {
        const members = Object.values(ch.state.members).filter(
            m => (m.user?.id || m.user_id) !== myId,
        );
        const user = members[0]?.user as Record<string, any> | undefined;
        if (import.meta.env.DEV && user) {
            console.debug('[StreamChat] participant user fields on', ch.cid, {
                id: user.id,
                name: user.name,
                fullName: user.fullName,
                full_name: user.full_name,
                firstName: user.firstName,
                lastName: user.lastName,
                allKeys: Object.keys(user),
            });
        }

        const name = getDisplayName(user);
        if (name && name !== 'Unknown') nameCache.current[ch.cid] = name;
    }, [myId]);

    const [optimisticPreviews, setOptimisticPreviews] = useState<
        Record<string, { text: string; time: string; status: MessageStatus }>
    >({});

    const syncMessages = useCallback((ch: Channel) => {
        const mapped = ch.state.messages.map(m => streamMsgToMessage(m, myId, ch.cid, ch.state.read));
        setStreamMsgs(prev => {
            // Simple optimization: only update if message count or last message ID changes
            if (prev.length === mapped.length && prev[prev.length - 1]?.id === mapped[mapped.length - 1]?.id) return prev;
            return mapped;
        });
    }, [myId]);

    // ── load channel list ─────────────────────────────────────────────────────
    const reloadChannels = useCallback(async () => {
        if (!isStreamConnected()) return;
        try {
            const client = getStreamClient();
            const chans  = await client.queryChannels(
                { members: { $in: [client.userID!] } },
                { last_message_at: -1 },
                { watch: true, presence: true, limit: 30 },
            );
            // Cache names while we have full member data including custom fields
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

        const subs = [
            client.on('message.new', forceResync),
            client.on('message.read', forceResync),
            client.on('message.delivered', forceResync),
            client.on('user.presence.changed', forceResync),
            client.on('user.updated', forceResync),
            client.on('notification.mark_read', forceResync),
            client.on('notification.added_to_channel', reloadChannels),
            client.on('notification.message_new', reloadChannels),
            client.on('channel.deleted', reloadChannels),
            client.on('channel.hidden', reloadChannels),
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
                const liveUser = client?.state?.users?.[participantId] as Record<string, any> | undefined;
                const isOnline = liveUser?.online ?? conv.isOnline ?? false;
                const lastActive = liveUser?.last_active
                    ? new Date(liveUser.last_active).toISOString()
                    : conv.lastActive;
                const unreadCount = ch.cid === activeConvId ? 0 : conv.unreadCount;

                const base: Conversation = { ...conv, isOnline, lastActive, unreadCount };

                const preview = optimisticPreviews[ch.cid];
                if (!preview) return base;
                return {
                    ...base,
                    lastMessage: preview.text,
                    lastMessageOriginal: preview.text,
                    lastMessageSenderId: myId,
                    lastMessageTime: preview.time,
                    lastMessageStatus: preview.status,
                };
            });

            // Group by participant ID and only keep the most recent
            const uniqueConvs = new Map<string, Conversation>();
            for (const conv of allConvs) {
                const existing = uniqueConvs.get(conv.participant.id);
                if (!existing || new Date(conv.lastMessageTime).getTime() > new Date(existing.lastMessageTime).getTime()) {
                    uniqueConvs.set(conv.participant.id, conv);
                }
            }

            return Array.from(uniqueConvs.values())
                .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
        },
        [channels, myId, optimisticPreviews, activeConvId],
    );

    // Watch active participant presence explicitly
    useEffect(() => {
        if (!streamReady || !activeConvId) return;
        const client = getStreamClient();

        // Find the active conversation from the list
        const activeConv = conversations.find(conv => conv.id === activeConvId);
        if (!activeConv) return;
        
        const participantId = activeConv.participant.id;
        
        // Query users with presence:true also starts watching them
        client.queryUsers({ id: { $in: [participantId] } }, {}, { presence: true })
            .catch(() => {});
            
    }, [streamReady, activeConvId, conversations]);

    // ── watch active channel ──────────────────────────────────────────────────
    useEffect(() => {
        channelSubsRef.current.forEach(s => s.unsubscribe());
        channelSubsRef.current = [];

        if (!activeConvId) {
            setActiveChannel(null);
            setStreamMsgs([]);
            setOptimistic([]);
            return;
        }

        const client = getStreamClient();
        const [type, id] = activeConvId.split(':');
        const ch = client.channel(type, id);

        setMsgLoading(true);
        setOptimistic([]);

        ch.watch({ messages: { limit: 25 } })
            .then(() => {
                cacheName(ch);
                setActiveChannel(ch);
                syncMessages(ch);
                setHasMore(ch.state.messages.length >= 25);
                setMsgLoading(false);
                ch.markRead().catch(() => {});
            })
            .catch(() => setMsgLoading(false));

        const subs = [
            ch.on('message.new', () => {
                syncMessages(ch);
                setOptimistic([]);
                setOptimisticPreviews(prev => {
                    const next = { ...prev };
                    delete next[ch.cid];
                    return next;
                });
                setChannels(prev => [...prev]);
                ch.markRead().catch(() => {});
            }),
            ch.on('message.read', () => { syncMessages(ch); setChannels(prev => [...prev]); }),
            ch.on('message.delivered', () => { syncMessages(ch); setChannels(prev => [...prev]); }),
            ch.on('message.deleted', () => { syncMessages(ch); setChannels(prev => [...prev]); }),
            ch.on('message.updated', () => syncMessages(ch)),
        ];
        channelSubsRef.current = subs;

        return () => {
            subs.forEach(s => s.unsubscribe());
            channelSubsRef.current = [];
            ch.stopWatching().catch(() => {});
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeConvId, syncMessages, cacheName]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            channelSubsRef.current.forEach(s => s.unsubscribe());
            channelSubsRef.current = [];
        };
    }, []);

    // ── pagination ────────────────────────────────────────────────────────────
    const loadMore = useCallback(async () => {
        if (!activeChannel || !hasMore) return;
        const oldest = activeChannel.state.messages[0];
        if (!oldest) return;
        const result = await activeChannel.query({ messages: { limit: 25, id_lt: oldest.id } });
        syncMessages(activeChannel);
        setHasMore((result.messages?.length ?? 0) >= 25);
    }, [activeChannel, hasMore, syncMessages]);

    // ── merged message list ───────────────────────────────────────────────────
    const messages = useMemo(() => {
        const realIds = new Set(streamMsgs.map(m => m.id));
        return [
            ...streamMsgs,
            ...optimistic.filter(m => !realIds.has(m.id)),
        ];
    }, [streamMsgs, optimistic]);

    // ── send ──────────────────────────────────────────────────────────────────
    const sendMessage = useCallback(async (text: string) => {
        if (!activeChannel || !myId) return;
        const conv = channelToConversation(activeChannel, myId, nameCache.current[activeChannel.cid]);
        const tid = tempId();

        setOptimistic(prev => [...prev, {
            id: tid,
            conversationId: activeChannel.cid,
            senderId: myId,
            text,
            originalText: text,
            time: new Date().toISOString(),
            status: 'pending',
        }]);

        const now = new Date().toISOString();
        setOptimisticPreviews(prev => ({
            ...prev,
            [activeChannel.cid]: { text, time: now, status: 'pending' },
        }));
        setChannels(prev => [...prev]);

        try {
            const result = await chatService.sendMessage({
                conversationId: activeChannel.cid,
                targetUserId: Number(conv.participant.id),
                text,
            });
            setOptimistic(prev =>
                prev.map(m => m.id === tid ? { ...m, id: result.id, time: result.time, status: 'sent' } : m),
            );
        } catch {
            setOptimistic(prev => prev.filter(m => m.id !== tid));
            setOptimisticPreviews(prev => {
                const next = { ...prev };
                delete next[activeChannel.cid];
                return next;
            });
            throw new Error('Failed to send message');
        }
    }, [activeChannel, myId]);

    // ── send image ────────────────────────────────────────────────────────────
    const sendImage = useCallback(async (file: File) => {
        if (!activeChannel || !myId) return;
        const conv = channelToConversation(activeChannel, myId, nameCache.current[activeChannel.cid]);
        const tid = tempId();

        setOptimistic(prev => [...prev, {
            id: tid,
            conversationId: activeChannel.cid,
            senderId: myId,
            text: '',
            originalText: '',
            time: new Date().toISOString(),
            status: 'pending',
            attachments: [{ type: 'image', imageUrl: URL.createObjectURL(file) }],
        }]);

        const now = new Date().toISOString();
        setOptimisticPreviews(prev => ({
            ...prev,
            [activeChannel.cid]: { text: '📷 Image', time: now, status: 'pending' },
        }));
        setChannels(prev => [...prev]);

        try {
            // Upload to Stream's storage
            const response = await activeChannel.sendImage(file);
            
            // Note: We remove activeChannel.sendMessage here because chatService.sendMessage
            // also sends the message to Stream, causing a duplicate.
            
            // Fallback: Notify backend via existing API (for auditing/push if needed)
            // We still use our custom text tag here so existing backend logic doesn't break
            const result = await chatService.sendMessage({
                conversationId: activeChannel.cid,
                targetUserId: Number(conv.participant.id),
                text: `[IMAGE:${response.file}]`
            });

            // Update time and status since backend responded
            setOptimistic(prev =>
                prev.map(m => m.id === tid ? { ...m, id: result.id, time: result.time, status: 'sent' } : m),
            );
            
            // Note: we let stream's `message.new` handle removing the optimistic placeholder and preview
        } catch (err) {
            setOptimistic(prev => prev.filter(m => m.id !== tid));
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
        
        // Handle optimistic messages (not yet sent to server)
        if (messageId.startsWith('optimistic-')) {
            setOptimistic(prev => prev.filter(m => m.id !== messageId));
            return;
        }

        // Handle real messages
        const msg = activeChannel.state.messages.find(m => m.id === messageId);
        if (msg && (msg.user?.id ?? (msg as any).user_id) !== myId) return;

        try {
            const client = getStreamClient();
            await client.deleteMessage(messageId, true); // Use hard delete for immediate UI feedback
        } catch (err) {
            console.error('[StreamChat] failed to delete message', messageId, err);
            throw err; // propagates to the UI level catch/toast
        }
    }, [activeChannel, myId]);

    // ── mark as read ──────────────────────────────────────────────────────────
    const markAsRead = useCallback(() => {
        activeChannel?.markRead().catch(() => {});
    }, [activeChannel]);

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

    return {
        conversations, convLoading, reloadChannels,
        activeChannel, messages, msgLoading, hasMore, loadMore,
        setActiveConvId,
        sendMessage, sendImage, deleteMessage, markAsRead, startDirectChat,
    };
};
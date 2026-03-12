import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getStreamClient, isStreamConnected } from '../stream/streamClient';
import { chatKeys } from './useChat';
import type { Conversation, Message } from '../types/chat.types';

export const useChatSocket = (userId: string | number | undefined) => {
    const queryClient = useQueryClient();
    const retryRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!userId) return;

        let cleanupFns: (() => void)[] = [];
        let cancelled = false;

        const subscribe = () => {
            if (retryRef.current) {
                clearTimeout(retryRef.current);
                retryRef.current = null;
            }
            if (cancelled) return;
            if (!isStreamConnected()) {
                retryRef.current = setTimeout(subscribe, 1_000);
                return;
            }

            const client = getStreamClient();
            const myId   = String(userId);

            const setMyMessageStatuses = (
                cid: string,
                newStatus: 'sent' | 'delivered' | 'read'
            ) => {
                const rank: Record<string, number> = { pending: 0, sent: 1, delivered: 2, read: 3 };
                const targetRank = rank[newStatus];

                // Update Chat Window (Infinite Query)
                queryClient.setQueryData(chatKeys.messages(cid), (old: any) => {
                    if (!old || !old.pages) return old;

                    let hasChanged = false;
                    const updatedPages = old.pages.map((page: any) => {
                        const updatedMessages = (page.messages || []).map((m: any) => {
                            if (m.senderId === myId) {
                                const currentRank = rank[m.status] ?? 0;
                                if (targetRank > currentRank) {
                                    hasChanged = true;
                                    return { ...m, status: newStatus };
                                }
                            }
                            return m;
                        });
                        return { ...page, messages: updatedMessages };
                    });

                    return hasChanged ? { ...old, pages: updatedPages } : old;
                });

                // Update Sidebar (Conversations List)
                queryClient.setQueryData(chatKeys.conversations(), (old: any[] | undefined) => {
                    if (!old) return old;
                    return old.map(c => {
                        if (c.id !== cid) return c;
                        const currentRank = rank[c.lastMessageStatus ?? 'sent'] ?? 0;
                        if (targetRank > currentRank) {
                            return { ...c, lastMessageStatus: newStatus };
                        }
                        return c;
                    });
                });
            };

            // ------- New message -----
            const { unsubscribe: unsubMsg } = client.on('message.new', event => {
                const msg = event.message;
                const cid = event.cid!;
                if (!msg) return;

                const senderId = String(msg.user_id ?? msg.user?.id ?? '');
                const isMe     = senderId === myId;

                const mapped: Message = {
                    id: msg.id,
                    conversationId: cid,
                    senderId,
                    text: msg.text ?? '',
                    originalText: (msg as any).original_text ?? msg.text ?? '',
                    time: msg.created_at?.toString() ?? new Date().toISOString(),
                    status: isMe ? 'sent' : undefined,
                };

                queryClient.setQueryData(chatKeys.messages(cid), (old: any) => {
                    if (!old) {
                        queryClient.invalidateQueries({ queryKey: chatKeys.messages(cid) });
                        return old;
                    }
                    const pages = [...old.pages];
                    const firstPage = { ...pages[0] };

                    if (isMe) {
                        const alreadyReal = firstPage.messages?.some((m: Message) => m.id === mapped.id);
                        if (alreadyReal) return old;
                        const hasOptimistic = firstPage.messages?.some((m: Message) =>
                            m.id.startsWith('optimistic-'),
                        );
                        firstPage.messages = hasOptimistic
                            ? firstPage.messages.map((m: Message) =>
                                  m.id.startsWith('optimistic-') ? { ...mapped, senderId: m.senderId } : m,
                              )
                            : [...(firstPage.messages ?? []), mapped];
                    } else {
                        const exists = old.pages.some((p: any) =>
                            p.messages?.some((m: Message) => m.id === mapped.id),
                        );
                        if (exists) return old;
                        firstPage.messages = [...(firstPage.messages ?? []), mapped];
                    }

                    pages[0] = firstPage;
                    return { ...old, pages };
                });

                queryClient.setQueryData(
                    chatKeys.conversations(),
                    (old: Conversation[] | undefined) => {
                        if (!old) return old;
                        const exists = old.some(c => c.id === cid);
                        if (!exists) {
                            queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
                            return old;
                        }
                        return old.map(c =>
                            c.id === cid
                                ? {
                                      ...c,
                                      lastMessage: mapped.text,
                                      lastMessageOriginal: mapped.originalText,
                                      lastMessageSenderId: mapped.senderId,
                                      lastMessageTime: mapped.time,
                                      lastMessageStatus: isMe ? 'sent' : c.lastMessageStatus,
                                      unreadCount: isMe ? c.unreadCount : (c.unreadCount ?? 0) + 1,
                                  }
                                : c,
                        );
                    },
                );
            });

            // Delivery receipt
            const { unsubscribe: unsubDelivered } = client.on('message.delivered', event => {
                const cid = event.cid!;
                if (!cid) return;
                setMyMessageStatuses(cid, 'delivered');
            });

            // Read receipt
            const { unsubscribe: unsubRead } = client.on('message.read', event => {
                const cid      = event.cid!;
                const readerId = String(event.user?.id ?? '');
                if (!readerId || readerId === myId) return;
                setMyMessageStatuses(cid, 'read');

                // Clear unread badge
                queryClient.setQueryData(
                    chatKeys.conversations(),
                    (old: Conversation[] | undefined) => {
                        if (!old) return old;
                        return old.map(c => c.id === cid ? { ...c, unreadCount: 0 } : c);
                    },
                );
            });

            // Message deleted
            const { unsubscribe: unsubDeleted } = client.on('message.deleted', event => {
                const msg = event.message;
                const cid = event.cid!;
                if (!msg) return;

                queryClient.setQueryData(chatKeys.messages(cid), (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map((page: any) => ({
                            ...page,
                            messages: page.messages?.filter((m: Message) => m.id !== msg.id),
                        })),
                    };
                });
                queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
            });

            // Presence
            const { unsubscribe: unsubPresence } = client.on('user.presence.changed', event => {
                const changedId = event.user?.id;
                const isOnline  = event.user?.online ?? false;
                if (!changedId) return;

                queryClient.setQueryData(
                    chatKeys.conversations(),
                    (old: Conversation[] | undefined) => {
                        if (!old) return old;
                        return old.map(c => {
                            if (c.participant.id !== changedId) return c;
                            return {
                                ...c,
                                isOnline,
                                lastActive: event.user?.last_active
                                    ? new Date(event.user.last_active).toISOString()
                                    : c.lastActive,
                            };
                        });
                    },
                );

                if (!isOnline) return;

                const convos = queryClient.getQueryData<Conversation[]>(
                    chatKeys.conversations(),
                ) ?? [];

                convos
                    .filter(c => c.participant.id === changedId)
                    .forEach(c => setMyMessageStatuses(c.id, 'delivered'));
            });

            // New channel
            const { unsubscribe: unsubChannelVisible } = client.on(
                'notification.added_to_channel',
                () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations() }),
            );

            // Message in unwatched channel
            const { unsubscribe: unsubNotifMsg } = client.on('notification.message_new', event => {
                queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
                queryClient.invalidateQueries({ queryKey: chatKeys.messages(event.cid!) });
            });

            cleanupFns = [
                unsubMsg, unsubDelivered, unsubRead, unsubDeleted,
                unsubPresence, unsubChannelVisible, unsubNotifMsg,
            ];
        };

        subscribe();

        return () => {
            cancelled = true;
            if (retryRef.current) {
                clearTimeout(retryRef.current);
                retryRef.current = null;
            }
            cleanupFns.forEach(fn => fn());
        };
    }, [userId, queryClient]);
};
import {
    useQuery,
    useInfiniteQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';
import { chatService } from '../services/chat.service';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { Conversation, Message, SendMessagePayload } from '../types/chat.types';

export const chatKeys = {
    all: ['chat'] as const,
    conversations: () => [...chatKeys.all, 'conversations'] as const,
    messages: (cid: string) => [...chatKeys.all, 'messages', cid] as const,
};

let optimisticCounter = 0;
const nextOptimisticId = () => `optimistic-${++optimisticCounter}`;

// Conversations
export const useConversations = (enabled = true) =>
    useQuery({
        queryKey: chatKeys.conversations(),
        queryFn: () => chatService.getConversations(),
        staleTime: 30_000,
        enabled,
    });

// Messages
export const useMessages = (conversationId: string | null) =>
    useInfiniteQuery({
        queryKey: chatKeys.messages(conversationId ?? ''),
        queryFn: ({ pageParam }) =>
        chatService.getMessages(conversationId!, pageParam as string | undefined),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: last => last.nextCursor ?? undefined,
        enabled: Boolean(conversationId),
        staleTime: 10_000,
    });

// Send message
export const useSendMessage = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: (payload: SendMessagePayload) => chatService.sendMessage(payload),

        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: chatKeys.messages(payload.conversationId) });
            await queryClient.cancelQueries({ queryKey: chatKeys.conversations() });

            const snapshotMessages = queryClient.getQueryData(chatKeys.messages(payload.conversationId));
            const snapshotConversations = queryClient.getQueryData(chatKeys.conversations());

            const optimisticId = nextOptimisticId();
            const now = new Date().toISOString();

            const optimisticMsg: Message = {
                id: optimisticId,
                conversationId: payload.conversationId,
                senderId: String(user?.id ?? 'me'),
                text: payload.text,
                originalText: payload.text,
                time: now,
                status: 'pending',
            };

            // Add to chat window
            queryClient.setQueryData(chatKeys.messages(payload.conversationId), (old: any) => {
                if (!old) return old;
                const pages = [...old.pages];
                const firstPage = { ...pages[0] };
                firstPage.messages = [...(firstPage.messages ?? []), optimisticMsg];
                pages[0] = firstPage;
                return { ...old, pages };
            });

            // Update sidebar optimistically
            queryClient.setQueryData(chatKeys.conversations(), (old: Conversation[] | undefined) => {
                const list = old ?? [];
                const exists = list.some(c => c.id === payload.conversationId);
                if (!exists) return list;
                return list.map(c =>
                    c.id === payload.conversationId
                        ? {
                              ...c,
                              lastMessage: payload.text,
                              lastMessageOriginal: payload.text,
                              lastMessageSenderId: String(user?.id ?? ''),
                              lastMessageTime: now,
                              lastMessageStatus: 'pending' as const,
                          }
                        : c,
                );
            });

            return { snapshotMessages, snapshotConversations, optimisticId, sentText: payload.text, sentTime: now };
        },

        onSuccess: (newMsg, payload, ctx) => {
            const optimisticId = ctx?.optimisticId;
            const confirmedId = newMsg?.id ?? optimisticId;
            const confirmedTime = newMsg?.time ?? ctx?.sentTime ?? new Date().toISOString();

            const originalText = ctx?.sentText ?? payload.text;

            queryClient.setQueryData(chatKeys.messages(payload.conversationId), (old: any) => {
                if (!old) return old;

                const pages = old.pages.map((page: any) => {
                const messages: Message[] = page.messages ?? [];

                const realAlreadyExists =
                    confirmedId !== optimisticId &&
                    messages.some(m => m.id === confirmedId);

                if (realAlreadyExists) {
                    return {
                    ...page,
                    messages: messages.filter(m => m.id !== optimisticId),
                    };
                }

                return {
                    ...page,
                    messages: messages.map(m =>
                    m.id === optimisticId
                        ? {
                            ...m,
                            id: confirmedId,
                            text: originalText,
                            originalText: originalText,
                            time: confirmedTime,
                            status: 'sent' as const,
                        }
                        : m,
                    ),
                };
                });

                return { ...old, pages };
            });

            queryClient.setQueryData(chatKeys.conversations(), (old: Conversation[] | undefined) => {
                if (!old) return old;

                return old.map(c =>
                c.id === payload.conversationId
                    ? {
                        ...c,
                        lastMessage: originalText,
                        lastMessageOriginal: originalText,
                        lastMessageSenderId: String(user?.id ?? ''),
                        lastMessageTime: confirmedTime,
                        lastMessageStatus: 'sent' as const,
                    }
                    : c,
                );
            });
        },
        onError: (_err, payload, ctx) => {
            if (ctx?.snapshotMessages) {
                queryClient.setQueryData(chatKeys.messages(payload.conversationId), ctx.snapshotMessages);
            }
            if (ctx?.snapshotConversations) {
                queryClient.setQueryData(chatKeys.conversations(), ctx.snapshotConversations);
            }
        },
    });
};

// Delete message
export const useDeleteMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ messageId }: { messageId: string; conversationId: string }) =>
            chatService.deleteMessage(messageId),

        onMutate: async ({ messageId, conversationId }) => {
            await queryClient.cancelQueries({ queryKey: chatKeys.messages(conversationId) });
            const snapshot = queryClient.getQueryData(chatKeys.messages(conversationId));
            queryClient.setQueryData(chatKeys.messages(conversationId), (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        messages: page.messages.filter((m: Message) => m.id !== messageId),
                    })),
                };
            });
            return { snapshot };
        },

        onSuccess: (_data, { conversationId }) => {
            queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
        },

        onError: (_err, { conversationId }, ctx) => {
            if (ctx?.snapshot) {
                queryClient.setQueryData(chatKeys.messages(conversationId), ctx.snapshot);
            }
        },
    });
};

// Mark as read
export const useMarkAsRead = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (conversationId: string) => chatService.markAsRead(conversationId),
        onSuccess: (_data, conversationId) => {
            queryClient.setQueryData(chatKeys.conversations(), (old: Conversation[] | undefined) => {
                if (!old) return old;
                return old.map(c => c.id === conversationId ? { ...c, unreadCount: 0 } : c);
            });
        },
    });
};

// Start direct chat
export interface StartDirectChatInput {
    targetUserId: number;
    targetName?: string;
    targetAvatar?: string;
}

export const useStartDirectChat = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    return useMutation({
        mutationFn: ({ targetUserId, targetName, targetAvatar }: StartDirectChatInput) =>
            chatService.startDirectChat(
                targetUserId,
                {
                    id: String(user!.id),
                    name: user!.fullName ?? user!.username ?? String(user!.id),
                    avatar: user!.profileImage ?? '',
                },
                targetName ? { name: targetName, avatar: targetAvatar ?? '' } : undefined,
            ),

        onSuccess: ({ conversation }) => {
            queryClient.setQueryData(
                chatKeys.conversations(),
                (old: Conversation[] | undefined) => {
                    const list   = old ?? [];
                    const exists = list.some(c => c.id === conversation.id);
                    return exists ? list : [conversation, ...list];
                },
            );
        },
    });
};

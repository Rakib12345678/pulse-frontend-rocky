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
    all:           ['chat'] as const,
    conversations: ()            => [...chatKeys.all, 'conversations'] as const,
    messages:      (cid: string) => [...chatKeys.all, 'messages', cid] as const,
};

// Conversations
export const useConversations = (enabled = true) =>
    useQuery({
        queryKey:  chatKeys.conversations(),
        queryFn:   () => chatService.getConversations(),
        staleTime: 30_000,
        enabled,
    });

// Messages
export const useMessages = (conversationId: string | null) =>
    useInfiniteQuery({
        queryKey:         chatKeys.messages(conversationId ?? ''),
        queryFn:          ({ pageParam }) =>
            chatService.getMessages(conversationId!, pageParam as string | undefined),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: last => last.nextCursor ?? undefined,
        enabled:           Boolean(conversationId),
        staleTime:         10_000,
    });

// Send message
export const useSendMessage = () => {
    const queryClient = useQueryClient();
    const { user }    = useAuthStore();

    return useMutation({
        mutationFn: (payload: SendMessagePayload) => chatService.sendMessage(payload),

        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: chatKeys.messages(payload.conversationId) });
            const snapshot = queryClient.getQueryData(chatKeys.messages(payload.conversationId));

            const optimistic: Message = {
                id:             `optimistic-${Date.now()}`,
                conversationId: payload.conversationId,
                senderId:       String(user?.id ?? 'me'),
                text:           payload.text,
                time:           new Date().toISOString(),
                status:         'pending',
            };

            queryClient.setQueryData(chatKeys.messages(payload.conversationId), (old: any) => {
                if (!old) return old;
                const pages     = [...old.pages];
                const firstPage = { ...pages[0] };
                firstPage.messages = [...(firstPage.messages ?? []), optimistic];
                pages[0] = firstPage;
                return { ...old, pages };
            });

            return { snapshot };
        },

        onSuccess: (newMsg, payload) => {
            queryClient.setQueryData(chatKeys.messages(payload.conversationId), (old: any) => {
                if (!old) return old;
                const pages = old.pages.map((page: any) => {
                    const messages = page.messages ?? [];
                    const realAlreadyExists = messages.some((m: Message) => m.id === newMsg.id);
                    if (realAlreadyExists) {
                        return { ...page, messages: messages.filter((m: Message) => !m.id.startsWith('optimistic-')) };
                    }
                    const hasOptimistic = messages.some((m: Message) => m.id.startsWith('optimistic-'));
                    if (hasOptimistic) {
                        return {
                            ...page,
                            messages: messages.map((m: Message) =>
                                m.id.startsWith('optimistic-') ? { ...newMsg, status: 'sent' as const } : m,
                            ),
                        };
                    }
                    return page;
                });
                return { ...old, pages };
            });
            queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
        },

        onError: (_err, payload, ctx) => {
            if (ctx?.snapshot) {
                queryClient.setQueryData(chatKeys.messages(payload.conversationId), ctx.snapshot);
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
    targetName?:   string;
    targetAvatar?: string;
}

export const useStartDirectChat = () => {
    const queryClient = useQueryClient();
    const { user }    = useAuthStore();

    return useMutation({
        mutationFn: ({ targetUserId, targetName, targetAvatar }: StartDirectChatInput) =>
            chatService.startDirectChat(
                targetUserId,
                {
                    id:     String(user!.id),
                    name:   user!.fullName ?? user!.username ?? String(user!.id),
                    avatar: user!.profileImage ?? '',
                },
                targetName   ? { name: targetName, avatar: targetAvatar ?? '' } : undefined,
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

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { RightSidebar } from './RightSidebar';
import { isStreamConnected } from '../stream/streamClient';
import { chatService } from '../services/chat.service';
import { SESSION_ACTIVE_KEY } from '@/features/chat/utils/chatConstants';
import type { Conversation } from '../types/chat.types';
import { useStreamChat } from '@/features/chat/hooks/useStreamChats';
import background from '@/assets/background.png';

const saveSession = (id: string) => sessionStorage.setItem(SESSION_ACTIVE_KEY, id);
const loadSession = (): string | null => sessionStorage.getItem(SESSION_ACTIVE_KEY);
const clearSession = () => sessionStorage.removeItem(SESSION_ACTIVE_KEY);

interface ChatPageProps {
    onClose?: () => void;
    asModal?: boolean;
    initialConversationId?: string;
}

export const ChatPage: React.FC<ChatPageProps> = ({
    onClose,
    asModal = false,
    initialConversationId,
}) => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const myId = String(user?.id ?? '');

    const [streamReady, setStreamReady] = useState(false);

    // Reset state only if the logged-in user ACTUALLY switches accounts
    const previousMyId = useRef(myId);
    useEffect(() => {
        if (previousMyId.current && myId && previousMyId.current !== myId) {
            setStreamReady(false);
            setLocalConvId(null);
            setDisplayConversation(null);
            clearSession();
        }
        previousMyId.current = myId;
    }, [myId]);

    useEffect(() => {
        if (streamReady) return;
        const id = setInterval(() => {
            if (isStreamConnected()) {
                setStreamReady(true);
                clearInterval(id);
            }
        }, 200);
        return () => clearInterval(id);
    }, [streamReady]);

    const chat = useStreamChat(myId, streamReady);

    const [localConvId, setLocalConvId] = useState<string | null>(
        () => initialConversationId ?? loadSession(),
    );
    const [mobileShowList, setMobileShowList] = useState(!localConvId);
    const [displayConversation, setDisplayConversation] = useState<Conversation | null>(null);

    useEffect(() => {
        if (!localConvId) setMobileShowList(true);
    }, [localConvId]);

    const activatedOnReadyRef = useRef(false);
    useEffect(() => {
        if (!streamReady) {
            activatedOnReadyRef.current = false;
            return;
        }
        if (activatedOnReadyRef.current) return;
        activatedOnReadyRef.current = true;
        if (localConvId) chat.setActiveConvId(localConvId);
    }, [streamReady, localConvId]);

    const fetchingRef = useRef(false);
    useEffect(() => {
        if (!localConvId || !streamReady) return;
        const found = chat.conversations.find(c => c.id === localConvId);
        if (found) { setDisplayConversation(found); return; }
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        let mounted = true;
        chatService
            .getConversationById(localConvId)
            .then(conv => { if (mounted) setDisplayConversation(conv); })
            .catch(() => { })
            .finally(() => { fetchingRef.current = false; });

        return () => { mounted = false; };
    }, [localConvId, streamReady, chat.conversations]);

    const staleRef = useRef<Conversation | null>(null);
    const prevIdRef = useRef<string | null>(null);
    if (prevIdRef.current !== localConvId) {
        prevIdRef.current = localConvId;
        staleRef.current = null;
    }
    if (displayConversation) staleRef.current = displayConversation;
    const activeConversation = displayConversation ?? staleRef.current;

    const handleSelect = (conversation: Conversation) => {
        setLocalConvId(conversation.id);
        setDisplayConversation(conversation);
        chat.setActiveConvId(conversation.id);
        setMobileShowList(false);
        saveSession(conversation.id);
    };

    const handleBack = () => {
        setLocalConvId(null);
        setDisplayConversation(null);
        chat.setActiveConvId(null);
        setMobileShowList(true);
        clearSession();
        if (!asModal) navigate({ to: '/chats', search: {}, replace: true });
    };

    const handleConversationDeleted = (deletedId: string) => {
        if (localConvId === deletedId) {
            setLocalConvId(null);
            setDisplayConversation(null);
            chat.setActiveConvId(null);
            setMobileShowList(true);
            clearSession();
        }
    };

    const modalBg: React.CSSProperties = {
        backgroundColor: '#0d0a09',
        backgroundImage: `linear-gradient(rgba(0,0,0,0.82), rgba(0,0,0,0.82)), url(${background})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '300px 300px',
    };

    const sidebarProps = {
        conversations: chat.conversations,
        isLoading: chat.convLoading,
        activeConversationId: localConvId,
        onSelect: handleSelect,
        onClose,
        onConversationDeleted: handleConversationDeleted,
        onReloadChannels: chat.reloadChannels,
        onStartDirectChat: chat.startDirectChat,
        onArchive: chat.archiveConversation,
        onUnarchive: chat.unarchiveConversation,
        onMute: chat.muteConversation,
        onUnmute: chat.unmuteConversation,
    };

    const windowProps = {
        conversation: activeConversation,
        isLoadingConversation: !!localConvId && !activeConversation && !streamReady,
        onBack: handleBack,
        messages: chat.messages,
        msgLoading: chat.msgLoading,
        hasMore: chat.hasMore,
        loadMore: chat.loadMore,
        onSend: chat.sendMessage,
        onSendImage: chat.sendImage,
        onDelete: chat.deleteMessage,
        onReact: chat.sendReaction,
        onDeleteReaction: chat.deleteReaction,
        onMarkAsRead: chat.markAsRead,
    };

    if (asModal) {
        return (
            <div className="fixed inset-0 z-300 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
                <div
                    className="relative w-full max-w-240 h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] max-h-190 flex overflow-hidden rounded-2xl border border-white/8 shadow-2xl"
                    style={modalBg}
                >
                    {user && (
                        <div className={cn(
                            'h-full w-full sm:w-70 md:w-77.5 shrink-0 flex flex-col bg-[#111213]/90 border-r border-white/8',
                            mobileShowList ? 'flex' : 'hidden sm:flex',
                        )}>
                            <div className="flex flex-col flex-1 overflow-hidden px-5 py-5">
                                {streamReady && <ChatSidebar {...sidebarProps} />}
                            </div>
                        </div>
                    )}
                    <div className={cn(
                        'flex-1 min-w-0 flex flex-col overflow-hidden',
                        mobileShowList ? 'hidden sm:flex' : 'flex',
                    )}>
                        <ChatWindow {...windowProps} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex-1 min-h-0 overflow-hidden flex flex-col">

            {/* MOBILE */}
            <div className="flex flex-1 min-h-0 md:hidden">
                <div
                    className={cn('flex-1 flex flex-col overflow-hidden', mobileShowList ? 'flex' : 'hidden')}
                    style={{ background: '#111213' }}
                >
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-3 py-2">
                        {streamReady && <ChatSidebar {...sidebarProps} />}
                    </div>
                </div>
                {!mobileShowList && (
                    <div className="fixed inset-0 z-350 flex flex-col bg-[#0d0d0d] md:hidden">
                        <ChatWindow {...windowProps} mobileFullscreen />
                    </div>
                )}
            </div>

            {/* DESKTOP */}
            <div className="hidden md:flex flex-1 min-h-0 pb-0">
                {user && (
                    <div
                        className="flex flex-col shrink-0 w-72 lg:w-90 xl:w-110 overflow-hidden -mb-1px pb-6"
                        style={{ background: '#111213' }}
                    >
                        <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-5 py-5">
                            {streamReady && <ChatSidebar {...sidebarProps} />}
                        </div>
                    </div>
                )}
                <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden -mb-1px">
                    <ChatWindow {...windowProps} />
                </div>
                {/* Right Sidebar Utility */}
                {user && <RightSidebar className="hidden md:flex shrink-0 border-l border-white/5" />}
            </div>
        </div>
    );
};
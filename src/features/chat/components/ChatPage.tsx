import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { useConversations } from '../hooks/useChat';
import { useChatSocket } from '../hooks/useChatSocket';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { chatService } from '../services/chat.service';
import { SESSION_ACTIVE_KEY } from '@/features/chat/utils/chatConstants';
import type { Conversation } from '../types/chat.types';
import background from '@/assets/background.png';

// Session helpers

const saveSession  = (id: string) => sessionStorage.setItem(SESSION_ACTIVE_KEY, id);
const loadSession  = (): string | null => sessionStorage.getItem(SESSION_ACTIVE_KEY);
const clearSession = () => sessionStorage.removeItem(SESSION_ACTIVE_KEY);

// ChatPage

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

    const [localConvId, setLocalConvId] = useState<string | null>(() => {
        return initialConversationId ?? loadSession();
    });

    const [mobileShowList, setMobileShowList] = useState(!localConvId);

    const [directConversation, setDirectConversation] = useState<Conversation | null>(null);
    const fetchingDirectRef = useRef(false);

    useChatSocket(user?.id);

    const { data: conversations = [], isLoading } = useConversations();

    useEffect(() => {
        setDirectConversation(null);
        fetchingDirectRef.current = false;
    }, [localConvId]);

    useEffect(() => {
        if (!localConvId) return;
        if (isLoading) return;
        if (conversations.find(c => c.id === localConvId)) return;
        if (directConversation?.id === localConvId) return;
        if (fetchingDirectRef.current) return;

        fetchingDirectRef.current = true;
        chatService
            .getConversationById(localConvId)
            .then(conv => setDirectConversation(conv))
            .catch(() => {})
            .finally(() => { fetchingDirectRef.current = false; });
    }, [localConvId, isLoading, conversations, directConversation]);

    const lastKnownConvRef   = useRef<Conversation | null>(null);
    const prevLocalConvIdRef = useRef<string | null>(null);
    if (prevLocalConvIdRef.current !== localConvId) {
        prevLocalConvIdRef.current = localConvId;
        lastKnownConvRef.current   = null;
    }

    const foundInList = conversations.find(c => c.id === localConvId) ?? null;
    const resolved    = foundInList ?? directConversation;
    if (resolved) lastKnownConvRef.current = resolved;

    const activeConversation    = resolved ?? lastKnownConvRef.current;
    const isLoadingConversation = !!localConvId && !activeConversation && isLoading;

    const handleSelect = (conversation: Conversation) => {
        setLocalConvId(conversation.id);
        setMobileShowList(false);
        saveSession(conversation.id);
    };

    const handleBack = () => {
        setMobileShowList(true);
        clearSession();
        if (!asModal) {
            navigate({ to: '/chats', search: {}, replace: true });
        }
    };

    const handleConversationDeleted = (deletedId: string) => {
        if (localConvId === deletedId) {
            setLocalConvId(null);
            setMobileShowList(true);
            clearSession();
        }
    };

    const modalBg: React.CSSProperties = {
        backgroundColor:  '#0d0a09',
        backgroundImage:  `linear-gradient(rgba(0,0,0,0.82), rgba(0,0,0,0.82)), url(${background})`,
        backgroundRepeat: 'repeat',
        backgroundSize:   '300px 300px',
    };

    // Modal mode
    if (asModal) {
        return (
            <div className="fixed inset-0 z-300 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
                <div
                    className="relative w-full max-w-240 h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-2rem)] max-h-190 flex overflow-hidden rounded-2xl border border-white/8 shadow-2xl"
                    style={modalBg}
                >
                    <div className={cn(
                        'h-full w-full sm:w-70 md:w-77.5 shrink-0 flex flex-col bg-[#111213]/90 border-r border-white/8',
                        mobileShowList ? 'flex' : 'hidden sm:flex',
                    )}>
                        <div className="flex flex-col flex-1 overflow-hidden px-5 py-5">
                            <ChatSidebar
                                conversations={conversations}
                                isLoading={isLoading}
                                activeConversationId={localConvId}
                                onSelect={handleSelect}
                                onClose={onClose}
                                onConversationDeleted={handleConversationDeleted}
                            />
                        </div>
                    </div>
                    <div className={cn(
                        'flex-1 min-w-0 flex flex-col overflow-hidden',
                        mobileShowList ? 'hidden sm:flex' : 'flex',
                    )}>
                        <ChatWindow
                            conversation={activeConversation}
                            isLoadingConversation={isLoadingConversation}
                            onBack={handleBack}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Full page mode
    return (
        <div className="w-full flex-1 min-h-0 overflow-hidden flex flex-col">

            {/* MOBILE */}
            <div className="flex flex-1 min-h-0 md:hidden">
                <div
                    className={cn('flex-1 flex flex-col overflow-hidden', mobileShowList ? 'flex' : 'hidden')}
                    style={{ background: '#111213' }}
                >
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 py-4">
                        <ChatSidebar
                            conversations={conversations}
                            isLoading={isLoading}
                            activeConversationId={localConvId}
                            onSelect={handleSelect}
                            onClose={onClose}
                            onConversationDeleted={handleConversationDeleted}
                        />
                    </div>
                </div>
                {!mobileShowList && (
                    <div className="fixed inset-0 z-350 flex flex-col bg-[#0d0d0d] md:hidden">
                        <ChatWindow
                            conversation={activeConversation}
                            isLoadingConversation={isLoadingConversation}
                            onBack={handleBack}
                            mobileFullscreen
                        />
                    </div>
                )}
            </div>

            {/* DESKTOP */}
            <div className="hidden md:flex flex-1 min-h-0 pb-0 pl-14 lg:pl-16">
                <div
                    className="flex flex-col shrink-0 w-90 lg:w-97 xl:w-112.5 overflow-hidden -mb-1px pb-6"
                    style={{ background: '#111213' }}
                >
                    <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-5 py-5">
                        <ChatSidebar
                            conversations={conversations}
                            isLoading={isLoading}
                            activeConversationId={localConvId}
                            onSelect={handleSelect}
                            onClose={onClose}
                            onConversationDeleted={handleConversationDeleted}
                        />
                    </div>
                </div>

                <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden -mb-1px">
                    <ChatWindow
                        conversation={activeConversation}
                        isLoadingConversation={isLoadingConversation}
                        onBack={handleBack}
                    />
                </div>
            </div>
        </div>
    );
};
import React from 'react';
import { Loader2, WifiOff, SquarePen, X, Pin, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Conversation, MessageStatus } from '../types/chat.types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useTranslationPreference } from '../hooks/useTranslationPreference';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { PINNED_STORAGE_KEY } from '@/features/chat/utils/chatConstants';
import { Avatar } from '@/features/chat/components/Avatar';
import { UserSearchList, type StreamUser } from '@/features/chat/components/Usersearchlist';
import { capitalizeName, getDisplayName, formatRelativeTime } from '@/features/chat/utils/ChatUtils';
import { toAbsoluteUrl } from '@/features/chat/utils/chat';
import { chatService } from '../services/chat.service';
import chatGroup  from '@/assets/chatGroup.svg';
import SearchIcon from '@/assets/Search.svg';

// TickIcon

export const TickIcon = ({ status }: { status?: MessageStatus }) => {
    if (status === 'pending') return (
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
    if (status === 'sent') return (
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 16 10" fill="none">
            <path d="M1 5l4 4L15 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    if (status === 'delivered') return (
        <svg className="w-4 h-3.5 text-gray-400 shrink-0" viewBox="0 0 20 10" fill="none">
            <path d="M1 5l4 4L15 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 5l4 4L20 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    if (status === 'read') return (
        <svg className="w-4 h-3.5 text-blue-400 shrink-0" viewBox="0 0 20 10" fill="none">
            <path d="M1 5l4 4L15 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 5l4 4L20 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    return null;
};

// relative time ticker

const useRelativeTicker = () => {
    const [, setTick] = React.useState(0);
    React.useEffect(() => {
        const id = setInterval(() => setTick(n => n + 1), 30_000);
        return () => clearInterval(id);
    }, []);
};

// pinned helpers

const getPinned = (): string[] => {
    try { return JSON.parse(sessionStorage.getItem(PINNED_STORAGE_KEY) ?? '[]'); } catch { return []; }
};
const setPinned = (ids: string[]) => sessionStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(ids));

// NewChatModal

const NewChatModal = ({
    onClose, onStartChat, isStarting,
}: {
    onClose: () => void;
    onStartChat: (user: StreamUser) => void;
    isStarting: boolean;
}) => {
    const backdropRef = React.useRef<HTMLDivElement>(null);
    return (
        <div
            ref={backdropRef}
            onClick={e => { if (e.target === backdropRef.current) onClose(); }}
            className="fixed inset-0 z-400 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        >
            <div className="relative w-full max-w-125 bg-[#111213] rounded-2xl border border-white/10 shadow-2xl overflow-hidden px-8">
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-900/30 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 px-6 pt-6 pb-5 flex flex-col gap-10">
                    <div className="flex items-center justify-center">
                        <h2 className="text-white font-semibold text-lg">New Chat</h2>
                    </div>
                    <UserSearchList
                        placeholder="Search Creator Name Here..."
                        actionLabel="Tap to Chat"
                        emptyMessage="Type a name to search"
                        onSelectUser={onStartChat}
                        isProcessing={isStarting}
                        listClassName="max-h-80"
                    />
                </div>
            </div>
        </div>
    );
};

// ConfirmDeleteModal

const ConfirmDeleteModal = ({
    name, onConfirm, onCancel, isDeleting,
}: {
    name: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
}) => (
    <div className="fixed inset-0 z-600 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
        <div className="w-full max-w-sm bg-[#1a1c23] border border-white/10 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-white font-semibold text-base">Delete Conversation</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                    Are you sure you want to delete your conversation with{' '}
                    <span className="text-white font-medium">{name}</span>? This cannot be undone.
                </p>
            </div>
            <div className="flex gap-3 mt-1">
                <button
                    onClick={onCancel}
                    disabled={isDeleting}
                    className="flex-1 h-11 rounded-full border border-white/15 text-gray-300 text-sm font-medium hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={isDeleting}
                    className="flex-1 h-11 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                </button>
            </div>
        </div>
    </div>
);

// ConversationDropdown 

const ConversationDropdown = ({
    isPinned, onPin, onDelete, onClose,
}: {
    isPinned: boolean;
    onPin: () => void;
    onDelete: () => void;
    onClose: () => void;
}) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        const t = setTimeout(() => document.addEventListener('mousedown', h), 80);
        return () => { clearTimeout(t); document.removeEventListener('mousedown', h); };
    }, [onClose]);

    return (
        <div ref={ref} className="absolute top-full left-2 mt-0.5 z-50 w-60 bg-[#1e2029] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <button
                onClick={e => { e.stopPropagation(); onPin(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-200 hover:bg-white/8 transition-colors"
            >
                <Pin className="w-4 h-4 shrink-0 text-gray-400" />
                {isPinned ? 'Unpin' : 'Pin'}
            </button>
            <button
                onClick={e => { e.stopPropagation(); onDelete(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/8"
            >
                <Trash2 className="w-4 h-4 shrink-0" /> Delete
            </button>
        </div>
    );
};

// ChatListItem

const ChatListItem = ({
    conversation, isActive, isPinned, myId, translateEnabled,
    onClick, onDeleteRequest, onPinToggle,
}: {
    conversation: Conversation;
    isActive: boolean;
    isPinned: boolean;
    myId: string;
    translateEnabled: boolean;
    onClick: () => void;
    onDeleteRequest: (c: Conversation) => void;
    onPinToggle: (c: Conversation) => void;
}) => {
    const [open, setOpen] = React.useState(false);

    const isMine = conversation.lastMessageSenderId === myId;
    const preview = isMine
        ? (conversation.lastMessageOriginal || conversation.lastMessage)
        : (translateEnabled
            ? conversation.lastMessage
            : (conversation.lastMessageOriginal || conversation.lastMessage));

    return (
        <div
            className="relative"
            onDoubleClick={e => { e.preventDefault(); setOpen(v => !v); }}
            onContextMenu={e => { e.preventDefault(); setOpen(v => !v); }}
        >
            <button
                onClick={onClick}
                className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group',
                    isActive ? '' : 'hover:bg-white/5',
                )}
            >
                <div className="relative shrink-0">
                    <Avatar
                        src={conversation.participant.avatar}
                        alt={capitalizeName(conversation.participant.name)}
                        className="w-11 h-11 sm:w-12 sm:h-12"
                    />
                    {conversation.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-[#111213]" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-white text-sm font-semibold truncate">
                            {capitalizeName(conversation.participant.name)}
                            {isPinned && <Pin className="w-3 h-3 text-[#FF7700] shrink-0 rotate-45" />}
                        </span>
                        {conversation.unreadCount > 0 ? (
                            <span className="shrink-0 min-w-4.5 h-4.5 px-1 rounded-full bg-[#FF7700] flex items-center justify-center text-[10px] font-bold text-black">
                                {conversation.unreadCount}
                            </span>
                        ) : (
                            <span className="shrink-0 text-[10px] text-gray-500">
                                {formatRelativeTime(conversation.lastMessageTime)}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                        {conversation.lastMessageStatus && (
                            <TickIcon status={conversation.lastMessageStatus} />
                        )}
                        <span className={cn(
                            'text-xs truncate',
                            conversation.lastMessageStatus === 'pending' ? 'text-yellow-400/70' : 'text-gray-400',
                        )}>
                            {preview}
                        </span>
                    </div>
                </div>
            </button>

            {open && (
                <ConversationDropdown
                    isPinned={isPinned}
                    onPin={() => onPinToggle(conversation)}
                    onDelete={() => { onDeleteRequest(conversation); setOpen(false); }}
                    onClose={() => setOpen(false)}
                />
            )}
        </div>
    );
};

// ChatSidebar 
interface ChatSidebarProps {
    conversations: Conversation[];
    isLoading: boolean;
    activeConversationId: string | null;
    onReloadChannels: () => Promise<void>;
    onStartDirectChat: (targetUserId: number, targetName?: string, targetAvatar?: string) => Promise<Conversation>;
    onSelect: (conversation: Conversation) => void;
    onClose?: () => void;
    onConversationDeleted?: (conversationId: string) => void;
    className?: string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    conversations, isLoading, activeConversationId,
    onStartDirectChat,
    onSelect, onClose, onConversationDeleted, className,
}) => {
    const { user } = useAuthStore();
    const myId = String(user?.id ?? '');
    const isOnline = useOnlineStatus();
    useRelativeTicker();

    const [searchQuery, setSearchQuery] = React.useState('');
    const [showNewChat, setShowNewChat] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState<Conversation | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isStarting, setIsStarting] = React.useState(false);
    const [pinnedIds, setPinnedIds] = React.useState<string[]>(getPinned);

    const { translateEnabled } = useTranslationPreference(myId);

    const handlePin = (conv: Conversation) => {
        const alreadyPinned = pinnedIds.includes(conv.id);
        setPinnedIds(prev => {
            const next = alreadyPinned ? prev.filter(id => id !== conv.id) : [...prev, conv.id];
            setPinned(next);
            return next;
        });
        toast.success(alreadyPinned ? 'Conversation unpinned' : 'Conversation pinned', {
            description: capitalizeName(conv.participant.name),
            classNames: { description: '!text-black' },
        });
    };
    const handleDeleteConfirmed = async (conv: Conversation) => {
        setIsDeleting(true);
        try {
            await chatService.hideOrDeleteConversation(conv.id);
            onConversationDeleted?.(conv.id);
            setConfirmDelete(null);
            toast.success('Chat deleted', {
                description: `Chat with ${capitalizeName(conv.participant.name)} has been removed.`,
                classNames: { description: '!text-black' },
            });
        } catch (e) {
            console.error('[ChatSidebar] Delete failed:', e);
            toast.error('Failed to delete chat', {
                description: 'Something went wrong. Please try again.',
                classNames: { description: '!text-black' },
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStartChat = async (streamUser: StreamUser) => {
        const targetId = parseInt(streamUser.id, 10);
        if (isNaN(targetId)) return;
        const displayName = capitalizeName(getDisplayName(streamUser));
        const avatar = toAbsoluteUrl((streamUser as any).image || '');
        setIsStarting(true);
        try {
            const conversation = await onStartDirectChat(targetId, displayName, avatar);
            setShowNewChat(false);
            onSelect(conversation);
        } catch {
            toast.error('Failed to start chat');
        } finally {
            setIsStarting(false);
        }
    };

    const filtered = conversations
        .filter(c => {
            if (c.id === activeConversationId) return true;
            if (!c.lastMessage && !c.lastMessageOriginal) return false;
            return (
                c.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.participant.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.participant.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
            );
        })
        .sort((a, b) => {
            const aPin = pinnedIds.includes(a.id) ? 0 : 1;
            const bPin = pinnedIds.includes(b.id) ? 0 : 1;
            if (aPin !== bPin) return aPin - bPin;

            const aUnread = a.unreadCount > 0 ? 0 : 1;
            const bUnread = b.unreadCount > 0 ? 0 : 1;
            if (aUnread !== bUnread) return aUnread - bUnread;

            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

    return (
        <>
            <div className={cn('flex flex-col h-full overflow-hidden', className)}>

                {/* Header */}
                <div className="shrink-0 flex flex-col gap-3">
                    <div className="relative flex items-center justify-between py-1">
                        <div className="w-7" />
                        <h2 className="text-white text-sm sm:text-base font-semibold tracking-wide">Chats</h2>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowNewChat(true)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
                                title="New Chat"
                            >
                                <SquarePen className="w-4 h-4" />
                            </button>
                            {onClose && (
                                <button
                                    onClick={onClose}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="h-px w-full bg-white/8" />

                    {!isOnline && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                            <WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="text-red-400 text-xs">No internet connection</span>
                        </div>
                    )}

                    <div className="flex items-center gap-2 px-6 h-14 border border-white/15 rounded-full bg-white/3 focus-within:border-white/25 transition-colors">
                        <input
                            className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-gray-500 outline-none"
                            placeholder="Search Creator"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ fontSize: '16px' }}
                        />
                        <img src={SearchIcon} className="w-4 h-4 shrink-0 brightness-0 invert" alt="Search" />
                    </div>
                </div>

                {/* Conversation list */}
                <div className="chat-list-container relative flex-1 min-h-0 overflow-y-auto mt-3 [&::-webkit-scrollbar]:hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-5 h-5 animate-spin text-[#FF7700]" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-10 px-4 text-center">
                            <img src={chatGroup} alt="No chats" className="w-14 h-14 object-contain opacity-80" />
                            <div className="flex flex-col gap-1.5">
                                <p className="text-white font-bold text-base">No Chat History</p>
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    You haven't started any conversations yet. Find a creator to chat with!
                                </p>
                            </div>
                            <button
                                onClick={() => setShowNewChat(true)}
                                className="mt-1 px-6 py-2.5 rounded-full bg-[#FF7700] hover:bg-[#ff9922] text-black text-sm font-semibold transition-all active:scale-95"
                            >
                                Find Creator to Chat
                            </button>
                        </div>
                    ) : (
                        filtered.map(conv => (
                            <ChatListItem
                                key={conv.id}
                                conversation={conv}
                                isActive={activeConversationId === conv.id}
                                isPinned={pinnedIds.includes(conv.id)}
                                myId={myId}
                                translateEnabled={translateEnabled}
                                onClick={() => onSelect(conv)}
                                onDeleteRequest={c => setConfirmDelete(c)}
                                onPinToggle={c => handlePin(c)}
                            />
                        ))
                    )}
                </div>
            </div>

            {showNewChat && (
                <NewChatModal
                    onClose={() => setShowNewChat(false)}
                    onStartChat={handleStartChat}
                    isStarting={isStarting}
                />
            )}
            {confirmDelete && (
                <ConfirmDeleteModal
                    name={confirmDelete.participant.name}
                    onConfirm={() => handleDeleteConfirmed(confirmDelete)}
                    onCancel={() => setConfirmDelete(null)}
                    isDeleting={isDeleting}
                />
            )}
        </>
    );
};
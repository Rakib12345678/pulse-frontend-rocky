import React from 'react';
import { Loader2, WifiOff, SquarePen, X, UserCircle2, Pin, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStreamClient } from '../stream/streamClient';
import api from '@/lib/api';
import { useStartDirectChat, chatKeys } from '../hooks/useChat';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Conversation, MessageStatus } from '../types/chat.types';
import { useOnlineStatus } from '@/features/chat/hooks/useOnlineStatus';
import chatGroup from '@/assets/chatGroup.svg';
import SearchIcon from '@/assets/Search.svg';

// Fallback-safe avatar
const Avatar = ({
    src,
    alt = '',
    className = '',
}: {
    src?: string | null;
    alt?: string;
    className?: string;
}) => {
    const [broken, setBroken] = React.useState(false);
    if (!src || broken) {
        return (
            <div className={`rounded-full bg-white/10 flex items-center justify-center shrink-0 ${className}`}>
                <UserCircle2 className="w-[55%] h-[55%] text-gray-500" />
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={alt}
            className={`rounded-full object-cover shrink-0 ${className}`}
            onError={() => setBroken(true)}
        />
    );
};



// Capitalize first letter in a name 
const capitalizeName = (name: string): string =>
    name.replace(/\b\w/g, c => c.toUpperCase());

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

// Relative time
const formatRelativeTime = (iso: string): string => {
    const date  = new Date(iso);
    const now   = new Date();
    const diffS = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffS < 60)  return `${diffS}s ago`;
    const diffM = Math.floor(diffS / 60);
    if (diffM < 60)  return `${diffM}m ago`;
    const diffH = Math.floor(diffM / 60);
    if (diffH < 24)  return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Yesterday';
    if (diffD < 7)   return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const useRelativeTicker = () => {
    const [, setTick] = React.useState(0);
    React.useEffect(() => {
        const id = setInterval(() => setTick(n => n + 1), 30_000);
        return () => clearInterval(id);
    }, []);
};

// NewChatModal
interface StreamUser {
    id: string;
    name?: string;
    image?: string;
    fullName?: string;
}

interface NewChatModalProps {
    onClose: () => void;
    onStartChat: (user: StreamUser) => void;
    isStarting: boolean;
}

const NewChatModal = ({ onClose, onStartChat, isStarting }: NewChatModalProps) => {
    const [query, setQuery]       = React.useState('');
    const [results, setResults]   = React.useState<StreamUser[]>([]);
    const [searching, setSearch]  = React.useState(false);
    const debounceRef             = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close on backdrop click
    const backdropRef = React.useRef<HTMLDivElement>(null);
    const handleBackdrop = (e: React.MouseEvent) => {
        if (e.target === backdropRef.current) onClose();
    };

    React.useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) { setResults([]); return; }

        debounceRef.current = setTimeout(async () => {
            setSearch(true);
            try {
                const client = getStreamClient();
                const myId   = client.userID;
                const q      = query.trim();

                const resp = await client.queryUsers(
                    { name: { $autocomplete: q } },
                    { name: 1 },
                    { limit: 20 },
                );

                const mapped: StreamUser[] = resp.users
                    .filter(u => u.id !== myId)
                    .map(u => ({
                        id:       u.id,
                        name:     (u as any).fullName || u.name || u.id,
                        fullName: (u as any).fullName || '',
                        image:    (u as any).image || '',
                    } as StreamUser));

                setResults(mapped);
            } catch {
                setResults([]);
            } finally {
                setSearch(false);
            }
        }, 300);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    return (
            <div
                ref={backdropRef}
                onClick={handleBackdrop}
                className="fixed inset-0 z-400 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            >
                <div className="relative w-full max-w-125 bg-[#111213] rounded-2xl border border-white/10 shadow-2xl overflow-hidden px-8">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-red-900/30 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 px-6 pt-6 pb-5 flex flex-col gap-10">
                        {/* Title */}
                        <div className="flex items-center justify-center">
                            <h2 className="text-white font-semibold text-lg">New Chat</h2>
                        </div>

                        {/* Search bar */}
                        <div className="flex items-center gap-2 px-6 h-14 border border-white/15 rounded-full bg-white/3 focus-within:border-white/30 transition-colors">
                            <input
                                autoFocus
                                className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-gray-500"
                                placeholder="Search Creator Name Here..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                style={{ fontSize: '16px' }}
                            />
                            {searching
                                ? <Loader2 className="w-4 h-4 text-gray-500 shrink-0 animate-spin" />:
                                <img src={SearchIcon} className="w-4 h-4 shrink-0 brightness-0 invert" alt="Search" />
                            }
                        </div>

                    {/* Results */}
                    <div className="flex flex-col gap-1 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                        {results.length === 0 && query.trim() && !searching && (
                            <p className="text-center text-gray-500 text-sm py-6">No users found</p>
                        )}
                        {results.length === 0 && !query.trim() && (
                            <p className="text-center text-gray-500 text-sm py-6">Type a name to search</p>
                        )}
                        {results.map(user => {
                            const displayName = capitalizeName((user as any).fullName || user.name || user.id);
                            const avatar      = (user as any).image || '';
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => onStartChat(user)}
                                    disabled={isStarting}
                                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors text-left disabled:opacity-60"
                                >
                                    <Avatar
                                        src={avatar}
                                        alt={displayName}
                                        className="w-11 h-11"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-white text-sm font-semibold">{displayName}</span>
                                        <span className="text-[#FF7700] text-xs font-medium mt-0.5">Tap to Chat</span>
                                    </div>
                                    {isStarting && <Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-auto shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};


// Pinned conversations (local session state)
const PINNED_KEY = 'chat_pinned';
const getPinned  = (): string[] => { try { return JSON.parse(sessionStorage.getItem(PINNED_KEY) ?? '[]'); } catch { return []; } };
const setPinned  = (ids: string[]) => sessionStorage.setItem(PINNED_KEY, JSON.stringify(ids));

// Confirm Delete Modal
const ConfirmDeleteModal = ({
    name,
    onConfirm,
    onCancel,
    isDeleting,
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
                    Are you sure you want to delete your conversation with <span className="text-white font-medium">{name}</span>? This cannot be undone.
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

// Dropdown open when right click on chat
const ConversationDropdown = ({
    isPinned,
    onPin,
    onDelete,
    onClose,
}: {
    isPinned: boolean;
    onPin: () => void;
    onDelete: () => void;
    onClose: () => void;
}) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 80);
        return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
    }, [onClose]);
    return (
        <div
            ref={ref}
            className="absolute top-full left-2 mt-0.5 z-50 w-60 bg-[#1e2029] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        >
            <button
                onClick={(e) => { e.stopPropagation(); onPin(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-200 hover:bg-white/8 transition-colors"
            >
                <Pin className="w-4 h-4 shrink-0 text-gray-400" />
                {isPinned ? 'Unpin' : 'Pin'}
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/8"
            >
                <Trash2 className="w-4 h-4 shrink-0" />
                Delete
            </button>
        </div>
    );
};

// ChatListItem
const ChatListItem = ({
    conversation,
    isActive,
    isPinned,
    onClick,
    onDeleteRequest,
    onPinToggle,
}: {
    conversation:   Conversation;
    isActive:       boolean;
    isPinned:       boolean;
    onClick:        () => void;
    onDeleteRequest:(conv: Conversation) => void;
    onPinToggle:    (conv: Conversation) => void;
}) => {
    const isPending    = conversation.lastMessageStatus === 'pending';
    const [open, setOpen] = React.useState(false);

    return (
        <div
            className="relative"
            onDoubleClick={(e) => { e.preventDefault(); setOpen(v => !v); }}
            onContextMenu={(e) => { e.preventDefault(); setOpen(v => !v); }}
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
                    ) : isPending ? (
                        <TickIcon status="pending" />
                    ) : (
                        <span className="shrink-0 text-[10px] text-gray-500">
                            {formatRelativeTime(conversation.lastMessageTime)}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                    {conversation.lastMessageStatus && !isPending && conversation.unreadCount === 0 && (
                        <TickIcon status={conversation.lastMessageStatus} />
                    )}
                    <span className={cn(
                        'text-xs truncate',
                        isPending ? 'text-yellow-400/70' : 'text-gray-400',
                    )}>
                        {conversation.lastMessage}
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
    conversations:          Conversation[];
    isLoading:              boolean;
    activeConversationId:   string | null;
    onSelect:               (conversation: Conversation) => void;
    onClose?:               () => void;
    onConversationDeleted?: (conversationId: string) => void;
    className?:             string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    conversations,
    isLoading,
    activeConversationId,
    onSelect,
    onClose,
    onConversationDeleted,
    className,
}) => {
    const [searchQuery, setSearchQuery]           = React.useState('');
    const [showNewChat, setShowNewChat]           = React.useState(false);
    const [confirmDelete, setConfirmDelete]       = React.useState<Conversation | null>(null);
    const [isDeleting, setIsDeleting]             = React.useState(false);
    const [pinnedIds, setPinnedIds]               = React.useState<string[]>(() => getPinned());

    const isOnline = useOnlineStatus();
    useRelativeTicker();

    const queryClient = useQueryClient();
    const { mutate: startDirectChat, isPending: isStarting } = useStartDirectChat();

    const handlePin = (conv: Conversation) => {
        const alreadyPinned = pinnedIds.includes(conv.id);

        setPinnedIds(prev => {
            const next = alreadyPinned
                ? prev.filter(id => id !== conv.id)
                : [...prev, conv.id];
            setPinned(next);
            return next;
        });

        // toast
        toast.success(alreadyPinned ? 'Conversation unpinned' : 'Conversation pinned', {
            description: capitalizeName(conv.participant.name),
            classNames: { description: '!text-black' },
        });
    };

    const handleDeleteConfirmed = async (conv: Conversation) => {
        setIsDeleting(true);
        try {
            const client     = getStreamClient();
            const [type, id] = conv.id.split(':');
            const channel    = client.channel(type, id);
            await channel.delete();

            queryClient.setQueryData(chatKeys.conversations(), (old: Conversation[] | undefined) =>
                old ? old.filter(c => c.id !== conv.id) : old
            );
            onConversationDeleted?.(conv.id);
            setConfirmDelete(null);

            // Toast
            toast.success('Chat deleted', {
                description: `Chat with ${capitalizeName(conv.participant.name)} has been removed.`,
                classNames: { description: '!text-black' },
            });
        } catch (e) {
            console.error('Delete failed', e);

            // Toast
            toast.error('Failed to delete chat', {
                description: 'Something went wrong. Please try again.',
                classNames: { description: '!text-black' },
            });
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStartChat = (user: StreamUser) => {
        const targetId = parseInt(user.id, 10);
        if (isNaN(targetId)) return;

        const displayName = capitalizeName((user as any).fullName || user.name || user.id);
        const avatar      = (user as any).image || '';

        startDirectChat(
            { targetUserId: targetId, targetName: displayName, targetAvatar: avatar },
            {
                onSuccess: ({ conversation }) => {
                    setShowNewChat(false);
                    onSelect(conversation);
                },
            },
        );
    };

    const filtered = conversations
        .filter(c => !!c.lastMessage)
        .filter(c => c.participant.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            const aPin = pinnedIds.includes(a.id) ? 0 : 1;
            const bPin = pinnedIds.includes(b.id) ? 0 : 1;
            if (aPin !== bPin) return aPin - bPin;
            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
    });
    return (
        <>
            <div className={cn('flex flex-col h-full overflow-hidden', className)}>

                {/* ── Header ── */}
                <div className="shrink-0 flex flex-col gap-3">

                    <div className="relative flex items-center justify-between py-1">
                        <div className="w-7" />
                        <h2 className="text-white text-sm sm:text-base font-semibold tracking-wide">
                            Chats
                        </h2>

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

                {/* List */}
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
                                <p className="text-gray-500 text-xs leading-relaxed">You haven't started any conversations yet. Find a creator to chat with!</p>
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
                                onClick={() => onSelect(conv)}
                                onDeleteRequest={(c) => setConfirmDelete(c)}
                                onPinToggle={(c) => handlePin(c)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* New Chat Modal */}
            {showNewChat && (
                <NewChatModal
                    onClose={() => setShowNewChat(false)}
                    onStartChat={handleStartChat}
                    isStarting={isStarting}
                />
            )}

            {/* Confirm Delete Modal */}
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
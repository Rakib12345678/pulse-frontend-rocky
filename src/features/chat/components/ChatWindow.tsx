import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronDown, Loader2, Smile, Trash2, WifiOff, Languages, Copy, Forward, UserCircle2, Search, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMessages, useSendMessage, useMarkAsRead, useDeleteMessage, chatKeys } from '../hooks/useChat';
import { TickIcon } from './ChatSidebar';
import { getStreamClient } from '../stream/streamClient';
import type { Conversation, Message } from '../types/chat.types';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useOnlineStatus } from '@/features/chat/hooks/useOnlineStatus';

import chatGroup from '@/assets/chatGroup.svg';
import sendIcon from '@/assets/Send.svg';

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
            <div className={cn('rounded-full bg-white/10 flex items-center justify-center shrink-0', className)}>
                <UserCircle2 className="w-[55%] h-[55%] text-gray-500" />
            </div>
        );
    }
    return (
        <img
            src={src}
            alt={alt}
            className={cn('rounded-full object-cover shrink-0', className)}
            onError={() => setBroken(true)}
        />
    );
};


// Capitalize
const capitalizeName = (name: string): string =>
    name.replace(/\b\w/g, c => c.toUpperCase());

// Forward Modal
interface StreamUser { id: string; name?: string; image?: string; fullName?: string; }

const ForwardModal = ({
    message,
    onClose,
    onForwardSuccess,
    onForwardError,
}: {
    message: Message;
    onClose: () => void;
    onForwardSuccess: (name: string) => void;
    onForwardError: () => void;
}) => {
    const [query, setQuery]       = useState('');
    const [results, setResults]   = useState<StreamUser[]>([]);
    const [searching, setSearch]  = useState(false);
    const [sent, setSent]         = useState<string | null>(null);
    const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);
    const backdropRef             = useRef<HTMLDivElement>(null);

    // Search Stream by username (name field)
    useEffect(() => {
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
            } catch { setResults([]); }
            finally { setSearch(false); }
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [query]);

    const handleForwardTo = async (user: StreamUser) => {
        try {
            const client  = getStreamClient();
            const channel = client.channel('messaging', { members: [client.userID!, user.id] });
            await channel.create();
            await channel.sendMessage({ text: message.text });
            const name = user.name || user.id;
            setSent(name);
            setTimeout(() => {
                onForwardSuccess(name);
                onClose();
            }, 800);
        } catch {
            onForwardError();
            onClose();
        }
    };

    return (
        <div
            ref={backdropRef}
            onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
            className="fixed inset-0 z-600 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        >
            <div className="relative w-full max-w-115 bg-[#111213] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-900/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 px-10 pt-5 pb-4 flex flex-col gap-10">
                    {/* Header */}
                    <div className="flex items-center justify-center">
                        <h2 className="text-white font-semibold text-base">Forward Message</h2>
                    </div>
                    {/* Message preview */}
                    <div className="px-3 py-0">
                        <p className="text-white text-sm leading-relaxed line-clamp-2">{message.text}</p>
                    </div>
                    {/* Search */}
                    <div className="flex items-center gap-2 px-4 h-11 border border-white/15 rounded-full bg-white/3 focus-within:border-white/30 transition-colors">
                        <input
                            autoFocus
                            className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-gray-500"
                            placeholder="Search user..."
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            style={{ fontSize: '16px' }}
                        />
                        {searching
                            ? <Loader2 className="w-4 h-4 text-gray-500 shrink-0 animate-spin" />
                            : <Search className="w-4 h-4 text-gray-500 shrink-0" />
                        }
                    </div>
                    {/* Results */}
                    <div className="flex flex-col gap-0.5 max-h-70 overflow-y-auto [&::-webkit-scrollbar]:hidden">
                        {sent && (
                            <p className="text-center text-green-400 text-sm py-4">✓ Forwarded to {sent}</p>
                        )}
                        {!sent && results.length === 0 && query.trim() && !searching && (
                            <p className="text-center text-gray-500 text-sm py-4">No users found</p>
                        )}
                        {!sent && results.length === 0 && !query.trim() && (
                            <p className="text-center text-gray-500 text-sm py-4">Search to forward</p>
                        )}
                        {!sent && results.map(user => {
                            const displayName = capitalizeName((user as any).fullName || user.name || user.id);
                            const avatar      = (user as any).image || '';
                            return (
                                <button
                                    key={user.id}
                                    onClick={() => handleForwardTo(user)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left"
                                >
                                    <Avatar src={avatar} alt={displayName} className="w-10 h-10" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white text-sm font-semibold truncate">{displayName}</span>
                                        <span className="text-[#FF7700] text-xs mt-0.5">Tap to forward</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

const formatMsgTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const safeDate = (iso: string): Date => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? new Date() : d;
};

const getDateLabel = (iso: string): string => {
    const date = safeDate(iso), now = new Date();
    const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const d = Math.round((today.getTime() - msgDay.getTime()) / 86_400_000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 7)  return date.toLocaleDateString([], { weekday: 'long' });
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const getDayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

const formatLastSeen = (iso: string): string => {
    const date = new Date(iso), now = new Date();
    const s = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (s < 60)  return 'last seen just now';
    const m = Math.floor(s / 60);
    if (m < 60)  return `last seen ${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `last seen ${h}h ago`;
    const dd = Math.floor(h / 24);
    if (dd === 1) return 'last seen yesterday';
    return `last seen ${date.toLocaleDateString([], { day: '2-digit', month: 'short' })}`;
};

const useDraftPerConversation = (conversationId: string | null) => {
    const drafts = useRef<Record<string, string>>({});
    const getDraft = React.useCallback(() => !conversationId ? '' : (drafts.current[conversationId] ?? ''), [conversationId]);
    const setDraft = React.useCallback((v: string) => { if (conversationId) drafts.current[conversationId] = v; }, [conversationId]);
    const [, rerender] = useState(0);
    useEffect(() => { rerender(n => n + 1); }, [conversationId]);
    return { getDraft, setDraft };
};

const DateSeparator = ({ label }: { label: string }) => (
    <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-[11px] text-gray-500 font-medium px-2 shrink-0">{label}</span>
        <div className="flex-1 h-px bg-white/8" />
    </div>
);

interface DropdownProps {
    isMe: boolean; onDelete?: () => void; onCopy: () => void; onForward: () => void; onClose: () => void;
    positionLeft?: boolean;
}

const MessageDropdown = ({ isMe, onDelete, onCopy, onForward, onClose, positionLeft }: DropdownProps) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const t = setTimeout(() => {
            const handler = (e: MouseEvent) => {
                if (ref.current && !ref.current.contains(e.target as Node)) onClose();
            };
            document.addEventListener('mousedown', handler);
        }, 50);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div ref={ref} className={cn(
            'absolute top-8 z-50 min-w-40 bg-[#1e2029] border border-white/10 rounded-xl shadow-2xl overflow-hidden',
            positionLeft ? 'left-0' : 'right-0',
        )}>
            <button onClick={() => { onForward(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-200 hover:bg-white/8 transition-colors">
                <Forward className="w-4 h-4 shrink-0" /> Forward
            </button>
            <button onClick={() => { onCopy(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-200 hover:bg-white/8 transition-colors border-t border-white/8">
                <Copy className="w-4 h-4 shrink-0" /> Copy
            </button>
            {isMe && onDelete && (
                <button onClick={() => { onDelete(); onClose(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/8">
                    <Trash2 className="w-4 h-4 shrink-0" /> Delete
                </button>
            )}
        </div>
    );
};

interface BubbleProps {
    message: Message; isMe: boolean;
    participantName: string;
    participantAvatar: string; myAvatar?: string;
    onDelete: (msg: Message) => void;
    onCopy: (msg: Message) => void;
    onForward: (msg: Message) => void;
}

const MessageBubble = ({ message, isMe, participantName, participantAvatar, myAvatar, onDelete, onCopy, onForward }: BubbleProps) => {
    const [hovered, setHovered]       = useState(false);
    const [dropdownOpen, setDropdown] = useState(false);
    const longPressTimer              = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isPending                   = message.status === 'pending';

    const handleTouchStart = (e: React.TouchEvent) => {
        longPressTimer.current = setTimeout(() => { e.preventDefault(); setDropdown(true); }, 500);
    };
    const cancelLongPress = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

    if (isMe) {
        return (
            <div
                className="flex items-start justify-end gap-2.5 ml-auto"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onTouchStart={handleTouchStart}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
            >
                <div className="relative">
                    <div className={cn(
                        'max-w-[35vw] px-4 py-3 pr-8 sm:px-5 sm:py-3.5 sm:pr-9 rounded-2xl rounded-tr-sm break-words',
                        'bg-[#2a2c35] text-white',
                        isPending && 'opacity-50',
                    )}>
                        <p className="text-[13px] sm:text-sm leading-[1.6]">{message.text}</p>
                        <div className="flex items-center gap-1 mt-1.5 justify-end">
                            <span className="text-[10px] text-gray-500">{formatMsgTime(message.time)}</span>
                            <TickIcon status={message.status} />
                        </div>
                    </div>
                    <button
                        onClick={() => setDropdown(v => !v)}
                        className={cn(
                            'absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150',
                            'bg-black/30 hover:bg-black/50 text-gray-300 hover:text-white',
                            (hovered || dropdownOpen) ? 'opacity-100' : 'opacity-0 pointer-events-none',
                        )}
                    >
                        <ChevronDown className="w-3 h-3" />
                    </button>
                    {dropdownOpen && (
                        <MessageDropdown isMe positionLeft={false}
                            onDelete={() => onDelete(message)}
                            onCopy={() => onCopy(message)}
                            onForward={() => onForward(message)}
                            onClose={() => setDropdown(false)} />
                    )}
                </div>
                <Avatar src={myAvatar} alt="me" className="w-8 h-8 sm:w-9 sm:h-9 mt-0.5" />
            </div>
        );
    }

    return (
        <div
            className="flex items-start gap-2.5 mr-auto"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={cancelLongPress}
            onTouchMove={cancelLongPress}
        >
            <Avatar src={participantAvatar} alt={participantName} className="w-8 h-8 sm:w-9 sm:h-9 mt-0.5" />
            <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[12px] font-semibold text-gray-300 leading-none">{capitalizeName(participantName)}</span>
                <div className="relative">
                    <div className={cn(
                        'max-w-[35vw] px-4 py-3 pr-8 sm:px-5 sm:py-3.5 sm:pr-9 rounded-2xl rounded-tl-sm break-words',
                        'bg-[#1a1c23] text-white',
                        isPending && 'opacity-50',
                    )}>
                        <p className="text-[13px] sm:text-sm leading-[1.6]">{message.text}</p>
                        <div className="flex items-center gap-1 mt-1.5 justify-end">
                            <span className="text-[10px] text-gray-500">{formatMsgTime(message.time)}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => setDropdown(v => !v)}
                        className={cn(
                            'absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150',
                            'bg-black/30 hover:bg-black/50 text-gray-300 hover:text-white',
                            (hovered || dropdownOpen) ? 'opacity-100' : 'opacity-0 pointer-events-none',
                        )}
                    >
                        <ChevronDown className="w-3 h-3" />
                    </button>
                    {dropdownOpen && (
                        <MessageDropdown isMe={false} positionLeft
                            onCopy={() => onCopy(message)}
                            onForward={() => onForward(message)}
                            onClose={() => setDropdown(false)} />
                    )}
                </div>
            </div>
        </div>
    );
};

export const ChatEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-6">
        <img src={chatGroup} alt="Chat Group" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
        <div className="max-w-sm">
            <p className="text-white font-bold text-lg sm:text-xl leading-snug">Please select a chat to start messaging</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-2 leading-relaxed">Choose from your existing conversations on the left to start a conversation.</p>
        </div>
    </div>
);

const EmptyConversation = ({ participant }: { participant: Conversation['participant'] }) => (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
        <Avatar src={participant.avatar} alt={participant.name} className="w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-white/10" />
        <div>
            <p className="text-white font-semibold text-sm sm:text-base">{capitalizeName(participant.name)}</p>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">Send a message to get the conversation started!</p>
        </div>
    </div>
);

const EmojiPickerPopup = ({ onSelect, onClose }: { onSelect: (e: string) => void; onClose: () => void }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [onClose]);
    return (
        <div ref={ref} className="absolute bottom-17 sm:bottom-18 right-3 sm:right-4 z-50">
            <Picker data={data} onEmojiSelect={(emoji: { native: string }) => { onSelect(emoji.native); onClose(); }}
                theme="dark" set="native" previewPosition="none" skinTonePosition="none" maxFrequentRows={1} perLine={8} />
        </div>
    );
};

interface ChatWindowProps {
    conversation: Conversation | null;
    isLoadingConversation?: boolean;
    onBack: () => void;
    mobileFullscreen?: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    conversation,
    isLoadingConversation = false,
    onBack,
    mobileFullscreen = false,
}) => {
    const { user }    = useAuthStore();
    const isOnline    = useOnlineStatus();

    const { getDraft, setDraft } = useDraftPerConversation(conversation?.id ?? null);
    const [draftValue, setDraftValue]       = useState('');
    const [translatedMsgs, setTranslated]   = useState<Record<string, string>>({});
    const [forwardMsg, setForwardMsg]        = useState<Message | null>(null);

    useEffect(() => { setDraftValue(getDraft()); }, [conversation?.id]);
    const handleDraftChange = (val: string) => { setDraftValue(val); setDraft(val); };

    const [showEmoji, setShowEmoji] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef       = useRef<HTMLInputElement>(null);

    const { data: messagesData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(conversation?.id ?? null);
    const messages: Message[] = messagesData?.pages?.flatMap(p => p.messages) ?? [];

    const { mutate: sendMessage,  isPending: isSending } = useSendMessage();
    const { mutate: markAsRead }                          = useMarkAsRead();
    const { mutate: deleteMessage }                       = useDeleteMessage();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    useEffect(() => {
        if (conversation?.id && (conversation.unreadCount ?? 0) > 0) {
            markAsRead(conversation.id);
        }
    }, [conversation?.id, conversation?.unreadCount]);

    const handleSend = () => {
        const text = draftValue.trim();
        if (!text || !conversation || isSending || !isOnline) return;

        setDraftValue('');
        setDraft('');
        inputRef.current?.focus();

        sendMessage(
            {
                conversationId: conversation.id,
                targetUserId:   Number(conversation.participant.id),
                text,
            },
            {
                onError: () => {
                    setDraftValue(text);
                    setDraft(text);
                    toast.error('Failed to send message');
                },
            },
        );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleDelete = (message: Message) => {
        if (!conversation) return;
        deleteMessage({ messageId: message.id, conversationId: conversation.id });
    };

    const handleCopy = (message: Message) => {
        navigator.clipboard.writeText(message.text)
            .then(() => toast.success('Message copied'))
            .catch(() => toast.error('Failed to copy'));
    };

    const handleForward = (message: Message) => {
        setForwardMsg(message);
    };

    if (!conversation) {
        if (isLoadingConversation)
            return (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FF7700]" />
                </div>
            );
        return (
            <div className="flex-1 flex flex-col overflow-hidden">
                <ChatEmptyState />
            </div>
        );
    }

    const canSend = draftValue.trim().length > 0 && !isSending && isOnline;

    return (
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative sm:pr-6 lg:pr-10">
            {/* Header */}
            <div className="shrink-0 flex items-center gap-2.5 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4">
                <button onClick={onBack} className="text-white mr-0.5 p-1 rounded-lg hover:bg-white/5 transition-colors md:hidden">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="relative shrink-0">
                    <Avatar
                        src={conversation.participant.avatar}
                        alt={conversation.participant.name}
                        className="w-10 h-10 sm:w-11 sm:h-11"
                    />
                    {conversation.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-400 ring-2 ring-[#0d0d0d]" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{capitalizeName(conversation.participant.name)}</p>
                    <p className={cn('text-[11px]', conversation.isOnline ? 'text-green-400' : 'text-gray-500')}>
                        {conversation.isOnline
                            ? 'Online'
                            : conversation.lastActive
                                ? formatLastSeen(conversation.lastActive)
                                : 'Offline'}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-none px-3 sm:px-6 py-4 sm:py-5 flex flex-col gap-3 sm:gap-4 [&::-webkit-scrollbar]:hidden bg-transparent">
                {hasNextPage && (
                    <div className="flex justify-center">
                        <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1 rounded-full border border-white/10">
                            {isFetchingNextPage ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load older messages'}
                        </button>
                    </div>
                )}

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <EmptyConversation participant={conversation.participant} />
                ) : (() => {
                    const items: React.ReactNode[] = [];
                    let lastDayKey = '';
                    messages.forEach(msg => {
                        const dayKey = getDayKey(msg.time);
                        if (dayKey !== lastDayKey) {
                            items.push(<DateSeparator key={`sep-${dayKey}`} label={getDateLabel(msg.time)} />);
                            lastDayKey = dayKey;
                        }
                        const isMe = msg.senderId === String(user?.id);
                        const displayMsg = translatedMsgs[msg.id] ? { ...msg, text: translatedMsgs[msg.id] } : msg;
                        items.push(
                            <div key={msg.id} className="flex flex-col gap-0.5">
                                <MessageBubble
                                    message={displayMsg}
                                    isMe={isMe}
                                    participantName={conversation.participant.name}
                                    participantAvatar={conversation.participant.avatar}
                                    myAvatar={user?.profileImage}
                                    onDelete={handleDelete}
                                    onCopy={handleCopy}
                                    onForward={handleForward}
                                />
                            </div>
                        );
                    });
                    return items;
                })()}
                <div ref={messagesEndRef} />
            </div>

            {showEmoji && (
                <EmojiPickerPopup
                    onSelect={emoji => handleDraftChange(draftValue + emoji)}
                    onClose={() => setShowEmoji(false)}
                />
            )}

            {/* No internet banner */}
            {!isOnline && (
                <div className="shrink-0 flex items-center justify-center gap-2 bg-red-600 px-4 py-2.5">
                    <WifiOff className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="text-white text-xs font-semibold tracking-wide">No Internet Connection, Please check your internet Connection</span>
                </div>
            )}

            {/* Input bar */}
            <div className={cn(
                'shrink-0 px-3 sm:px-4 py-4 sm:py-5 flex items-center gap-2 sm:gap-3 md:mb-15',
                mobileFullscreen && 'pb-7 md:pb-5',
            )}>
                <div className={cn(
                    'flex-1 sm:max-w-[85%] flex items-center gap-2 px-3 sm:px-4 h-11 sm:h-12 g-[#111213] border rounded-full transition-colors',
                    !isOnline
                        ? 'border-yellow-500/30 focus-within:border-yellow-500/50'
                        : 'border-white/15 focus-within:border-white/30',
                )}>
                    <input
                        ref={inputRef}
                        value={draftValue}
                        onChange={e => handleDraftChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isOnline ? 'Type Message Here...' : 'No connection...'}
                        className="flex-1 border-none text-sm text-white focus:outline-none placeholder:text-gray-500 outline-none"
                        style={{ fontSize: '16px' }}
                        disabled={isSending}
                    />
                    <button
                        onClick={() => setShowEmoji(v => !v)}
                        className={cn('transition-colors shrink-0', showEmoji ? 'text-[#FF7700]' : 'text-gray-500 hover:text-[#FF7700]')}
                    >
                        <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Mobile send: circular icon button */}
                <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className={cn(
                        'sm:hidden w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95',
                        canSend
                            ? 'bg-[#FF7700] shadow-lg shadow-orange-500/30'
                            : 'bg-[#111213] cursor-not-allowed opacity-50',
                    )}
                >
                    {isSending
                        ? <Loader2 className="w-5 h-5 animate-spin text-white" />
                        : !isOnline
                            ? <WifiOff className="w-5 h-5 text-white" />
                            : <img src={sendIcon} alt="Send" className="w-5 h-5" />
                    }
                </button>

                {/* Desktop send */}
                <button
                    onClick={handleSend}
                    disabled={!canSend}
                    className={cn(
                        'hidden sm:flex h-12 w-[15%] px-10 rounded-full text-sm font-semibold transition-all items-center justify-center gap-2 shrink-0',
                        canSend
                            ? 'bg-[#FF7700] text-black hover:bg-[#ff9922] active:scale-95'
                            : 'bg-[#111213] text-gray-500 cursor-not-allowed',
                    )}
                >
                    {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : !isOnline ? <WifiOff className="w-3.5 h-3.5" /> : null}
                    Send
                </button>
            </div>

            {/* Forward Modal */}
            {forwardMsg && (
                <ForwardModal
                    message={forwardMsg}
                    onClose={() => setForwardMsg(null)}
                    onForwardSuccess={(name) => toast.success(`Forwarded to ${name}`)}
                    onForwardError={() => toast.error('Failed to forward message')}
                />
            )}
        </div>
    );
};
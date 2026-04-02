import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Loader2, Smile, WifiOff, Gift, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslationPreference } from '../hooks/useTranslationPreference';
import type { Conversation, Message } from '../types/chat.types';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Switch } from '@/components/ui/switch';
import { Avatar } from '@/features/chat/components/Avatar';
import { capitalizeName, formatLastSeen, getDayKey, getDateLabel } from '@/features/chat/utils/ChatUtils';
import { useGoLive } from '@/features/profile/hooks/useGoLive';

// Standalone components
import { ChangeLanguageModal } from './ChangeLanguageModal';
import { DateSeparator } from './DateSeparator';
import { GiftCarousel } from './GiftCarousel';
import { EmojiPickerPopup } from './EmojiPickerPopup';
import { MessageBubble } from './MessageBubble';
import { ChatEmptyState } from './ChatEmptyState';
import { EmptyConversation } from './EmptyConversation';

import sendIcon from '@/assets/Send.svg';
import LiveIcon from '@/assets/Live.svg';

const MAX_MSG_LENGTH = 4_000;

// draft per conversation (kept as it is state-binding logic for the input)
const useDraftPerConversation = (conversationId: string | null) => {
    const drafts = useRef<Record<string, string>>({});
    const [, rerender] = useState(0);

    const getDraft = React.useCallback(
        () => (!conversationId ? '' : (drafts.current[conversationId] ?? '')),
        [conversationId],
    );
    const setDraft = React.useCallback(
        (v: string) => { if (conversationId) drafts.current[conversationId] = v; },
        [conversationId],
    );

    useEffect(() => { rerender(n => n + 1); }, [conversationId]);

    return { getDraft, setDraft };
};


// ChatWindow
interface ChatWindowProps {
    conversation: Conversation | null;
    isLoadingConversation?: boolean;
    onBack: () => void;
    mobileFullscreen?: boolean;
    messages: Message[];
    msgLoading: boolean;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    onSend: (text: string) => Promise<void>;
    onSendImage: (file: File) => Promise<void>;
    onDelete: (messageId: string) => Promise<void>;
    onReact: (messageId: string, type: string, extra?: any) => Promise<void>;
    onDeleteReaction: (messageId: string, type: string) => Promise<void>;
    onMarkAsRead: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
    conversation, isLoadingConversation = false, onBack, mobileFullscreen = false,
    messages, msgLoading, hasMore, loadMore, onSend, onSendImage, onDelete, onReact, onDeleteReaction, onMarkAsRead,
}) => {
    const { user } = useAuthStore();
    const myId = String(user?.id ?? '');
    const isInternetConnected = useOnlineStatus();
    const handleGoLiveClick = useGoLive();

    const { getDraft, setDraft } = useDraftPerConversation(conversation?.id ?? null);
    const [draftValue, setDraftValue] = useState('');
    const [showLangModal, setShowLangModal] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showGifts, setShowGifts] = useState(false);
    const [pendingImage, setPendingImage] = useState<{ file: File; url: string } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [msgToDelete, setMsgToDelete] = useState<Message | null>(null);
    const { translateEnabled, setTranslate } = useTranslationPreference(myId);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const giftRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const atBottomRef = useRef(true);
    const firstScrollDone = useRef<string | null>(null);
    const scrollTimeouts = useRef<NodeJS.Timeout[]>([]);

    useEffect(() => { setDraftValue(getDraft()); }, [conversation?.id, getDraft]);

    useEffect(() => {
        if (!conversation?.id) return;
        const t = setTimeout(() => inputRef.current?.focus(), 100);
        return () => clearTimeout(t);
    }, [conversation?.id]);

    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const handleImageLoad = () => {
        // If an image loads and we were at the bottom (or it's our first scroll), push us back down
        if (atBottomRef.current || firstScrollDone.current !== conversation?.id) {
            scrollToBottom('auto');
        }
    };

    useEffect(() => {
        // Clear old timeouts
        scrollTimeouts.current.forEach(clearTimeout);
        scrollTimeouts.current = [];

        if (!msgLoading && conversation?.id) {
            // Sequence of scrolls to handle layout shifts as everything renders
            const delays = [50, 150, 300, 600];
            delays.forEach(ms => {
                const t = setTimeout(() => {
                    scrollToBottom('auto');
                    if (ms >= 150) firstScrollDone.current = conversation.id;
                }, ms);
                scrollTimeouts.current.push(t);
            });
        }
    }, [msgLoading, conversation?.id]);

    useEffect(() => {
        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            scrollTimeouts.current.forEach(clearTimeout);
        };
    }, []);

    useEffect(() => {
        if (atBottomRef.current) {
            scrollToBottom('smooth');
        }
    }, [messages.length]);
    
    // Close gift carousel when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (giftRef.current && !giftRef.current.contains(e.target as Node)) {
                setShowGifts(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // IntersectionObserver updates atBottomRef without a scroll listener.
    useEffect(() => {
        const sentinel = messagesEndRef.current;
        if (!sentinel) return;
        const observer = new IntersectionObserver(
            ([entry]) => { atBottomRef.current = entry.isIntersecting; },
            { threshold: 0.1 },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [conversation?.id]);

    useEffect(() => {
        if (conversation && atBottomRef.current) {
            onMarkAsRead();
        }
    }, [conversation?.id]);

    useEffect(() => {
        const handleGlobalClick = () => setContextMenu(null);
        const handleGlobalScroll = () => setContextMenu(null);
        window.addEventListener('click', handleGlobalClick);
        window.addEventListener('scroll', handleGlobalScroll, true);
        return () => {
            window.removeEventListener('click', handleGlobalClick);
            window.removeEventListener('scroll', handleGlobalScroll, true);
        };
    }, []);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY });
    };

    const handleDraftChange = (val: string) => { setDraftValue(val); setDraft(val); };

    const handleSend = async () => {
        const text = draftValue.trim();
        if ((!text && !pendingImage) || !conversation || !isInternetConnected) return;
        if (text.length > MAX_MSG_LENGTH) {
            toast.error(`Message too long — maximum ${MAX_MSG_LENGTH.toLocaleString()} characters`);
            return;
        }

        const currentPendingImage = pendingImage;
        const currentText = text;

        setDraftValue('');
        setDraft('');
        setPendingImage(null);
        inputRef.current?.focus();

        try {
            if (currentPendingImage) {
                await onSendImage(currentPendingImage.file);
            }
            if (currentText) {
                await onSend(currentText);
            }
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } catch {
            setDraftValue(currentText);
            setDraft(currentText);
            if (currentPendingImage) setPendingImage(currentPendingImage);
            toast.error('Failed to send message');
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleCopy = (message: Message) => {
        const isMyMessage = message.senderId === myId;
        let textToCopy: string;
        if (isMyMessage) {
            // Always copy what I actually typed
            textToCopy = message.originalText ?? message.text;
        } else {
            // Copy whichever version is currently visible based on toggle
            textToCopy = translateEnabled
                ? (message.text || message.originalText)
                : (message.originalText || message.text);
        }
        navigator.clipboard
            .writeText(textToCopy)
            .then(() => toast.success('Message copied'))
            .catch(() => toast.error('Failed to copy'));
    };

    const handleToggleTranslate = () => setTranslate(v => !v);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so the same file can be selected again if needed
        e.target.value = '';

        if (!isInternetConnected || !conversation) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        setPendingImage({ file, url: URL.createObjectURL(file) });
        inputRef.current?.focus();
    };

    const visibleMessages = messages.filter(m => !!m.text?.trim() || (m.attachments && m.attachments.length > 0));

    if (!conversation) {
        if (isLoadingConversation) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FF7700]" />
                </div>
            );
        }
        return <div className="flex-1 flex flex-col overflow-hidden"><ChatEmptyState /></div>;
    }

    const canSend = (draftValue.trim().length > 0 && draftValue.trim().length <= MAX_MSG_LENGTH && isInternetConnected) || (!!pendingImage && isInternetConnected);

    return (
        <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative">

            {/* Header */}
            <div className="shrink-0 w-full relative z-10 flex items-center gap-2.5 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 bg-[#111213] border-b border-white/8">
                <button
                    onClick={onBack}
                    className="text-white mr-0.5 p-1 rounded-lg hover:bg-white/5 transition-colors md:hidden cursor-pointer"
                >
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
                    <p className="text-white font-semibold text-sm truncate">
                        {capitalizeName(conversation.participant.name)}
                    </p>
                    <p className={cn('text-[11px]', conversation.isOnline ? 'text-green-400' : 'text-gray-500')}>
                            {conversation.isOnline
                                ? 'Online'
                                : conversation.lastActive
                                    ? formatLastSeen(conversation.lastActive)
                                    : 'Offline'}
                        </p>
                </div>

                {/* Translate toggle */}
                <div className="flex flex-col items-center gap-1.5 shrink-0 mr-4">
                    <div className="flex items-center gap-3 px-3 sm:px-4 py-2 rounded-lg bg-white/8 border border-white/10">
                        <span className="hidden sm:block text-[13px] text-gray-300 font-medium select-none whitespace-nowrap">
                            Translate Chat
                        </span>
                        <Switch
                            checked={translateEnabled}
                            onCheckedChange={handleToggleTranslate}
                            aria-label="Toggle translate chat"
                            className="data-[state=checked]:bg-[#FF7700] data-[state=unchecked]:bg-white/20 cursor-pointer"
                        />
                    </div>
                    {translateEnabled && (
                        <button
                            onClick={() => setShowLangModal(true)}
                            className="text-[12px] text-[#4A9EFF] hover:text-[#7ab8ff] underline underline-offset-2 transition-colors font-medium leading-none cursor-pointer"
                        >
                            Change Language
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div
                className="flex-1 min-h-0 overflow-y-auto overscroll-none px-2 sm:px-4 lg:px-8 pt-4 pb-10 sm:pt-5 flex flex-col [&::-webkit-scrollbar]:hidden bg-transparent relative"
                onContextMenu={handleContextMenu}
            >
                <div className="flex flex-col gap-3 sm:gap-4 mx-auto w-full">

                    {hasMore && (
                        <div className="flex justify-center">
                            <button
                                onClick={loadMore}
                                className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-1 rounded-full border border-white/10 cursor-pointer"
                            >
                                Load older messages
                            </button>
                        </div>
                    )}

                    {msgLoading ? (
                        <div className="flex-1 flex items-center justify-center py-20">
                            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                        </div>
                    ) : visibleMessages.length === 0 ? (
                        <EmptyConversation participant={conversation.participant} />
                    ) : (() => {
                        const items: React.ReactNode[] = [];
                        let lastDayKey = '';
                        visibleMessages.forEach(msg => {
                            const dayKey = getDayKey(msg.time);
                            if (dayKey !== lastDayKey) {
                                items.push(
                                    <DateSeparator key={`sep-${dayKey}`} label={getDateLabel(msg.time)} />,
                                );
                                lastDayKey = dayKey;
                            }
                            items.push(
                                <div key={msg.id} className="flex flex-col gap-0.5">
                                    <MessageBubble
                                        message={msg}
                                        isMe={msg.senderId === myId}
                                        translateEnabled={translateEnabled}
                                        participantName={conversation.participant.name}
                                        participantAvatar={conversation.participant.avatar}
                                        myAvatar={user?.profileImage}
                                        onDelete={msg => setMsgToDelete(msg)}
                                        onReact={onReact}
                                        onDeleteReaction={onDeleteReaction}
                                        onCopy={handleCopy}
                                        onImageLoad={handleImageLoad}
                                    />
                                </div>,
                            );
                        });
                        return items;
                    })()}

                    <div ref={messagesEndRef} />
                </div>

            </div>


            {showGifts && !draftValue.trim() && (
                <div ref={giftRef}>
                    <GiftCarousel
                        onSelectGift={gift => {
                            const giftTag = `[GIFT:${gift.id}:${gift.iconUrl}:${gift.name}:${gift.noOfCoin}]`;
                            setShowGifts(false);
                            onSend(giftTag);
                        }}
                    />
                </div>
            )}

            {!isInternetConnected && (
                <div className="shrink-0 flex items-center justify-center gap-2 bg-red-600 px-4 py-2.5">
                    <WifiOff className="w-3.5 h-3.5 text-white shrink-0" />
                    <span className="text-white text-xs font-semibold tracking-wide">No Internet Connection, Please check your internet Connection</span>
                </div>
            )}

            {/* Floating Go Live Icon */}
            <div
                onClick={handleGoLiveClick}
                className="md:hidden absolute bottom-32 right-2 sm:right-4 z-30 cursor-pointer"
            >
                <img
                    src={LiveIcon}
                    alt="Go Live"
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-[0_0_30px_rgba(255,119,0,0.4)] transition-transform active:scale-95"
                />
            </div>

            {/* Image Preview Area */}
            {pendingImage && (
                <div className="shrink-0 px-4 sm:px-8 py-2 bg-transparent">
                    <div className="relative inline-block group">
                        <img
                            src={pendingImage.url}
                            alt="preview"
                            className="max-h-32 rounded-xl border-2 border-[#FF7700] object-contain bg-black/40 shadow-xl"
                        />
                        <button
                            onClick={() => setPendingImage(null)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}


            <div className={cn(
                'shrink-0 px-2 sm:px-4 lg:px-8 py-4 flex items-center border-t border-white/5 md:mb-15',
                mobileFullscreen && 'pb-7 md:pb-5',
            )}>
                    <div className="w-full flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 relative">
                        {showEmoji && (
                            <div className="absolute bottom-full right-0 mb-4 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <EmojiPickerPopup
                                    onSelect={emoji => handleDraftChange(draftValue + emoji.native)}
                                    onClose={() => setShowEmoji(false)}
                                    className="shadow-2xl border border-white/10 rounded-2xl scale-90 sm:scale-100 origin-bottom-right"
                                />
                            </div>
                        )}
                    <div className={cn(
                        'flex-[4] flex items-center gap-2 px-3 sm:px-4 h-11 sm:h-12 bg-[#111213] border rounded-full transition-colors',
                        !isInternetConnected
                            ? 'border-yellow-500/30 focus-within:border-yellow-500/50'
                            : 'border-white/15 focus-within:border-white/30',
                    )}>
                        <input
                            ref={inputRef}
                            value={draftValue}
                            onChange={e => handleDraftChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isInternetConnected ? 'Type Message Here...' : 'No connection...'}
                            className="flex-1 min-w-0 border-none text-sm text-white focus:outline-none placeholder:text-gray-500 outline-none bg-transparent"
                            style={{ fontSize: '16px' }}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="transition-colors shrink-0 text-gray-500 hover:text-[#FF7700] cursor-pointer"
                            title="Attach Image"
                        >
                            <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowEmoji(v => !v);
                            }}
                            className={cn(
                                'transition-colors shrink-0 cursor-pointer',
                                showEmoji ? 'text-[#FF7700]' : 'text-gray-500 hover:text-[#FF7700]',
                            )}
                        >
                            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>

                    {/* Mobile buttons */}
                    <div className="sm:hidden flex items-center gap-2">
                        <button
                            onClick={handleSend}
                            disabled={!canSend}
                            className={cn(
                                'w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer',
                                canSend ? 'bg-[#FF7700] shadow-lg shadow-orange-500/30' : 'bg-[#111213] cursor-not-allowed opacity-50',
                            )}
                        >
                            {!isInternetConnected
                                ? <WifiOff className="w-5 h-5 text-white" />
                                : <img src={sendIcon} alt="Send" className="w-5 h-5" />
                            }
                        </button>
                        {!draftValue.trim() && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowGifts(v => !v);
                                }}
                                className={cn(
                                    'w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 bg-[#111213] border border-white/10 cursor-pointer',
                                    showGifts ? 'text-[#FF7700] border-[#FF7700]/30' : 'text-gray-400',
                                )}
                            >
                                <Gift className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Desktop buttons */}
                    <div className="hidden sm:flex items-center gap-3 shrink-0">
                        <button
                            onClick={handleSend}
                            disabled={!canSend}
                            className={cn(
                                'h-11 sm:h-12 w-20 sm:w-28 lg:w-36 rounded-full text-sm font-bold transition-all flex items-center justify-center gap-2 shrink cursor-pointer',
                                canSend
                                    ? 'bg-[#FF7700] text-white hover:bg-[#ff8800] active:scale-95 shadow-lg shadow-orange-500/20'
                                    : 'bg-[#111213] text-gray-500 cursor-not-allowed',
                            )}
                        >
                            {!isInternetConnected ? <WifiOff className="w-3.5 h-3.5" /> : null}
                            Send
                        </button>

                        {!draftValue.trim() && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowGifts(v => !v);
                                }}
                                className={cn(
                                    'w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all active:scale-95 bg-[#111213] border shrink-0 cursor-pointer',
                                    showGifts ? 'text-[#FF7700] border-[#FF7700]/30' : 'text-gray-400 hover:text-white border-white/10',
                                )}
                                title="Send Gift"
                            >
                                <Gift className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    </div>
            </div>

            {showLangModal && (
                <ChangeLanguageModal
                    onClose={() => setShowLangModal(false)}
                    onSuccess={() => toast.success('Language updated successfully')}
                />
            )}

            {msgToDelete && (
                <div 
                    onClick={() => setMsgToDelete(null)}
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-300 cursor-default"
                >
                    <div 
                        onClick={e => e.stopPropagation()}
                        className="relative w-full max-w-[400px] rounded-[32px] shadow-2xl overflow-hidden p-10 flex flex-col items-center text-center backdrop-blur-[354px]"
                        style={{ 
                            background: 'linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), rgba(18, 18, 18, 0.9)' 
                        }}
                    >
                        <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Delete Message?</h3>
                        <p className="text-gray-400 text-sm mb-10 leading-relaxed max-w-[240px]">
                            Are you sure you want to delete this message?
                        </p>
                        
                        <div className="flex items-center gap-4 w-full justify-center">
                            <button
                                onClick={async () => {
                                    const id = msgToDelete.id;
                                    setMsgToDelete(null);
                                    try {
                                        await onDelete(id);
                                        toast.success('Message deleted');
                                    } catch {
                                        toast.error('Failed to delete message');
                                    }
                                }}
                                className="flex-1 h-14 rounded-full bg-[#FF7700] text-black font-extrabold text-base hover:opacity-90 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                            >
                                Delete
                            </button>
                            <button
                                onClick={() => setMsgToDelete(null)}
                                className="flex-1 h-14 rounded-full border-2 border-[#FF7700] text-[#FF7700] font-extrabold text-base hover:bg-[#FF7700]/5 transition-all active:scale-95 cursor-pointer bg-transparent"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-[9999] bg-[#1a1c23] border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[160px] backdrop-blur-md animate-in fade-in zoom-in duration-100"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                >
                    <button
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            onBack();
                            setContextMenu(null);
                        }}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors text-left font-medium active:scale-95 duration-75 cursor-pointer"
                    >
                        Close Chat
                    </button>
                    <div className="mx-2 my-1 border-t border-white/5" />
                    <button
                        onClick={() => setContextMenu(null)}
                        className="w-full flex items-center px-4 py-2.5 text-sm text-gray-400 hover:bg-white/5 transition-colors text-left active:scale-95 duration-75 cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Loader2, Smile, WifiOff, Gift, X, ChevronDown, ChevronUp, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useTranslationPreference } from '../hooks/useTranslationPreference';
import type { Conversation, Message } from '../types/chat.types';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Avatar } from '@/features/chat/components/Avatar';
import { capitalizeName, formatLastSeen, getDayKey, getDateLabel } from '@/features/chat/utils/ChatUtils';
import { useGoLive } from '@/features/profile/hooks/useGoLive';
import { useCoinsStore } from '@/features/coins/hooks/useCoinsStore';

// Standalone components
import { ChangeLanguageModal } from './ChangeLanguageModal';
import { DateSeparator } from './DateSeparator';
import { GiftCarousel } from './GiftCarousel';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { EmojiPickerPopup } from './EmojiPickerPopup';
import { MessageBubble } from './MessageBubble';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChatEmptyState } from './ChatEmptyState';
import { EmptyConversation } from './EmptyConversation';
import { TranslateDrawer } from './TranslateDrawer';
import { TranslateTogglePopover } from './TranslateTogglePopover';
import { useSubmitReport } from '@/features/report/services/report.service';
import { userService } from '@/features/live/services/user.service';
import { mediaService } from '@/features/auth/services/media.service';
import { ReportChatModal, ReportLimitModal, ReportSuccessModal, ReportFailureModal } from '@/components/internal/ReasonModal';

import sendIcon from '@/assets/Send.svg';
import LiveIcon from '@/assets/Live.svg';

const MAX_MSG_LENGTH = 4_000;

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
    draftValue: string;
    onDraftChange: (v: string) => void;
    blockedUserIds?: string[];
}


export const ChatWindow: React.FC<ChatWindowProps> = ({
    conversation, isLoadingConversation = false, onBack, mobileFullscreen = false,
    messages, msgLoading, hasMore, loadMore, onSend, onSendImage, onDelete, onReact, onDeleteReaction, onMarkAsRead,
    draftValue, onDraftChange, blockedUserIds = [],
}) => {
    const navigate = useNavigate();
    const { user, wallet } = useAuthStore();
    const { openModal: openCoinsModal } = useCoinsStore();
    const isMobile = useIsMobile();
    const myId = String(user?.id ?? '');
    const isInternetConnected = useOnlineStatus();
    // Derive block state for the active conversation participant
    const isParticipantBlocked = conversation ? blockedUserIds.includes(conversation.participant.id) : false;
    const handleGoLiveClick = useGoLive();
    const [showLangModal, setShowLangModal] = useState(false);
    const [showTranslateDrawer, setShowTranslateDrawer] = useState(false);
    const [showTranslateMenu, setShowTranslateMenu] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showGifts, setShowGifts] = useState(false);
    const [pendingImage, setPendingImage] = useState<{ file: File; url: string } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
    const [msgToDelete, setMsgToDelete] = useState<Message | null>(null);
    const [msgToReport, setMsgToReport] = useState<Message | null>(null);
    const [reportedSuccessInfo, setReportedSuccessInfo] = useState<{ id: string; name: string } | null>(null);
    const [failedReportData, setFailedReportData] = useState<Message | null>(null);
    const [showReportLimitModal, setShowReportLimitModal] = useState(false);
    const [isUploadingFiles, setIsUploadingFiles] = useState(false);
    const { translateEnabled, setTranslate } = useTranslationPreference(myId);
    const { mutate: submitReport, isPending: isReportPending } = useSubmitReport();
    const { openModal: openLoginModal, setMode, setStep } = useSignUpStore();

    const handleReportMessage = (msg: Message) => {
        if (!user) {
            setMode('login');
            setStep('input');
            openLoginModal();
            return;
        }
        setMsgToReport(msg);
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const giftRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const atBottomRef = useRef(true);
    const firstScrollDone = useRef<string | null>(null);
    const scrollTimeouts = useRef<NodeJS.Timeout[]>([]);



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
                    if (ms >= 150) {
                        firstScrollDone.current = conversation.id;
                        onMarkAsRead(); // Mark as read once initial scroll/load is done
                    }
                }, ms);
                scrollTimeouts.current.push(t);
            });
        }
    }, [msgLoading, conversation?.id, onMarkAsRead]);

    useEffect(() => {
        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            scrollTimeouts.current.forEach(clearTimeout);
        };
    }, []);

    useEffect(() => {
        if (atBottomRef.current) {
            scrollToBottom('smooth');
            onMarkAsRead(); // Mark incoming messages as read if we are at the bottom
        }
    }, [messages.length, onMarkAsRead]);

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

    const handleProfileClick = () => {
        const identifier = conversation?.participant.username;
        if (identifier) {
            navigate({
                to: '/profile/$username',
                params: { username: identifier.toString() }
            });
        }
    };

    const handleDraftChange = (val: string) => {
        onDraftChange(val);
    };

    const handleSend = async () => {
        const text = draftValue.trim();
        if ((!text && !pendingImage) || !conversation || !isInternetConnected) return;
        if (text.length > MAX_MSG_LENGTH) {
            toast.error(`Message too long — maximum ${MAX_MSG_LENGTH.toLocaleString()} characters`);
            return;
        }

        const currentPendingImage = pendingImage;
        const currentText = text;

        onDraftChange('');
        setPendingImage(null);
        setShowEmoji(false);
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
            onDraftChange(currentText);
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
        if (message.attachments && message.attachments.length > 0 && message.attachments[0].imageUrl) {
            textToCopy = message.attachments[0].imageUrl;
        } else {
            const rawText = isMyMessage
                ? (message.originalText ?? message.text ?? '')
                : (translateEnabled ? (message.text || message.originalText || '') : (message.originalText || message.text || ''));

            const isImageTag = /^[\[\(\【]\s*IMAGE:/i.test(rawText.trim());
            const urlMatch = rawText.match(/(https?:\/\/[^\s\n\r\]\)\】]+)/i);

            if (isImageTag && urlMatch) {
                textToCopy = urlMatch[1];
            } else {
                textToCopy = rawText;
            }
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

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf('image') !== -1) {
                const file = item.getAsFile();
                if (file) {
                    e.preventDefault();
                    if (!isInternetConnected || !conversation) return;
                    if (file.size > 5 * 1024 * 1024) {
                        toast.error('Image size must be less than 5MB');
                        return;
                    }
                    setPendingImage({ file, url: URL.createObjectURL(file) });
                    return;
                }
            }
        }
    };

    const visibleMessages = messages.filter(m => {
        // Hide messages from a blocked participant (only show our own messages)
        if (isParticipantBlocked && m.senderId !== myId) return false;
        return !!m.text?.trim() || (m.attachments && m.attachments.length > 0);
    });

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
                {/* Participant Info Section */}
                <div
                    onClick={handleProfileClick}
                    className={cn(
                        "flex-1 flex items-center gap-2.5 sm:gap-3 min-w-0 group",
                        conversation.participant.username && "cursor-pointer"
                    )}
                >
                    <div className="relative shrink-0">
                        <Avatar
                            src={isParticipantBlocked ? '' : conversation.participant.avatar}
                            alt={conversation.participant.name}
                            className={cn(
                                "w-10 h-10 sm:w-11 sm:h-11 transition-transform duration-200",
                                conversation.participant.username && "group-hover:scale-105"
                            )}
                        />
                        {conversation.isOnline && !isParticipantBlocked && (
                            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-400 ring-2 ring-[#0d0d0d]" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={cn(
                            "text-white font-bold text-[15px] truncate transition-colors",
                            conversation.participant.username && "group-hover:text-[#FF7700]"
                        )}>
                            {capitalizeName(conversation.participant.name)}
                        </p>
                        {!isParticipantBlocked && (
                            <p className={cn('text-[11px] font-medium', conversation.isOnline ? 'text-green-400' : 'text-gray-500')}>
                                {conversation.isOnline
                                    ? 'Online'
                                    : conversation.lastActive
                                        ? formatLastSeen(conversation.lastActive)
                                        : 'Offline'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Translate toggle (Desktop) */}
                {user?.preferredLanguage && (
                    <div className="hidden md:flex flex-col items-center gap-1.5 shrink-0 mr-4">
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
                )}

                {/* Translate Toggle (Mobile / Tablet Overlay) */}
                <div className="relative shrink-0 mr-2 md:hidden">
                    <Popover open={showTranslateMenu} onOpenChange={setShowTranslateMenu}>
                        <PopoverTrigger asChild>
                            <button
                                className={cn(
                                    "w-9 h-9 flex items-center justify-center rounded-full transition-all cursor-pointer relative",
                                    translateEnabled && user?.preferredLanguage
                                        ? "border border-[#FF7700] text-white"
                                        : "bg-white/5 text-gray-400"
                                )}
                            >
                                {showTranslateMenu ? (
                                    <ChevronUp className="w-5 h-5" />
                                ) : (
                                    <ChevronDown className="w-5 h-5" />
                                )}

                                {/* The "dot" from user's description - active status indicator */}
                                {translateEnabled && user?.preferredLanguage && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#0d0d0d]" />
                                )}
                            </button>
                        </PopoverTrigger>

                        {user?.preferredLanguage && translateEnabled ? (
                            <TranslateTogglePopover
                                enabled={translateEnabled}
                                onToggle={(val) => {
                                    setTranslate(val);
                                    if (!val) setShowTranslateMenu(false);
                                }}
                                onChangeLanguage={() => {
                                    setShowTranslateMenu(false);
                                    setShowTranslateDrawer(true);
                                }}
                            />
                        ) : (
                            <PopoverContent
                                align="end"
                                sideOffset={12}
                                className="w-auto p-0 bg-transparent border-none shadow-none z-10000"
                            >
                                <button
                                    onClick={() => {
                                        setShowTranslateMenu(false);
                                        setShowTranslateDrawer(true);
                                    }}
                                    className="bg-[#FF7700] text-black font-bold px-5 py-2.5 rounded-full whitespace-nowrap shadow-xl active:scale-95 transition-all text-sm cursor-pointer"
                                >
                                    Translate Chat
                                </button>
                            </PopoverContent>
                        )}
                    </Popover>
                </div>
            </div>

            <div
                className="flex-1 min-h-0 overflow-y-auto overscroll-none px-2 sm:px-4 lg:px-8 pt-4 pb-10 sm:pt-5 flex flex-col [&::-webkit-scrollbar]:hidden bg-transparent relative"
                onContextMenu={handleContextMenu}
            >
                <div className={cn(
                    "flex flex-col gap-3 sm:gap-4 mx-auto w-full",
                    visibleMessages.length === 0 && !msgLoading && "flex-1"
                )}>

                    {hasMore && messages.length > 0 && (
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
                            // Cap message status at 'sent' (single tick) when the participant is blocked
                            const displayMsg = isParticipantBlocked && msg.status && msg.status !== 'pending'
                                ? { ...msg, status: 'sent' as const }
                                : msg;
                            items.push(
                                <div key={msg.id} className="flex flex-col gap-0.5">
                                    <MessageBubble
                                        message={displayMsg}
                                        isMe={msg.senderId === myId}
                                        translateEnabled={translateEnabled}
                                        participantName={conversation.participant.name}
                                        participantAvatar={isParticipantBlocked ? '' : conversation.participant.avatar}
                                        myAvatar={user?.profileImage}
                                        onDelete={msg => setMsgToDelete(msg)}
                                        onReact={onReact}
                                        onDeleteReaction={onDeleteReaction}
                                        onCopy={handleCopy}
                                        onReport={msg => handleReportMessage(msg)}
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
                        coinBalance={wallet?.coinBalance ?? 0}
                        onSelectGift={gift => {
                            if ((wallet?.coinBalance ?? 0) < gift.noOfCoin) {
                                toast.error('Insufficient balance');
                                setShowGifts(false);
                                openCoinsModal();
                                return;
                            }
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
                className="md:hidden absolute bottom-32 right-2 sm:right-4 z-10001 cursor-pointer"
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
                'shrink-0 border-t border-white/5 md:mb-5 flex flex-col',
                mobileFullscreen && 'pb-7 md:pb-5',
            )}>
                <div className="px-2 sm:px-4 lg:px-8 py-4 w-full h-full">
                    <div className="w-full flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 relative">
                        {showEmoji && (
                            isMobile ? (
                                <Drawer open={showEmoji} onOpenChange={setShowEmoji}>
                                    <DrawerContent className="bg-[#111213] border-none px-4 pb-6 max-h-[85vh] rounded-t-[32px] flex flex-col gap-4">
                                        <div className="mx-auto mt-2 h-1 w-12 shrink-0 rounded-full bg-white/20" />

                                        {/* Input field inside the drawer for mobile */}
                                        <div
                                            className="flex items-center gap-2 w-full shrink-0"
                                            onMouseDown={e => e.stopPropagation()}
                                            onPointerDown={e => e.stopPropagation()}
                                        >
                                            <div className="flex-1 flex items-center gap-2 px-3 h-11 bg-[#1e2029] border border-white/10 rounded-full min-w-0">
                                                <input
                                                    value={draftValue}
                                                    onChange={e => handleDraftChange(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    onPaste={handlePaste}
                                                    placeholder="Type Message Here..."
                                                    className="flex-1 min-w-0 border-none text-sm text-white focus:outline-none placeholder:text-gray-500 outline-none bg-transparent"
                                                    style={{ fontSize: '16px' }}
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => setShowEmoji(false)}
                                                    className="text-[#FF7700] p-1 cursor-pointer shrink-0"
                                                >
                                                    <Smile className="w-5 h-5" />
                                                </button>
                                            </div>
                                            {draftValue.trim() && (
                                                <button
                                                    onPointerDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleSend();
                                                    }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                    }}
                                                    disabled={!canSend}
                                                    className="w-11 h-11 rounded-full bg-[#FF7700] flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <img src={sendIcon} alt="Send" className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex-1 overflow-y-auto min-h-0">
                                            <EmojiPickerPopup
                                                isMobile={isMobile}
                                                onSelect={emoji => handleDraftChange(draftValue + emoji.native)}
                                                onClose={() => setShowEmoji(false)}
                                                closeOnSelect={false}
                                                className="w-full bg-transparent shadow-none"
                                            />
                                        </div>
                                    </DrawerContent>
                                </Drawer>
                            ) : (
                                <div className={cn(
                                    "absolute bottom-full z-100 animate-in fade-in slide-in-from-bottom-2 duration-200 right-0 mb-4 lg:mr-8 sm:mr-4"
                                )}>
                                    <EmojiPickerPopup
                                        isMobile={isMobile}
                                        onSelect={emoji => handleDraftChange(draftValue + emoji.native)}
                                        onClose={() => setShowEmoji(false)}
                                        closeOnSelect={false}
                                        className="shadow-2xl border border-white/10 rounded-2xl scale-90 sm:scale-100 origin-bottom-right"
                                    />
                                </div>
                            )
                        )}
                        <div className={cn(
                            'flex-4 flex items-center gap-2 px-3 sm:px-4 h-11 sm:h-12 bg-[#111213] border rounded-full transition-colors',
                            !isInternetConnected
                                ? 'border-yellow-500/30 focus-within:border-yellow-500/50'
                                : 'border-white/15 focus-within:border-white/30',
                        )}>
                            <input
                                ref={inputRef}
                                value={draftValue}
                                onChange={e => handleDraftChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onPaste={handlePaste}
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
                                id="emoji-trigger"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEmoji(v => !v);
                                }}
                                className={cn(
                                    'transition-colors shrink-0 cursor-pointer p-1',
                                    showEmoji ? 'text-[#FF7700]' : 'text-gray-500 hover:text-[#FF7700]',
                                )}
                            >
                                <Smile className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Mobile buttons */}
                        {isMobile && (
                            <div className="flex items-center gap-2">
                                {(draftValue.trim() || pendingImage) ? (
                                    <button
                                        onClick={handleSend}
                                        disabled={!canSend}
                                        className={cn(
                                            'w-13 h-13 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer shadow-xl',
                                            canSend ? 'bg-[#FF7700] shadow-orange-500/30' : 'bg-[#1a1a1a] cursor-not-allowed opacity-50',
                                        )}
                                    >
                                        {!isInternetConnected
                                            ? <WifiOff className="w-6 h-6 text-white" />
                                            : <img src={sendIcon} alt="Send" className="w-6 h-6" />
                                        }
                                    </button>
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowGifts(v => !v);
                                        }}
                                        className={cn(
                                            'w-13 h-13 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer shadow-xl border border-white/5',
                                            showGifts ? 'bg-[#FF7700] text-black border-[#FF7700]/30' : 'bg-[#FF7700] text-black',
                                        )}
                                    >
                                        <Gift className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImageSelect}
                        />

                        {/* Desktop buttons */}
                        {!isMobile && (
                            <div className="flex items-center gap-3 shrink-0">
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
                        )}
                    </div>
                </div>

                {/* Mobile Emoji Picker previously rendered here and caused overflow issues */}
            </div>

            {showLangModal && (
                <ChangeLanguageModal
                    onClose={() => setShowLangModal(false)}
                    onSuccess={() => toast.success('Language updated successfully')}
                />
            )}

            {isMobile && (
                <TranslateDrawer
                    open={showTranslateDrawer}
                    onOpenChange={setShowTranslateDrawer}
                    onSuccess={() => {
                        toast.success('Translation language updated');
                        setTranslate(true);
                    }}
                />
            )}

            {msgToDelete && (
                <div
                    onClick={() => setMsgToDelete(null)}
                    className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-300 cursor-default"
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

            {/* Report Chat Message Modal */}
            <ReportChatModal
                isOpen={!!msgToReport}
                username={msgToReport ? conversation.participant.name : undefined}
                isLoading={isReportPending || isUploadingFiles}
                onCancel={() => setMsgToReport(null)}
                onConfirm={async (reasonId, otherText, reportedUserId, files) => {
                    if (!msgToReport) return;

                    let imageUrls: string[] = [];
                    if (files && files.length > 0) {
                        try {
                            setIsUploadingFiles(true);
                            imageUrls = await mediaService.uploadBatchFiles('IMAGE', files);
                        } catch (err) {
                            console.error('[ChatWindow] Failed to upload files:', err);
                            toast.error('Failed to upload images. Proceeding with report.');
                        } finally {
                            setIsUploadingFiles(false);
                        }
                    }

                    submitReport(
                        {
                            reportedUserId: reportedUserId || msgToReport.senderId,
                            contentType: 'CHAT_MESSAGE',
                            contentId: msgToReport.id,
                            reason: reasonId,
                            note: otherText,
                            imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
                            contextMetadata: {
                                last_messages: messages
                                    .slice(-20)
                                    .map(m => ({
                                        sender: m.senderId,
                                        text: m.text || m.originalText || '',
                                        sent_at: m.time,
                                    })),
                            },
                        },
                        {
                            onSuccess: () => {
                                setReportedSuccessInfo({
                                    id: conversation.participant.id,
                                    name: conversation.participant.name
                                });
                                setMsgToReport(null);
                            },
                            onError: (error: any) => {
                                if (error?.response?.status === 429) {
                                    setMsgToReport(null);
                                    setShowReportLimitModal(true);
                                } else {
                                    setFailedReportData(msgToReport);
                                    setMsgToReport(null);
                                }
                            },
                        }
                    );
                }}
            />

            <ReportLimitModal
                isOpen={showReportLimitModal}
                onTryLater={() => setShowReportLimitModal(false)}
                onExplore={() => {
                    setShowReportLimitModal(false);
                }}
            />

            <ReportSuccessModal
                isOpen={!!reportedSuccessInfo}
                username={reportedSuccessInfo?.name || ''}
                type="chat"
                onMute={() => {
                    toast.info('Mute feature coming soon');
                }}
                onBlock={async () => {
                    if (reportedSuccessInfo) {
                        try {
                            await userService.blockUser(Number(reportedSuccessInfo.id));
                            toast.success(`Blocked @${reportedSuccessInfo.name}`);
                        } catch (error) {
                            toast.error('Failed to block user');
                        }
                    }
                }}
                onClose={() => setReportedSuccessInfo(null)}
            />

            <ReportFailureModal
                isOpen={!!failedReportData}
                onTryAgain={() => {
                    if (failedReportData) {
                        setMsgToReport(failedReportData);
                        setFailedReportData(null);
                    }
                }}
                onCancel={() => setFailedReportData(null)}
            />

            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed z-[10001] bg-[#1a1c23] border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[160px] backdrop-blur-md animate-in fade-in zoom-in duration-100"
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
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Gift, Smile, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { MessageDropdown } from './MessageDropdown';
import { EmojiPickerPopup } from './EmojiPickerPopup';
import { TickIcon } from './ChatSidebar';
import { capitalizeName, formatMsgTime } from '../utils/ChatUtils';
import type { Message } from '../types/chat.types';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { getRecentEmojis, saveRecentEmoji, type QuickReaction, getSafeEmojiId } from '../utils/EmojiUtils';

export const isOnlyImage = (text: string, attachments?: any[]) => {
    const hasAttachments = !!(attachments && attachments.length > 0);
    if (!text) return hasAttachments;
    const trimmed = text.trim();


    // Detect any bracketed tag containing a URL (language agnostic, handles various brackets)
    const tagRegex = /[\[\(\【][\s\S]*?https?:\/\/[\s\S]*?[\]\)\】]/gi;
    const hasTag = tagRegex.test(trimmed);
    const cleanText = trimmed.replace(tagRegex, '').trim();


    // If it has a tag and no other text, it's an only-image message.
    // Also if it's just a raw URL without brackets (sometimes happens in translation)
    const rawUrlRegex = /^https?:\/\/[^\s]+$/i;
    const isRawUrl = rawUrlRegex.test(trimmed);

    return (hasTag && !cleanText) || isRawUrl || (!trimmed && hasAttachments);
};

/**
 * Checks if a string is a gift tag.
 */
export const isGift = (text: string) => {
    if (!text) return false;
    const trimmed = text.trim();
    // Structure: [Prefix : Name : Coins] or [GIFT:URL:Name:Coins]
    const tagRegex = /[\[\(\【][\s\S]*?(GIFT|gift)[\s\S]*?[\]\)\】]/gi;
    const hasTag = tagRegex.test(trimmed);
    const cleanText = trimmed.replace(tagRegex, '').trim();
    return hasTag && !cleanText;
};





/**
 * Renders the message content, splitting by tags and extracting URLs/gifts structurally.
 */
const renderMessageContent = (msg: Message, text: string, isMe: boolean, onImageLoad?: () => void) => {
    if (!text && !msg.isGiftMessage) return null;

    const giftMatch5 = text ? text.match(/[\[\(\【][^:\[\]]*?:(\d+):(https?:\/\/[^:]+):([^:]+):(\d+)[\]\)\】]/i) : null;
    const giftMatch4 = text ? text.match(/[\[\(\【][^:\[\]]*?:(https?:\/\/[^:]+):([^:]+):(\d+)[\]\)\】]/i) : null;
    const giftMatch3 = text ? text.match(/[\[\(\【][^\[\]]*?:([^:]+):(\d+)[\]\)\】]/i) : null;
    const trimmedText = (text || '').trim();
    const startsWithBracket = trimmedText.startsWith('[') || trimmedText.startsWith('(') || trimmedText.startsWith('\u3010');

    if (msg.isGiftMessage || (startsWithBracket && (giftMatch5 || giftMatch4 || giftMatch3))) {
        const iconUrl = msg.giftIconUrl || (giftMatch5 ? giftMatch5[2] : (giftMatch4 ? giftMatch4[1] : null));
        const name = msg.giftName || (giftMatch5 ? giftMatch5[3] : (giftMatch4 ? giftMatch4[2] : (giftMatch3 ? giftMatch3[1] : 'Gift')));
        const coins = msg.giftCost || (giftMatch5 ? giftMatch5[4] : (giftMatch4 ? giftMatch4[3] : (giftMatch3 ? giftMatch3[2] : '0')));
        return (
            <div className="flex flex-col items-center gap-3 py-2 px-1">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-400/20 to-red-500/20 flex items-center justify-center relative group overflow-hidden">
                    <div className="absolute inset-0 bg-orange-500/10 blur-xl group-hover:bg-orange-500/20 transition-colors" />
                    {iconUrl ? (
                        <img src={iconUrl} alt={name.trim()} className="w-16 h-16 object-contain relative z-10 animate-[bounce_2s_infinite] drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                    ) : (
                        <Gift className="w-12 h-12 text-[#FF7700] relative z-10" />
                    )}
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                    <span className="text-[13px] font-bold text-white uppercase tracking-wider">{name.trim() || 'Gift'}</span>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                        <span className="text-[11px] font-black text-yellow-500">{coins} Coins</span>
                    </div>
                </div>
                <button className="w-full h-8 rounded-lg bg-[#FF7700]/10 hover:bg-[#FF7700]/20 text-[#FF7700] text-[11px] font-bold transition-colors mt-1 border border-[#FF7700]/20">
                    {isMe ? 'Gift Sent' : 'Gift Received'}
                </button>
            </div>
        );
    }

    // 2. Handle Images / URLs within brackets or raw URLs
    const tagRegex = /([\[\(\【][\s\S]*?https?:\/\/[\s\S]*?[\]\)\】])/gi;
    const parts = text.split(tagRegex);


    return parts.map((part, index) => {
        const trimmedPart = part.trim();
        const isBracketedTag = (trimmedPart.startsWith('[') || trimmedPart.startsWith('(') || trimmedPart.startsWith('【')) &&
            (trimmedPart.endsWith(']') || trimmedPart.endsWith(')') || trimmedPart.endsWith('】')) &&
            trimmedPart.includes('http');
        
        const rawUrlRegex = /^(https?:\/\/[^\s\n\r\]\)\】]+)$/i;
        const isRawUrl = rawUrlRegex.test(trimmedPart);

        if (isBracketedTag || isRawUrl) {
            const urlMatch = trimmedPart.match(/(https?:\/\/[^\s\n\r\]\)\】]+)/i);
            if (urlMatch) {
                const url = urlMatch[1];
                return (
                    <div key={index} className="my-2">
                        <img
                            src={url}
                            alt="chat attachment"
                            onLoad={onImageLoad}
                            className="max-w-full sm:max-w-[300px] max-h-[400px] object-contain rounded-lg bg-black/20 shadow-sm border border-white/5"
                        />
                    </div>
                );
            }
        }
        return part ? <span key={index}>{part}</span> : null;
    });
};

interface MessageBubbleProps {
    message: Message;
    isMe: boolean;
    translateEnabled: boolean;
    participantName: string;
    participantAvatar: string;
    myAvatar?: string;
    onDelete: (msg: Message) => void;
    onReact: (messageId: string, type: string, extra?: any) => Promise<void>;
    onDeleteReaction?: (messageId: string, type: string) => Promise<void>;
    onCopy: (msg: Message) => void;
    onReport?: (msg: Message) => void;
    onImageLoad?: () => void;
}

export const MessageBubble = ({
    message, isMe, translateEnabled, participantName, participantAvatar, myAvatar,
    onDelete, onReact, onDeleteReaction, onCopy, onReport, onImageLoad,
}: MessageBubbleProps) => {

    // Decide which text to use as the base for rendering
    // Priority: 1. Me -> Original, 2. Normal Translated -> Translated, 3. Special -> pickSpecialContent (prioritizes original)
    const receivedText = isMe
        ? (message.originalText || message.text || '')
        : translateEnabled
            ? (message.text || message.originalText || '')
            : (message.originalText || message.text || '');

    const [hovered, setHovered] = useState(false);
    const [dropdownOpen, setDropdown] = useState(false);
    const [quickReactionOpen, setQuickReactionOpen] = useState(false);
    const [fullPickerOpen, setFullPickerOpen] = useState(false);
    const [showReactionModal, setShowReactionModal] = useState(false);
    const [removingReaction, setRemovingReaction] = useState<string | null>(null);
    const [quickReactions, setQuickReactions] = useState<QuickReaction[]>(getRecentEmojis());
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);
    const isPending = message.status === 'pending';
    const myId = String(useAuthStore.getState().user?.id ?? '');

    const handleTouchStart = (e: React.TouchEvent) => {
        // Option 2: Don't show menu for others' gifts
        const isGiftMsg = !isMe && (message.isGiftMessage || isGift(receivedText));
        if (isGiftMsg) return;

        timer.current = setTimeout(() => { e.preventDefault(); setDropdown(true); }, 500);
    };
    const cancelLongPress = () => {
        if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    };
    useEffect(() => {
        const handleUpdate = (e: any) => {
            if (e.detail) setQuickReactions(e.detail);
        };
        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setQuickReactionOpen(false);
            }
        };
        window.addEventListener('recent_emojis_updated', handleUpdate);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            window.removeEventListener('recent_emojis_updated', handleUpdate);
            document.removeEventListener('mousedown', handleClickOutside);
            if (timer.current) clearTimeout(timer.current);
        };
    }, []);

    const isSystemEvent =
        message.originalText?.trim() === 'has joined the live' ||
        message.text?.trim() === 'has joined the live';

    // Helper to toggle reaction
    const handleReaction = async (emoji: any) => {
        setQuickReactionOpen(false);
        setFullPickerOpen(false);


        // Save to recent list
        saveRecentEmoji(emoji);

        const type = typeof emoji === 'string'
            ? (quickReactions.find(r => r.emoji === emoji)?.id || emoji)
            : emoji.id;
        const native = typeof emoji === 'string' ? emoji : emoji.native;

        const hasReacted = message.reactions?.own.some(r => r.type === type);
        if (hasReacted && onDeleteReaction) {
            await onDeleteReaction(message.id, type);
        } else if (onReact) {
            await onReact(message.id, type, { emoji: native });
        }
    };

    const renderReactions = (isImage: boolean) => {
        if (!message.reactions || !message.reactions.counts) return null;
        const keys = Object.keys(message.reactions.counts);
        if (keys.length === 0) return null;

        const totalCount = Object.values(message.reactions.counts).reduce((a, b) => a + b, 0);
        const uniqueEmojis = keys.map(type => {
            const reactionData = message.reactions!.latest.find(r => r.type === type);
            return reactionData?.emoji || quickReactions.find(r => r.id === type)?.emoji || type;
        });

        const filteredEmojis = Array.from(new Set(uniqueEmojis.filter(Boolean)));

        return (
            <div
                className={cn(
                    "absolute z-[10001] cursor-pointer active:scale-95 transition-transform left-3",
                    isImage ? '-bottom-1' : '-bottom-2.5'
                )}
                onClick={(e) => { e.stopPropagation(); setShowReactionModal(true); }}
            >
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black border border-white/20 text-white shadow-xl backdrop-blur-md">
                    <div className="flex -space-x-1">
                        {filteredEmojis.slice(0, 3).map((emoji, i) => (
                            <span key={i} className="relative z-[5] text-[12px]">{emoji}</span>
                        ))}
                    </div>
                    <span className="text-[11px] font-bold opacity-90">{totalCount}</span>
                </div>
            </div>
        );
    };

    const renderReactionModal = (side: 'left' | 'right') => (
        showReactionModal && (
            <div className={cn(
                "absolute bottom-0 z-[10001] animate-in slide-in-from-bottom-1 duration-200",
                side === 'left' ? 'left-full ml-3' : 'right-full mr-3'
            )}>
                <div className="fixed inset-0 -z-10" onClick={() => setShowReactionModal(false)} />
                <div
                    className="w-[280px] bg-[#1a1c23] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-3"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex flex-col gap-2">
                        {message.reactions?.latest.map((r, i) => {
                            if (!r.user) return null;
                            const isMyReaction = String(r.user_id) === myId;
                            const isRemoving = removingReaction === r.type && isMyReaction;
                            const handleRemove = async (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (isMyReaction && onDeleteReaction && !removingReaction) {
                                    setRemovingReaction(r.type);
                                    try {
                                        await onDeleteReaction(message.id, r.type);
                                        setShowReactionModal(false);
                                    } finally {
                                        setRemovingReaction(null);
                                    }
                                }
                            };

                            const emoji = r.emoji || quickReactions.find(qr => qr.id === r.type)?.emoji || r.type;

                            return (
                                <div
                                    key={i}
                                    onClick={isMyReaction ? handleRemove : undefined}
                                    className={cn(
                                        "flex items-center justify-between gap-3 p-2 rounded-xl transition-all group/item",
                                        isMyReaction ? "cursor-pointer hover:bg-[#FF7700]/10 border border-transparent hover:border-[#FF7700]/20" : "hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar src={r.user.avatar} alt={r.user.name} className="w-8 h-8 shrink-0 border border-white/5" />
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[13px] font-semibold text-white truncate">
                                                {isMyReaction ? 'You' : capitalizeName(r.user.name)}
                                            </span>
                                            {isMyReaction && (
                                                <span className="text-[10px] text-gray-500 group-hover/item:text-[#FF7700] transition-colors">
                                                    {isRemoving ? 'Removing...' : 'Click to Remove'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {isRemoving ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-[#FF7700] shrink-0" />
                                    ) : (
                                        <span className="text-lg shrink-0">{emoji}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )
    );

    const renderReactionPicker = (alignment: 'left' | 'right') => (
        <div className={cn("relative flex items-center z-40", alignment === 'right' ? 'mr-1' : 'ml-1')}>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setQuickReactionOpen(v => !v);
                }}
                className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center bg-black/20 hover:bg-black/50 text-gray-400 hover:text-white transition-all shadow-sm cursor-pointer",
                    (hovered || quickReactionOpen || fullPickerOpen) ? 'opacity-100' : 'opacity-0'
                )}
            >
                <Smile className="w-4 h-4" />
            </button>

            {quickReactionOpen && !fullPickerOpen && (
                <div
                    ref={pickerRef}
                    className={cn(
                        "absolute bottom-0 flex items-center gap-1.5 bg-[#25272e] border border-white/10 rounded-full px-3 py-1.5 shadow-2xl z-[10001] animate-in duration-200",
                        alignment === 'left' ? 'left-full ml-3' : 'right-full mr-3'
                    )}>
                    {quickReactions.map(r => (
                        <button
                            key={r.id}
                            onClick={(e2) => { e2.stopPropagation(); handleReaction(r.emoji); }}
                            className="text-lg sm:text-xl hover:scale-125 transition-transform active:scale-95 px-0.5 cursor-pointer"
                        >
                            {r.emoji}
                        </button>
                    ))}
                    <button
                        onClick={(e) => { e.stopPropagation(); setFullPickerOpen(true); }}
                        className="w-7 h-7 ml-1 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors shadow-inner cursor-pointer"
                    >
                        <Plus className="w-4 h-4 text-white font-bold" />
                    </button>
                </div>
            )}
        </div>
    );

    // SHARED PICKER MODAL
    const renderFullPicker = (alignment: 'left' | 'right') => (
        fullPickerOpen && (
            <div className={cn(
                "absolute bottom-0 z-[10001] animate-in fade-in duration-200",
                alignment === 'left' ? 'left-full ml-3' : 'right-full mr-3'
            )}>
                <div className="fixed inset-0 -z-10" onClick={() => { setFullPickerOpen(false); setQuickReactionOpen(false); }} />
                <EmojiPickerPopup
                    onSelect={handleReaction}
                    onClose={() => { setFullPickerOpen(false); setQuickReactionOpen(false); }}
                    className="relative shadow-2xl border border-white/10 rounded-2xl shadow-orange-500/10 scale-90 sm:scale-100 origin-bottom"
                />
            </div>
        )
    );

    if (isSystemEvent) return null;

    // UI Rendering Logic for Sender (ME)
    if (isMe) {
        const meIsGift = message.isGiftMessage || isGift(message.originalText || '') || isGift(message.text || '');
        const meOnlyImage = !meIsGift && (
            isOnlyImage(message.originalText || '', message.attachments) ||
            isOnlyImage(message.text || '', message.attachments));

        return (
            <>
                <div
                    className="flex items-start justify-end gap-2.5 ml-auto"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                >
                    <div className="flex flex-col gap-1 items-end min-w-0">
                        <div className="flex items-center gap-1.5">
                            {renderReactionPicker('right')}
                            <div className="relative group">
                                <div className={cn(
                                    'max-w-[35vw] break-words text-white transition-all',
                                    (!meOnlyImage && !meIsGift) && 'bg-[#1a1c23]/90 backdrop-blur-md px-4 py-3 pr-8 sm:px-5 sm:py-3.5 sm:pr-9 rounded-2xl rounded-tr-sm shadow-lg',
                                    meIsGift && 'bg-[#1a1c23]/80 border border-[#FF7700]/30 px-4 py-4 rounded-2xl min-w-[160px] backdrop-blur-sm',
                                    meOnlyImage && 'p-0 bg-transparent border-none shadow-none',
                                    isPending && 'opacity-70 animate-pulse',
                                )}>
                                    {isPending && (
                                        <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] flex items-center justify-center rounded-inherit z-10">
                                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                                        </div>
                                    )}
                                    {message.attachments && message.attachments.length > 0 && (
                                        <div className={cn('flex flex-col gap-2', (!meOnlyImage && !meIsGift) && 'mb-2')}>
                                            {message.attachments.map((att, i) => (
                                                att.imageUrl ? (
                                                    <img
                                                        key={i}
                                                        src={att.imageUrl}
                                                        alt="attachment"
                                                        onLoad={onImageLoad}
                                                        className="max-w-full sm:max-w-[300px] max-h-[400px] object-contain rounded-lg bg-black/20 shadow-sm border border-white/5"
                                                    />
                                                ) : (
                                                    <div key={i} className="w-[180px] h-[240px] bg-white/5 rounded-lg animate-pulse" />
                                                )
                                            ))}
                                        </div>
                                    )}

                                    {message.originalText && (
                                        <div className={cn('text-[13px] sm:text-sm leading-[1.6] font-medium', (meOnlyImage || meIsGift) && 'p-0')}>
                                            {renderMessageContent(message, message.originalText, true, onImageLoad)}
                                        </div>
                                    )}
                                    <div className={cn(
                                        'flex items-center gap-1 mt-1.5 justify-end',
                                        (meOnlyImage || meIsGift) && 'absolute bottom-1 right-1 bg-black/50 px-1.5 py-0.5 rounded-md backdrop-blur-sm shadow-sm',
                                    )}>
                                        <span className="text-[10px] text-white/90 font-medium">{formatMsgTime(message.time)}</span>
                                        <TickIcon status={message.status} />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDropdown(v => !v)}
                                    className={cn(
                                        'absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150 z-10 cursor-pointer',
                                        'bg-black/20 hover:bg-black/50 text-white/70 hover:text-white',
                                        (hovered || dropdownOpen) ? 'opacity-100' : 'opacity-0',
                                    )}
                                >
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                                {dropdownOpen && (
                                    <MessageDropdown
                                        isMe
                                        positionLeft={false}
                                        onDelete={() => onDelete(message)}
                                        onCopy={() => onCopy(message)}
                                        onClose={() => setDropdown(false)}
                                    />
                                )}
                                {renderReactions(meOnlyImage)}
                                {renderFullPicker('right')}
                                {renderReactionModal('right')}
                            </div>
                        </div>


                    </div>
                    <Avatar src={myAvatar} alt="me" className="w-8 h-8 sm:w-9 sm:h-9 mt-0.5" />
                </div>
            </>
        );
    }

    // UI Rendering Logic for Receiver (OTHERS)
    const tIsGift = message.isGiftMessage || isGift(receivedText);
    const tOnlyImage = !tIsGift && (isOnlyImage(receivedText, message.attachments) ||
        isOnlyImage(message.text || '', message.attachments));

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
                <span className="text-[12px] font-semibold text-gray-300 leading-none">
                    {capitalizeName(participantName)}
                </span>
                <div className="flex items-center gap-1.5">
                    <div className="relative">
                        <div className={cn(
                            'max-w-[35vw] break-words text-white transition-all',
                            (!tOnlyImage && !tIsGift) && 'bg-[#1a1c23] px-4 py-3 pr-8 sm:px-5 sm:py-3.5 sm:pr-9 rounded-2xl rounded-tl-sm shadow-md',
                            tIsGift && 'bg-[#1a1c23]/60 border border-white/10 px-4 py-4 rounded-2xl min-w-[160px] backdrop-blur-sm',
                            tOnlyImage && 'p-0 bg-transparent border-none shadow-none',
                            isPending && 'opacity-70 animate-pulse',
                        )}>
                            {isPending && (
                                <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] flex items-center justify-center rounded-inherit z-10">
                                    <Loader2 className="w-4 h-4 animate-spin text-[#FF7700]" />
                                </div>
                            )}
                            {message.attachments && message.attachments.length > 0 && (
                                <div className={cn('flex flex-col gap-2', (!tOnlyImage && !tIsGift) && 'mb-2')}>
                                    {message.attachments.map((att, i) => (
                                        <img
                                            key={i}
                                            src={att.imageUrl}
                                            alt="attachment"
                                            onLoad={onImageLoad}
                                            className="max-w-full sm:max-w-[300px] max-h-[400px] object-contain rounded-lg bg-black/20 shadow-sm border border-white/5"
                                        />
                                    ))}
                                </div>
                            )}
                            {receivedText && (
                                <div className={cn('text-[13px] sm:text-sm leading-[1.6]', (tOnlyImage || tIsGift) && 'p-0')}>
                                    {renderMessageContent(message, receivedText, false, onImageLoad)}
                                </div>
                            )}
                            <div className={cn(
                                'flex items-center gap-1 mt-1.5 justify-end',
                                (tOnlyImage || tIsGift) && 'absolute bottom-1 right-1 bg-black/50 px-1.5 py-0.5 rounded-md backdrop-blur-sm shadow-sm',
                            )}>
                                <span className="text-[10px] text-gray-300 font-medium">{formatMsgTime(message.time)}</span>
                            </div>
                        </div>

                        {!tIsGift && (
                            <button
                                onClick={() => setDropdown(v => !v)}
                                className={cn(
                                    'absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150 z-10 cursor-pointer',
                                    'bg-black/20 hover:bg-black/50 text-white/70 hover:text-white',
                                    (hovered || dropdownOpen) ? 'opacity-100' : 'opacity-0'
                                )}
                            >
                                <ChevronDown className="w-3 h-3" />
                            </button>
                        )}

                        {dropdownOpen && !tIsGift && (
                            <MessageDropdown
                                isMe={false}
                                positionLeft
                                onCopy={() => onCopy(message)}
                                onReport={() => onReport?.(message)}
                                onClose={() => setDropdown(false)}
                            />
                        )}

                        {renderReactions(tOnlyImage)}
                        {renderFullPicker('left')}
                        {renderReactionModal('left')}
                    </div>
                    {renderReactionPicker('left')}
                </div>
            </div>
        </div>
    );
};

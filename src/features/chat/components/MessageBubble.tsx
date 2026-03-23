import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from './Avatar';
import { MessageDropdown } from './MessageDropdown';
import { TickIcon } from './ChatSidebar';
import { capitalizeName, formatMsgTime } from '../utils/ChatUtils';
import type { Message } from '../types/chat.types';

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
    // Structure: [Prefix : Name : Coins]
    const tagRegex = /[\[\(\【][\s\S]*?:[\s\S]*?:\d+[\]\)\】]/gi;
    const hasTag = tagRegex.test(trimmed);
    const cleanText = trimmed.replace(tagRegex, '').trim();
    return hasTag && !cleanText;
};

/**
 * Checks BOTH originalText and translated text for special message patterns.
 */
const detectSpecialMessage = (msg: Message): boolean => {
    if (msg.attachments && msg.attachments.length > 0) return true;
    const original = msg.originalText || '';
    const translated = msg.text || '';
    return (
        isOnlyImage(original, msg.attachments) ||
        isGift(original) ||
        isOnlyImage(translated, msg.attachments) ||
        isGift(translated)
    );
};

/**
 * Pick the best content string to render for a special message.
 */
const pickSpecialContent = (msg: Message): string => {
    const original = msg.originalText || '';
    const translated = msg.text || '';

    if (original && (isOnlyImage(original, msg.attachments) || isGift(original))) {
        return original;
    }
    return translated || original;
};

/**
 * Renders the message content, splitting by tags and extracting URLs/gifts structurally.
 */
const renderMessageContent = (text: string, onImageLoad?: () => void) => {
    if (!text) return null;

    // 1. Check for Gift (Structural match: [Any:Name:Coins])
    const giftMatch = text.match(/[\[\(\【][\s\S]*?:([\s\S]*?):(\d+)[\]\)\】]/i);
    // Be more permissive: if it looks like a gift tag anywhere in the string and starts with a bracket
    const trimmedText = text.trim();
    if (giftMatch && (trimmedText.startsWith('[') || trimmedText.startsWith('(') || trimmedText.startsWith('【'))) {
        const [, name, coins] = giftMatch;
        return (
            <div className="flex flex-col items-center gap-3 py-2 px-1">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-400/20 to-red-500/20 flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-orange-500/10 blur-xl group-hover:bg-orange-500/20 transition-colors" />
                    <Gift className="w-12 h-12 text-[#FF7700] relative z-10" />
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                    <span className="text-[13px] font-bold text-white uppercase tracking-wider">{name.trim() || 'Gift'}</span>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                        <span className="text-[11px] font-black text-yellow-500">{coins} Coins</span>
                    </div>
                </div>
                <button className="w-full h-8 rounded-lg bg-[#FF7700]/10 hover:bg-[#FF7700]/20 text-[#FF7700] text-[11px] font-bold transition-colors mt-1 border border-[#FF7700]/20">
                    Gift Sent
                </button>
            </div>
        );
    }

    // 2. Handle Images / URLs within brackets or raw URLs
    // This regex catches brackets [ ], parens ( ), and Japanese/Chinese brackets 【 】
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
    onCopy: (msg: Message) => void;
    onForward: (msg: Message) => void;
    onImageLoad?: () => void;
}

export const MessageBubble = ({
    message, isMe, translateEnabled, participantName, participantAvatar, myAvatar,
    onDelete, onCopy, onForward, onImageLoad,
}: MessageBubbleProps) => {
    
    // Detect if this is a special message using a double-check strategy
    const isSpecialMsg = detectSpecialMessage(message);

    // Decide which text to use as the base for rendering
    // Priority: 1. Me -> Original, 2. Normal Translated -> Translated, 3. Special -> pickSpecialContent (prioritizes original)
    const rawContent = message.originalText || message.text || '';
    const receivedText = isMe
        ? rawContent
        : (translateEnabled && !isSpecialMsg)
            ? (message.text || message.originalText || '')
            : pickSpecialContent(message);

    const [hovered, setHovered] = useState(false);
    const [dropdownOpen, setDropdown] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isPending = message.status === 'pending';

    const handleTouchStart = (e: React.TouchEvent) => {
        timer.current = setTimeout(() => { e.preventDefault(); setDropdown(true); }, 500);
    };
    const cancelLongPress = () => {
        if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    };
    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

    const isSystemEvent =
        message.originalText?.trim() === 'has joined the live' ||
        message.text?.trim() === 'has joined the live';

    if (isSystemEvent) return null;

    // UI Rendering Logic for Sender (ME)
    if (isMe) {
        const meOnlyImage = isOnlyImage(message.originalText || '', message.attachments) ||
                           isOnlyImage(message.text || '', message.attachments) ||
                           !!(message.attachments && message.attachments.length > 0);
        const meIsGift = isGift(message.originalText || '') || isGift(message.text || '');

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
                        'max-w-[35vw] break-words text-white transition-all',
                        (!meOnlyImage && !meIsGift) && 'bg-[#2a2c35] px-4 py-3 pr-8 sm:px-5 sm:py-3.5 sm:pr-9 rounded-2xl rounded-tr-sm',
                        meIsGift && 'bg-[#2a2c35]/60 border border-white/10 px-4 py-4 rounded-2xl min-w-[160px]',
                        meOnlyImage && 'p-0 bg-transparent border-none shadow-none',
                        isPending && 'opacity-70',
                    )}>
                        {message.attachments && message.attachments.length > 0 && (
                            <div className={cn('flex flex-col gap-2', (!meOnlyImage && !meIsGift) && 'mb-2')}>
                                {message.attachments.map((att, i) => (
                                    <img
                                        key={i}
                                        src={att.imageUrl}
                                        alt="attachment"
                                        onLoad={onImageLoad}
                                        className="max-w-[200px] max-h-[300px] object-contain rounded-lg bg-black/20"
                                    />
                                ))}
                            </div>
                        )}
                        {message.originalText && (
                            <div className={cn('text-[13px] sm:text-sm leading-[1.6]', (meOnlyImage || meIsGift) && 'p-0')}>
                                {renderMessageContent(message.originalText, onImageLoad)}
                            </div>
                        )}
                        <div className={cn(
                            'flex items-center gap-1 mt-1.5 justify-end',
                            (meOnlyImage || meIsGift) && 'absolute bottom-1 right-1 bg-black/50 px-1.5 py-0.5 rounded-md backdrop-blur-sm shadow-sm',
                        )}>
                            <span className="text-[10px] text-gray-300 font-medium">{formatMsgTime(message.time)}</span>
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
                        <MessageDropdown
                            isMe
                            positionLeft={false}
                            onDelete={() => onDelete(message)}
                            onCopy={() => onCopy(message)}
                            onForward={() => onForward(message)}
                            onClose={() => setDropdown(false)}
                        />
                    )}
                </div>
                <Avatar src={myAvatar} alt="me" className="w-8 h-8 sm:w-9 sm:h-9 mt-0.5" />
            </div>
        );
    }

    // UI Rendering Logic for Receiver (OTHERS)
    const tOnlyImage = isOnlyImage(receivedText, message.attachments) ||
                      !!(message.attachments && message.attachments.length > 0);
    const tIsGift = isGift(receivedText);

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
                <div className="relative">
                    <div className={cn(
                        'max-w-[35vw] break-words text-white transition-all',
                        (!tOnlyImage && !tIsGift) && 'bg-[#1a1c23] px-4 py-3 pr-8 sm:px-5 sm:py-3.5 sm:pr-9 rounded-2xl rounded-tl-sm',
                        tIsGift && 'bg-[#1a1c23]/60 border border-white/10 px-4 py-4 rounded-2xl min-w-[160px]',
                        tOnlyImage && 'p-0 bg-transparent border-none shadow-none',
                    )}>
                        {message.attachments && message.attachments.length > 0 && (
                            <div className={cn('flex flex-col gap-2', (!tOnlyImage && !tIsGift) && 'mb-2')}>
                                {message.attachments.map((att, i) => (
                                    <img
                                        key={i}
                                        src={att.imageUrl}
                                        alt="attachment"
                                        onLoad={onImageLoad}
                                        className="max-w-[200px] max-h-[300px] object-contain rounded-lg bg-black/20"
                                    />
                                ))}
                            </div>
                        )}
                        {receivedText && (
                            <div className={cn('text-[13px] sm:text-sm leading-[1.6]', (tOnlyImage || tIsGift) && 'p-0')}>
                                {renderMessageContent(receivedText, onImageLoad)}
                            </div>
                        )}
                        <div className={cn(
                            'flex items-center gap-1 mt-1.5 justify-end',
                            (tOnlyImage || tIsGift) && 'absolute bottom-1 right-1 bg-black/50 px-1.5 py-0.5 rounded-md backdrop-blur-sm shadow-sm',
                        )}>
                            <span className="text-[10px] text-gray-300 font-medium">{formatMsgTime(message.time)}</span>
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
                        <MessageDropdown
                            isMe={false}
                            positionLeft
                            onCopy={() => onCopy(message)}
                            onForward={() => onForward(message)}
                            onClose={() => setDropdown(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

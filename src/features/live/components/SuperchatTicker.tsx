import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChannelStateContext } from 'stream-chat-react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import giftBoxLottie from '@/assets/GiftBoxAnimation.lottie';
import { useUserProfileStore } from '../stores/userProfileStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { useLiveStreamContext } from './LiveStreamLayout';

const SUPERCHAT_DURATION = 16_000; // 16 seconds

interface SuperchatEntry {
    id: string;
    senderName: string;
    senderUsername: string;
    senderAvatar: string;
    giftIconUrl: string;
    giftName: string;
    createdAt: number;
}

/** Horizontal scrolling superchat ticker showing recent gift messages with Lottie backgrounds */
export const SuperchatTicker: React.FC = () => {
    const { messages } = useChannelStateContext();
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [entries, setEntries] = useState<SuperchatEntry[]>([]);
    const processedIdsRef = useRef<Set<string>>(new Set());
    const { openModal: openProfileModal } = useUserProfileStore();
    const { openModal: openLoginModal, setMode } = useSignUpStore();
    const { isGuest } = useLiveStreamContext();

    const handleUserClick = useCallback((username?: string) => {
        if (!username) return;
        if (isGuest) {
            setMode('login');
            openLoginModal();
        } else {
            openProfileModal(username);
        }
    }, [isGuest, setMode, openLoginModal, openProfileModal]);

    // Build fullName lookup from participants
    const fullNameMap = useMemo(() => {
        const map = new Map<string, string>();
        participants.forEach((p: any) => {
            const fullName = p?.custom?.fields?.fullName?.kind?.stringValue;
            if (fullName && p.userId) map.set(p.userId, fullName);
        });
        return map;
    }, [participants]);

    const getDisplayName = useCallback(
        (msgUser: any): string => {
            if (!msgUser) return '';
            return fullNameMap.get(msgUser.id) || msgUser.name || msgUser.id || '';
        },
        [fullNameMap],
    );

    // Watch for new gift messages and add them to the ticker
    useEffect(() => {
        if (!messages) return;

        const now = Date.now();
        const newEntries: SuperchatEntry[] = [];
        for (const msg of messages) {
            if (
                !(msg as any)?.isGiftMessage ||
                processedIdsRef.current.has(msg.id)
            )
                continue;

            const msgCreatedAt = msg.created_at ? new Date(msg.created_at).getTime() : now;

            // If the message is already older than the duration, discard it silently
            if (now - msgCreatedAt >= SUPERCHAT_DURATION) {
                processedIdsRef.current.add(msg.id);
                continue;
            }

            processedIdsRef.current.add(msg.id);

            newEntries.push({
                id: msg.id,
                senderName: getDisplayName(msg.user),
                senderUsername: msg.user?.name || '',
                senderAvatar: (msg.user?.image as string) || 'https://i.pravatar.cc/150',
                giftIconUrl: (msg as any)?.giftIconUrl || '',
                giftName: (msg as any)?.giftName || '',
                createdAt: msgCreatedAt,
            });
        }

        if (newEntries.length > 0) {
            setEntries((prev) => [...newEntries, ...prev]);
        }
    }, [messages, getDisplayName]);

    // Auto-remove expired entries
    useEffect(() => {
        if (entries.length === 0) return;

        const timer = setInterval(() => {
            const now = Date.now();
            setEntries((prev) => prev.filter((e) => now - e.createdAt < SUPERCHAT_DURATION));
        }, 1000);

        return () => clearInterval(timer);
    }, [entries.length]);

    if (entries.length === 0) return null;

    return (
        <div className="bg-[#2C2F30] border-b border-[#494E50] pt-4 pb-3 px-3">
            <div
                ref={scrollRef}
                className="flex gap-2.5 overflow-x-auto scrollbar-hide"
            >
                {entries.map((entry) => (
                    <SuperchatCard key={entry.id} entry={entry} onUserClick={handleUserClick} />
                ))}
            </div>
        </div>
    );
};

/** Individual superchat card — Lottie background with profile photo, username, and gift icon */
const SuperchatCard: React.FC<{ entry: SuperchatEntry; onUserClick: (username?: string) => void }> = ({ entry, onUserClick }) => {
    return (
        <div
            className="relative shrink-0 rounded-2xl overflow-hidden"
            style={{ width: 180, height: 52 }}
        >
            {/* Lottie animated background */}
            <div className="absolute inset-0 z-0">
                <DotLottieReact
                    src={giftBoxLottie}
                    loop
                    autoplay
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            {/* Content: avatar + username + gift icon */}
            <div className="relative z-1 flex items-center gap-2 px-2 h-full">
                <img
                    src={entry.senderAvatar}
                    alt={entry.senderName}
                    onClick={() => onUserClick(entry.senderUsername)}
                    className="w-8 h-8 rounded-full shrink-0 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                />
                <span
                    className="text-xs font-semibold text-white truncate flex-1 cursor-pointer hover:underline transition-colors"
                    onClick={() => onUserClick(entry.senderUsername)}
                >
                    @{entry.senderName}
                </span>
                {entry.giftIconUrl && (
                    <img
                        src={entry.giftIconUrl}
                        alt={entry.giftName}
                        className="w-7 h-7 object-contain shrink-0"
                    />
                )}
            </div>
        </div>
    );
};

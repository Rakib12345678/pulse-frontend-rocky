import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useChannelStateContext } from 'stream-chat-react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import giftBoxLottie from '@/assets/GiftBoxAnimation.lottie';
import { useUserProfileStore } from '@/features/live/stores/userProfileStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { useLiveStreamContext } from '@/features/live/components/layout/LiveStreamLayout';

const DEFAULT_DURATION_SECONDS = 16;

interface SuperchatEntry {
    id: string;
    senderName: string;
    senderUsername: string;
    senderAvatar: string;
    giftIconUrl: string;
    giftName: string;
    createdAt: number;
    durationSeconds: number;
}

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

    // 🔍 DEBUG: Track message processing
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
            const rawDuration = (msg as any)?.duration;

            // Parse duration safely
            let durationSeconds = DEFAULT_DURATION_SECONDS;
            if (typeof rawDuration === 'number' && rawDuration > 0) {
                durationSeconds = rawDuration >= 1000 ? rawDuration / 1000 : rawDuration;
            } else if (typeof rawDuration === 'string') {
                const parsed = parseFloat(rawDuration);
                if (!isNaN(parsed) && parsed > 0) durationSeconds = parsed >= 1000 ? parsed / 1000 : parsed;
            }

            const expiryTime = msgCreatedAt + durationSeconds * 1000;
            if (now >= expiryTime) {
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
                durationSeconds,
            });
        }

        if (newEntries.length > 0) {
            setEntries((prev) => [...newEntries, ...prev]);
        }
    }, [messages, getDisplayName]);

    // 🔍 DEBUG: Track expiration
    useEffect(() => {
        if (entries.length === 0) return;

        const timer = setInterval(() => {
            const now = Date.now();
            setEntries((prev) => {
                const filtered = prev.filter((e) => {
                    const expiryTime = e.createdAt + e.durationSeconds * 1000;
                    return now < expiryTime;
                });
                return filtered;
            });
        }, 250);

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

const SuperchatCard: React.FC<{ entry: SuperchatEntry; onUserClick: (username?: string) => void }> = ({ entry, onUserClick }) => {
    const animationSpeed = useMemo(() => {
        return Math.max(0.1, Math.min(4, DEFAULT_DURATION_SECONDS / entry.durationSeconds));
    }, [entry.durationSeconds]);

    const isFrameSetRef = useRef(false);
    const handleDotLottieRefCallback = useCallback((dotLottie: any) => {
        if (!dotLottie || isFrameSetRef.current) return;

        const initFrame = () => {
            if (isFrameSetRef.current || !dotLottie.totalFrames) return;
            const totalMs = entry.durationSeconds * 1000;
            const elapsedMs = Math.max(0, Date.now() - entry.createdAt);
            const fraction = elapsedMs / totalMs;
            const targetFrame = (fraction * dotLottie.totalFrames) % dotLottie.totalFrames;
            dotLottie.setFrame(targetFrame);
            isFrameSetRef.current = true;
        };

        dotLottie.addEventListener('ready', initFrame);
        dotLottie.addEventListener('load', initFrame);
        initFrame(); // Trigger in case it's already ready
    }, [entry.createdAt, entry.durationSeconds]);

    return (
        <div
            className="relative shrink-0 rounded-2xl overflow-hidden"
            style={{ width: 180, height: 52 }}
        >
            <div className="absolute inset-0 z-0">
                <DotLottieReact
                    src={giftBoxLottie}
                    loop
                    autoplay
                    speed={animationSpeed}
                    dotLottieRefCallback={handleDotLottieRefCallback}
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            <div className="relative z-1 flex items-center gap-2 px-2 h-full pb-[2px]">
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
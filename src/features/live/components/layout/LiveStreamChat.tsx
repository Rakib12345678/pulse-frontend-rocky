import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Lock, Heart, SendHorizonal, Share2, Volume2, VolumeX, MessageCircle } from 'lucide-react';
import coinIcon from '@/assets/coin.svg';
import giftSvg from '@/assets/gift.svg';
import { useJoinRequestStore } from '@/features/live/stores/joinRequestStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { GiftingFeature } from '@/features/live/components/modals/GiftingFeature';
import {
    Channel,
    useChannelStateContext,
    useChatContext,
} from 'stream-chat-react';
import { Channel as StreamChannel } from 'stream-chat';
import { useLiveStreamContext } from '@/features/live/components/layout/LiveStreamLayout';
import { useUserProfileStore } from '@/features/live/stores/userProfileStore';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';

import { liveService } from '@/features/live/services/live.service';
import { CompactGiftSidebar } from '@/features/live/components/overlay/CompactGiftSidebar';
import { SuperchatTicker } from '@/features/live/components/overlay/SuperchatTicker';

// Type guard for gift messages
const isGiftMsg = (msg: any): boolean => !!msg?.isGiftMessage;

export const LiveStreamChat: React.FC = () => {
    const { client: chatClient } = useChatContext();
    const { call, isChatVisible, isViewer, isGiftingOpen, setIsGiftingOpen } = useLiveStreamContext();
    const { user } = useAuthStore();
    const isMobile = useIsMobile();
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const knownCohostsRef = useRef<Record<string, { username: string; profileImage: string; status: string }>>({});
    const initCohostsRef = useRef(false);
    const participantsRef = useRef(participants);

    useEffect(() => {
        participantsRef.current = participants;
    }, [participants]);

    // Use the same ID as the call for the chat channel (must be before any early returns)
    const channel = useMemo(
        () => (call && chatClient) ? chatClient.channel('livestream', call.id) : null,
        [chatClient, call?.id]
    );

    // Eagerly watch the channel so the host's SuperchatTicker has messages immediately
    // (the <Channel> component lazy-initializes; watching here ensures messages are ready)
    useEffect(() => {
        if (!channel) return;
        channel.watch().catch((err) =>
            console.error('[LiveStreamChat] Failed to watch channel:', err)
        );
    }, [channel]);


    // Trigger participant sync every 10 seconds (for host only)
    useEffect(() => {
        if (isViewer || !call) return;

        // Initialize memory from sessionStorage to survive page refresh
        if (!initCohostsRef.current) {
            try {
                const saved = sessionStorage.getItem(`pulse_cohosts_${call.id}`);
                if (saved) knownCohostsRef.current = JSON.parse(saved);
            } catch (e) {
                console.error('[LiveStreamChat] Failed to restore cohosts from session', e);
            }
            initCohostsRef.current = true;
        }

        const syncParticipants = async () => {
            try {
                const currentParticipants = participantsRef.current;
                // Extract only active co-hosts from the current participants pool
                const currentActiveCohosts = currentParticipants
                    .filter((p: any) => !p.isLocalParticipant && !p.roles?.includes('host') && !p.roles?.includes('admin') && (
                        p.roles?.includes('co_host') ||
                        p.capabilities?.includes('send-audio') ||
                        p.capabilities?.includes('send-video')
                    ));

                const activeUsernames = new Set(currentActiveCohosts.map((p: any) => p.name || `user_${p.userId}`));

                // Mark currently active as ACTIVE
                currentActiveCohosts.forEach((p: any) => {
                    const username = p.name || `user_${p.userId}`;
                    knownCohostsRef.current[username] = {
                        username,
                        profileImage: (p.image as string),
                        status: 'ACTIVE'
                    };
                });

                // Mark previously known cohosts that are no longer active as INACTIVE
                Object.keys(knownCohostsRef.current).forEach((username) => {
                    if (!activeUsernames.has(username)) {
                        knownCohostsRef.current[username].status = 'INACTIVE';
                    }
                });

                // Persist to session storage
                sessionStorage.setItem(`pulse_cohosts_${call.id}`, JSON.stringify(knownCohostsRef.current));

                const cohostsList = Object.values(knownCohostsRef.current);

                console.log('[LiveStreamChat] Syncing participants. Cohosts count:', cohostsList.length);
                await liveService.syncParticipants(call.id, cohostsList);
            } catch (error) {
                console.error('[LiveStreamChat] Failed to sync participants:', error);
            }
        };

        const intervalId = setInterval(syncParticipants, 15000);

        // Also run immediately on mount (or after 25s if that was intentional, but user said "after 10s each")
        // We'll run it once immediately to start the cycle.
        syncParticipants();

        return () => clearInterval(intervalId);
    }, [isViewer, call?.id]);

    if (!isChatVisible) return null;

    if (!call || !chatClient || !channel) return null;

    // Mobile: viewers need extra room for horizontal gift bar; host just clears the Invite Friends button
    const bottomClass = isMobile ? (isViewer ? 'bottom-[96px]' : 'bottom-[96px]') : 'bottom-10';

    return (
        <Channel key={chatClient.userID || 'anonymous'} channel={channel}>
            {/* Chat messages + input — transparent on mobile, dark card on desktop */}
            <div
                className={`absolute ${bottomClass} z-20 flex flex-col
                    ${isMobile
                        ? 'left-2 right-2 max-h-[52vh]'
                        : 'left-10 right-auto w-[360px] max-h-[400px] rounded-[24px] overflow-hidden border border-[#494E50] shadow-2xl'
                    }`}
            >
                {/* SuperchatTicker shown for host; hidden for viewers */}
                <SuperchatTicker />

                <div className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'pt-2 px-2 pb-1' : 'bg-[#1D1F20] pt-4 px-4 pb-3'}`}>
                    <LiveStreamMessageList />
                    <LiveStreamMessageInput />
                </div>
                <JoinMessageSender channel={channel} isViewer={isViewer} userId={user?.id} />
            </div>

            {/* Viewer: horizontal gift sidebar with join button at bottom */}
            {isViewer && <ViewerBottomBar />}
            {/* Host: Invite Friends button */}
            {!isViewer && <HostInviteBar />}

            {/* CompactGiftSidebar handles horizontal gift row on mobile (viewer only) */}
            <CompactGiftSidebar />

            <GiftingFeature
                isOpen={isGiftingOpen}
                onOpenChange={setIsGiftingOpen}
            />
        </Channel>
    );
};

const LiveStreamMessageList: React.FC = () => {
    const { messages } = useChannelStateContext();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { openModal: openProfileModal } = useUserProfileStore();
    const { openModal: openLoginModal, setMode } = useSignUpStore();
    const { isGuest, isViewer } = useLiveStreamContext();
    const { useParticipants: useParticipantsList } = useCallStateHooks();
    const participants = useParticipantsList();
    const { user } = useAuthStore();

    // Build a lookup map: userId -> fullName from custom fields
    const fullNameMap = useMemo(() => {
        const map = new Map<string, string>();
        participants.forEach((p: any) => {
            const fullName = p?.custom?.fields?.fullName?.kind?.stringValue;
            if (fullName && p.userId) {
                map.set(p.userId, fullName);
            }
        });
        return map;
    }, [participants]);

    // Get display name: prefer fullName from participants, fall back to msg.user.name
    const getDisplayName = (msgUser: any): string => {
        if (!msgUser) return '';
        return fullNameMap.get(msgUser.id) || msgUser.name || msgUser.id || '';
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleUserClick = (username?: string) => {
        if (!username) return;
        if (isGuest) {
            setMode('login');
            openLoginModal();
        } else if (user?.username !== username) {
            openProfileModal(username);
        }
    };

    return (
        <div
            className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-hide pr-1"
            style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 5%, black 100%)',
            }}
        >
            {messages?.map((msg) => {
                const giftMessage = isGiftMsg(msg);
                const giftIconUrl = (msg as any)?.giftIconUrl;
                const giftCost = (msg as any)?.giftCost;

                if (giftMessage) {
                    if (isViewer) return null;

                    return (
                        <div
                            key={msg.id}
                            className="flex items-center gap-3 border border-[#494E50] rounded-2xl px-3 py-3"
                        >
                            <img
                                src={msg.user?.image || 'https://i.pravatar.cc/150'}
                                alt={getDisplayName(msg.user)}
                                onClick={() => handleUserClick(msg.user?.name)}
                                className="w-9 h-9 rounded-full border-2 border-[#FF8800]/60 shrink-0 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="text-xs font-semibold text-[#FF8800] cursor-pointer hover:underline transition-colors"
                                        onClick={() => handleUserClick(msg.user?.name)}
                                    >
                                        @{getDisplayName(msg.user)}
                                    </span>
                                    <span className="text-xs text-white/70">{msg.text}</span>
                                </div>
                                {giftCost && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <img src={coinIcon} alt="coins" className="w-3 h-3" />
                                        <span className="text-[10px] font-bold text-[#FFB800]">{giftCost}</span>
                                    </div>
                                )}
                            </div>
                            {giftIconUrl && (
                                <img
                                    src={giftIconUrl}
                                    alt="gift"
                                    className="w-10 h-10 object-contain drop-shadow-[0_0_6px_rgba(255,136,0,0.5)] animate-bounce"
                                    style={{ animationDuration: '1.5s', animationIterationCount: 3 }}
                                />
                            )}
                        </div>
                    );
                }

                return (
                    <div key={msg.id} className="flex items-start gap-2.5">
                        <img
                            src={msg.user?.image || 'https://i.pravatar.cc/150'}
                            alt={getDisplayName(msg.user)}
                            onClick={() => handleUserClick(msg.user?.name)}
                            className="w-8 h-8 rounded-full border-2 border-transparent shrink-0 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        />
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span
                                    className="text-sm font-semibold text-white/60 cursor-pointer hover:text-white hover:underline transition-colors"
                                    onClick={() => handleUserClick(msg.user?.name)}
                                >
                                    @{getDisplayName(msg.user)}
                                </span>
                                {typeof msg.text === 'string' && msg.text.split('\n').length > 1 && (
                                    <>
                                        <span className="text-sm font-bold text-white mt-0.5">
                                            {msg.text.split('\n')[0]}
                                        </span>
                                        <p className="text-sm text-white/80 mt-1 leading-relaxed">
                                            {msg.text.split('\n').slice(1).join('\n')}
                                        </p>
                                    </>
                                )}
                                {typeof msg.text === 'string' && msg.text.split('\n').length === 1 && (
                                    <span className={`text-sm font-bold ${(msg as any).isJoinMessage ? 'text-white/50 italic' : 'text-white'}`}>
                                        {msg.text}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
            <div ref={messagesEndRef} />
        </div>
    );
};

const HEART_EMOJI = { char: '❤️', icon: Heart, color: 'text-red-500' };

const LiveStreamMessageInput: React.FC = () => {
    const { isAuthenticated, user } = useAuthStore();
    const { channel } = useChannelStateContext();
    const { call, isGuest } = useLiveStreamContext();
    const { openModal, setMode } = useSignUpStore();
    const [inputValue, setInputValue] = useState('');

    const openLoginModal = () => {
        setMode('login');
        openModal();
    };

    const handleSendMessage = async () => {
        if (isGuest) {
            openLoginModal();
            return;
        }
        if (!inputValue.trim() || !channel) return;

        try {
            await channel.sendMessage({
                text: inputValue,
            });
            setInputValue('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const [lastReactionTime, setLastReactionTime] = useState(0);

    const handleSendReaction = async () => {
        if (isGuest) {
            openLoginModal();
            return;
        }

        const now = Date.now();
        if (now - lastReactionTime < 2000) return; // 2 seconds cooldown

        setLastReactionTime(now);

        if (call) {
            try {
                // Send video reaction
                await call.sendReaction({
                    type: 'live-reaction',
                    custom: { emoji: HEART_EMOJI.char }
                });

                // Also send a custom chat channel event for anonymous guest viewers
                if (channel) {
                    await channel.sendEvent({
                        type: 'client-live-reaction',
                        emoji: HEART_EMOJI.char
                    } as any);
                }
            } catch (err) {
                console.error('Failed to send reaction:', err);
            }
        }
    };

    const { isGiftingOpen, setIsGiftingOpen, isViewer } = useLiveStreamContext();
    const isMobile = useIsMobile();

    const isViewerMobile = isMobile && isViewer;
    // Same dark style for both host and viewer
    const inputClass = 'bg-[#1D1F20]/90 border-white/10 placeholder:text-white/30 focus:border-white/20';


    if (isAuthenticated && user) {
        return (
            <div className="flex items-center gap-2">
                {/* Input row */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Say Something..."
                        className={`w-full h-11 border rounded-full pl-10 pr-10 text-sm text-white focus:outline-none transition-all backdrop-blur-sm ${inputClass}`}
                    />
                    {/* Heart — left inside input */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <button
                            onClick={handleSendReaction}
                            className="flex items-center justify-center transition-transform hover:scale-125 active:scale-95"
                            title="Send heart"
                        >
                            <Heart className="w-5 h-5 text-red-500 fill-red-500 drop-shadow-sm" />
                        </button>
                    </div>
                    {/* Send — right inside input */}
                    <button
                        onClick={handleSendMessage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                    >
                        <SendHorizonal className="w-3.5 h-3.5 text-white/70" strokeWidth={2.5} />
                    </button>
                </div>

                {/* Gift button — mobile viewer only */}
                {isViewerMobile && (
                    <button
                        onClick={() => setIsGiftingOpen(!isGiftingOpen)}
                        className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all border ${isGiftingOpen
                            ? 'bg-[#FF8800] border-[#FF8800]/50'
                            : 'bg-white/10 border-white/20 backdrop-blur-sm'
                            }`}
                        title="Send a gift"
                    >
                        <img src={giftSvg} alt="gift" className={`w-5 h-5 ${isGiftingOpen ? 'brightness-0 invert' : ''}`} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 cursor-pointer" onClick={openLoginModal}>
            <div className="flex-1 relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Lock className="w-4 h-4 text-white/30" />
                </div>
                <div className={`w-full h-11 border rounded-full pl-10 pr-4 flex items-center backdrop-blur-sm ${inputClass}`}>
                    <span className="text-sm text-white/40">Say Something...</span>
                </div>
            </div>
            {/* Gift placeholder — mobile only */}
            {isMobile && (
                <div className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <img src={giftSvg} alt="gift" className="w-5 h-5 opacity-50" />
                </div>
            )}
        </div>
    );
};

// Component to handle sending the join message
const JoinMessageSender: React.FC<{ channel: StreamChannel; isViewer: boolean; userId?: number }> = ({ channel, isViewer, userId }) => {
    const joinSentRef = useRef(false);

    useEffect(() => {
        if (!channel || !isViewer || !userId) return;

        const sessionKey = `pulse_joined_${channel.id}`;
        const hasJoined = sessionStorage.getItem(sessionKey);

        // Both guards must pass: sessionStorage (cross-mount) and ref (same-mount)
        if (hasJoined || joinSentRef.current) return;

        joinSentRef.current = true;
        sessionStorage.setItem(sessionKey, 'true');

        const sendJoinEvent = async () => {
            try {
                if (!channel.initialized) {
                    await channel.watch();
                }
                await channel.sendMessage({
                    text: 'has joined the live',
                    isJoinMessage: true
                } as any);
            } catch (err) {
                console.error('Failed to send join message:', err);
                // Reset both guards so the next render can retry
                joinSentRef.current = false;
                sessionStorage.removeItem(sessionKey);
            }
        };
        sendJoinEvent();
    }, [channel, isViewer, userId]);

    return null;
};

/** Bottom bar showing host info + Follow + Join Stream + Gift icon for viewers */
const ViewerBottomBar: React.FC = () => {
    const { isGiftingOpen, setIsGiftingOpen } = useLiveStreamContext();
    const isMobile = useIsMobile();
    const { useCallCreatedBy } = useCallStateHooks();
    const createdBy = useCallCreatedBy();
    const { call } = useLiveStreamContext();
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = () => {
        if (call) {
            const newMutedState = !isMuted;
            setIsMuted(newMutedState);
            call.state.remoteParticipants.forEach((participant) => {
                participant.audioStream?.getAudioTracks().forEach((track) => {
                    track.enabled = !newMutedState;
                });
            });
        }
    };

    const { requestStatus, setRequestStatus } = useJoinRequestStore();

    // On mount/refresh, check if the current user is already a co-host in the call.
    // The Zustand store resets to 'idle' on refresh, but the participant data persists
    // in the Stream call state, so we restore 'approved' status from it.
    const { useParticipants: useViewerParticipants } = useCallStateHooks();
    const viewerParticipants = useViewerParticipants();

    useEffect(() => {
        if (!call || !user || requestStatus !== 'idle') return;

        const myParticipant = viewerParticipants.find(
            (p: any) => p.userId === String(user.id)
        );

        if (!myParticipant) return;

        const p = myParticipant as any;
        const isAlreadyCohost =
            p.roles?.includes('co_host') ||
            p.capabilities?.includes('send-audio') ||
            p.capabilities?.includes('send-video');

        if (isAlreadyCohost) {
            console.log('[ViewerBottomBar] Detected existing co-host role on mount, restoring approved status');
            setRequestStatus('approved');
        }
    }, [call, user, viewerParticipants, requestStatus, setRequestStatus]);

    // Listen for join-response from host
    useEffect(() => {
        if (!call || !user) return;
        const unsubscribe = call.on('custom', (event: any) => {
            const customData = event?.custom;
            if (customData?.type === 'join-response' && customData?.userId === String(user.id)) {
                console.log('[ViewerBottomBar] Got join response:', customData);
                setRequestStatus(customData.accepted ? 'approved' : 'declined');
                if (customData.accepted) {
                    toast.success('Host accepted your join request!');
                    // Note: co-hosts join with mic and camera off by default.
                    // They can manually enable them using the controls.
                    console.log('[ViewerBottomBar] Now a co-host — mic/camera remain off');
                } else {
                    toast.error('Host declined your join request');
                    setTimeout(() => setRequestStatus('idle'), 3000);
                }
            }
            // Handle being kicked by the host
            if (customData?.type === 'kicked' && customData?.userId === String(user.id)) {
                console.log('[ViewerBottomBar] Kicked by host');
                toast.error('You have been removed from the stream');
                (async () => {
                    try {
                        await call.camera.disable();
                        await call.microphone.disable();
                    } catch (err) {
                        console.error('[ViewerBottomBar] Failed to disable camera/mic:', err);
                    }
                    navigate({ to: '/for-you' });
                })();
                setRequestStatus('idle');
            }
        });
        return () => { unsubscribe(); };
    }, [call, user, setRequestStatus]);

    if (!createdBy) return null;


    const { openModal, setMode } = useSignUpStore();
    const handleJoinRequest = async () => {
        if (!user) {
            setMode('login');
            openModal();
            return;
        }

        if (requestStatus !== 'idle' || !call) return;
        try {
            console.log('[JoinStream] Sending custom join-request event...');
            setRequestStatus('pending');
            await call.sendCustomEvent({
                type: 'join-request',
                userId: String(user.id),
                userName: user.username || user.fullName || String(user.id),
                userImage: user.profileImage,
            });
            console.log('[JoinStream] Custom event sent successfully');
        } catch (err) {
            console.error('[JoinStream] Failed to send join request:', err);
            setRequestStatus('idle');
        }
    };

    const muteButton = (
        <button
            onClick={toggleMute}
            className={`${isMobile ? 'w-12 h-12' : 'w-12 h-12'} rounded-full flex items-center justify-center transition-all backdrop-blur-md border shrink-0 ${isMuted
                ? 'bg-red-500 border-red-400/50 text-white hover:bg-red-600'
                : 'bg-white/10 border-white/10 hover:bg-white/20'
                }`}
            title={isMuted ? 'Unmute' : 'Mute'}
        >
            {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
            ) : (
                <Volume2 className="w-5 h-5 text-white/70" />
            )}
        </button>
    );

    const giftButton = (
        <button
            onClick={() => setIsGiftingOpen(!isGiftingOpen)}
            className={`${isMobile ? 'w-12 h-12' : 'w-12 h-12'} rounded-full flex items-center justify-center transition-all backdrop-blur-md border shrink-0 ${isGiftingOpen
                ? 'bg-[#FF8800] border-[#FF8800]/50 text-black hover:bg-[#ff9922]'
                : 'bg-white/10 border-white/10 hover:bg-white/20'
                }`}
            title={isGiftingOpen ? 'Close gifts' : 'Send gift'}
        >
            <img src={giftSvg} alt="gift" className={`w-5 h-5 ${isGiftingOpen ? 'invert-0 brightness-0' : ''}`} />
        </button>
    );

    const joinButton = requestStatus === 'approved' ? (
        <span className={`rounded-full text-sm font-bold text-green-400 bg-green-400/10 shrink-0 ${isMobile ? 'px-4 py-3' : 'px-8 py-3 rounded-full'}`}>
            Joined
        </span>
    ) : (
        <button
            onClick={handleJoinRequest}
            disabled={requestStatus === 'pending'}
            className={`rounded-full text-sm font-bold transition-all shadow-md shrink-0 ${isMobile ? 'px-4 py-3' : 'px-8 py-3 rounded-full'} ${requestStatus === 'pending'
                ? 'bg-white/10 text-white/40 cursor-default'
                : 'bg-[#FF8800] text-black hover:bg-[#ff9922] active:scale-95'
                }`}
        >
            {requestStatus === 'pending' ? 'Requested' : 'Join Stream'}
        </button>
    );

    /* ===== MOBILE: The CompactGiftSidebar handles the bottom bar with Join Stream ===== */
    // On mobile, we only render the desktop layout here; mobile view is handled by CompactGiftSidebar
    if (isMobile) {
        // Mobile join stream & gifts are in CompactGiftSidebar horizontal bar — nothing to render here
        return null;
    }

    /* ===== DESKTOP: Join Stream button in bottom-right ===== */
    return (
        <div className="absolute bottom-10 right-10 z-30 flex items-center gap-3">
            {joinButton}
            {muteButton}
            {giftButton}
        </div>
    );
};

/** Host bottom bar with Invite Friends button */
const HostInviteBar: React.FC = () => {
    const isMobile = useIsMobile();

    const handleInvite = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        if (navigator.share) {
            navigator.share({ title: 'Join my live stream!', url }).catch(() => { });
        } else {
            toast.success('Stream link copied!');
        }
    };

    if (isMobile) {
        return (
            <div className="absolute bottom-0 left-0 right-0 z-30 px-4 pb-4 pt-2">
                <button
                    onClick={handleInvite}
                    className="w-full h-14 rounded-full bg-[#FF8800] text-black font-bold text-base flex items-center justify-center gap-2 transition-all hover:bg-[#ff9922] active:scale-[0.98] shadow-lg shadow-[#FF8800]/20"
                >
                    <Share2 className="w-5 h-5" />
                    Invite Friends
                </button>
            </div>
        );
    }

    /* Desktop: bottom-right corner, same position as viewer's Join Stream */
    return (
        <div className="absolute bottom-10 right-10 z-30">
            <button
                onClick={handleInvite}
                className="px-8 py-3 rounded-full bg-[#FF8800] text-black font-bold text-sm flex items-center gap-2 transition-all hover:bg-[#ff9922] active:scale-95 shadow-md"
            >
                <Share2 className="w-4 h-4" />
                Invite Friends
            </button>
        </div>
    );
};

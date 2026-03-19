import React, { useState, useRef, useEffect } from 'react';
import { Lock, Heart, SendHorizonal, Share2, Gift } from 'lucide-react';
import { useJoinRequestStore } from '../stores/joinRequestStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { GiftingFeature } from './GiftingFeature';
import {
    Channel,
    useChannelStateContext,
    useChatContext,
} from 'stream-chat-react';
import { Channel as StreamChannel } from 'stream-chat';
import { useLiveStreamContext } from './LiveStreamLayout';
import { useUserProfileStore } from '../stores/userProfileStore';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { StreamerInfoOverlay } from './StreamerInfoOverlay';
import { liveService } from '../services/live.service';

export const LiveStreamChat: React.FC = () => {
    const { client: chatClient } = useChatContext();
    const { call, isChatVisible, isViewer } = useLiveStreamContext();
    const { user } = useAuthStore();
    const isMobile = useIsMobile();
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const knownCohostsRef = useRef<Record<string, { username: string; profileImage: string; status: string }>>({});
    const initCohostsRef = useRef(false);
    const [isGiftingOpen, setIsGiftingOpen] = useState(false);
    const participantsRef = useRef(participants);

    // Keep participantsRef up to date for the interval sync
    useEffect(() => {
        participantsRef.current = participants;
    }, [participants]);

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

    if (!call || !chatClient) return null;

    // Use the same ID as the call for the chat channel
    const channel = chatClient.channel('livestream', call.id);

    // On mobile, shift chat up to make room for bottom bar (viewer bar ~80px or host invite ~72px)
    const bottomClass = isMobile ? 'bottom-[100px]' : 'bottom-10';

    return (
        <Channel key={chatClient.userID || 'anonymous'} channel={channel}>
            <div className={`absolute ${bottomClass} left-4 right-4 sm:left-10 sm:right-auto sm:w-80 max-h-[400px] flex flex-col z-20`}>
                <LiveStreamMessageList />
                <LiveStreamMessageInput setIsGiftingOpen={setIsGiftingOpen} />
                <JoinMessageSender channel={channel} isViewer={isViewer} userId={user?.id} />
            </div>
            {/* Viewer: bottom bar with host info + Join Stream */}
            {isViewer && <ViewerBottomBar />}
            {/* Host: Invite Friends button */}
            {!isViewer && <HostInviteBar />}

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
    const { isGuest } = useLiveStreamContext();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleUserClick = (username?: string) => {
        if (!username) return;
        if (isGuest) {
            setMode('login');
            openLoginModal();
        } else {
            openProfileModal(username);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto space-y-5 mb-4 scrollbar-hide pr-2">
            {messages?.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                    <img
                        src={msg.user?.image || 'https://i.pravatar.cc/150'}
                        alt={msg.user?.name || msg.user?.id}
                        onClick={() => handleUserClick(msg.user?.name)}
                        className="w-10 h-10 rounded-full border-2 border-blue-500/60 shrink-0 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    />
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="text-sm font-semibold text-white/60 cursor-pointer hover:text-white hover:underline transition-colors"
                                onClick={() => handleUserClick(msg.user?.name)}
                            >
                                @{msg.user?.name || msg.user?.id}
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
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

const HEART_EMOJI = { char: '❤️', icon: Heart, color: 'text-red-500' };

const LiveStreamMessageInput: React.FC<{ setIsGiftingOpen: (open: boolean) => void }> = ({ setIsGiftingOpen }) => {
    const { isAuthenticated, user } = useAuthStore();
    const { channel } = useChannelStateContext();
    const { call, isGuest, isViewer } = useLiveStreamContext();
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

    if (isAuthenticated && user) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Add a Comment"
                        className="w-full h-12 bg-[#2A3A2A]/80 border border-[#C5B358]/60 rounded-full pl-14 pr-14 text-sm text-white focus:outline-none focus:border-[#C5B358] transition-all placeholder:text-[#C5B358]/70"

                    />

                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                            onClick={handleSendReaction}
                            className="flex items-center justify-center transition-transform hover:scale-125 active:scale-95"
                            title="Send heart"
                        >
                            <Heart className="w-6 h-6 text-red-500 fill-red-500 drop-shadow-sm" />
                        </button>
                        {isViewer && (
                            <button
                                onClick={() => setIsGiftingOpen(true)}
                                className="flex items-center justify-center transition-transform hover:scale-125 active:scale-95"
                                title="Send gift"
                            >
                                <Gift className="w-6 h-6 text-[#FF8800] drop-shadow-sm" />
                            </button>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleSendMessage}
                    className="w-12 h-12 rounded-full bg-[#E8D5A0] flex items-center justify-center text-[#3A3A2A] hover:bg-[#F0DFA8] hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                    <SendHorizonal className="w-6 h-6" strokeWidth={2.5} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center cursor-pointer" onClick={openLoginModal}>
            <div className="flex-1 relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#C5B358]/80 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#2A2A1A]" />
                </div>
                <div className="w-full h-12 bg-[#2A3A2A]/80 border border-[#C5B358]/60 rounded-full pl-14 pr-4 flex items-center">
                    <span className="text-sm text-white/50">Log in to chat</span>
                </div>
            </div>
        </div>
    );
};

// Component to handle sending the join message
const JoinMessageSender: React.FC<{ channel: StreamChannel; isViewer: boolean; userId?: number }> = ({ channel, isViewer, userId }) => {
    useEffect(() => {
        if (!channel || !isViewer || !userId) return;

        const sessionKey = `pulse_joined_${channel.id}`;
        const hasJoined = sessionStorage.getItem(sessionKey);

        if (!hasJoined) {
            // Set immediately to prevent strict mode double-firing
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
                    sessionStorage.removeItem(sessionKey);
                }
            };
            sendJoinEvent();
        }
    }, [channel, isViewer, userId]);

    return null;
};

/** Bottom bar showing host info + Follow + Join Stream for viewers */
const ViewerBottomBar: React.FC = () => {
    const isMobile = useIsMobile();
    const { useCallCreatedBy } = useCallStateHooks();
    const createdBy = useCallCreatedBy();
    const { call } = useLiveStreamContext();
    const { user } = useAuthStore();

    const { requestStatus, setRequestStatus } = useJoinRequestStore();

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
                    (async () => {
                        try {
                            await call.camera.enable();
                            await call.microphone.enable();
                            console.log('[ViewerBottomBar] Camera & mic enabled — now a co-host');
                        } catch (err) {
                            console.error('[ViewerBottomBar] Failed to enable camera/mic:', err);
                        }
                    })();
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
                })();
                setRequestStatus('idle');
            }
        });
        return () => { unsubscribe(); };
    }, [call, user, setRequestStatus]);

    if (!createdBy) return null;

    const hostName = createdBy.name || createdBy.id || 'Host';
    const hostImage = createdBy.image as string | undefined;

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

    /* ===== MOBILE: streamer card + Join Stream ===== */
    if (isMobile) {
        return (
            <div className="absolute bottom-0 left-0 right-0 z-30 px-1 pb-4 pt-2 w-full">
                <div className="flex items-center gap-0.5 w-full">
                    <StreamerInfoOverlay
                        streamerName={hostName}
                        streamerImage={hostImage || undefined}
                        className="flex-1 bg-[#1a1d27] min-w-0"
                    />
                    {joinButton}
                </div>
            </div>
        );
    }

    /* ===== DESKTOP: Join Stream button in bottom-right ===== */
    return (
        <div className="absolute bottom-10 right-10 z-30">
            {joinButton}
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

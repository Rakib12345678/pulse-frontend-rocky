import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import {
    StreamVideo,
    StreamVideoClient,
    Call,
    StreamCall,
    useCallStateHooks,
    hasVideo,
} from '@stream-io/video-react-sdk';
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useGoLiveStore } from '@/features/live/stores/goLiveStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { liveService } from '@/features/live/services/live.service';
import { userService } from '@/features/live/services/user.service';
import { FloatingHearts } from '@/features/live/components/overlay/FloatingHearts';
import { teardownCallMedia } from '@/features/live/utils/mediaCleanup';

const apiKey = import.meta.env.VITE_STREAM_API_KEY || 'placeholder_key';

import { UserProfileModal } from '@/features/live/components/modals/UserProfileModal';
import { useUserProfileStore } from '@/features/live/stores/userProfileStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useViewerRejoinStore } from '@/features/live/stores/viewerRejoinStore';

// Context for sharing viewer state with child components
interface LiveStreamContextValue {
    isViewer: boolean;
    isGuest: boolean;
    call: Call | null;
    isChatVisible: boolean;
    setChatVisible: (visible: boolean) => void;
    isGiftingOpen: boolean;
    setIsGiftingOpen: (open: boolean) => void;
    streamEnded: boolean;
    setStreamEnded: (ended: boolean) => void;
}

const LiveStreamContext = createContext<LiveStreamContextValue>({
    isViewer: false,
    isGuest: false,
    call: null,
    isChatVisible: true,
    setChatVisible: () => { },
    isGiftingOpen: false,
    setIsGiftingOpen: () => { },
    streamEnded: false,
    setStreamEnded: () => { },
});

export const useLiveStreamContext = () => useContext(LiveStreamContext);

interface LiveStreamLayoutProps {
    children: React.ReactNode;
    callId?: string;
}

// Floating PiP video component — draggable, click to close profile
const FloatingPiP: React.FC = () => {
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const { setShowFullscreen } = useUserProfileStore();
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const pipParticipant = participants.find((p) => hasVideo(p)) || participants[0];
    const isMobile = useIsMobile();

    // PiP dimensions
    const PIP_W = isMobile ? 112 : 240;
    const PIP_H = isMobile ? 176 : 360;

    // Attach the raw video stream — only update when stream actually changes
    React.useEffect(() => {
        if (!videoRef.current || !pipParticipant) return;
        const stream = pipParticipant.videoStream;
        if (stream && videoRef.current.srcObject !== stream) {
            videoRef.current.srcObject = stream;
        }
    }, [pipParticipant?.videoStream]);

    // Drag state
    const containerRef = React.useRef<HTMLDivElement>(null);
    const dragState = React.useRef({ isDragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0, moved: false });
    const [pos, setPos] = React.useState({ x: 16, y: 64 }); // default top-left

    React.useEffect(() => {
        if (!isMobile) {
            setPos({ x: window.innerWidth - PIP_W - 24, y: window.innerHeight - PIP_H - 24 });
        }
    }, [isMobile, PIP_W, PIP_H]);

    const clamp = (x: number, y: number) => ({
        x: Math.max(4, Math.min(x, window.innerWidth - PIP_W - 4)),
        y: Math.max(4, Math.min(y, window.innerHeight - PIP_H - 4)),
    });

    const handlePointerDown = (e: React.PointerEvent) => {
        dragState.current = { isDragging: true, startX: e.clientX - pos.x, startY: e.clientY - pos.y, offsetX: pos.x, offsetY: pos.y, moved: false };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!dragState.current.isDragging) return;
        const rawX = e.clientX - dragState.current.startX;
        const rawY = e.clientY - dragState.current.startY;
        if (Math.abs(rawX - dragState.current.offsetX) > 4 || Math.abs(rawY - dragState.current.offsetY) > 4) {
            dragState.current.moved = true;
        }
        setPos(clamp(rawX, rawY));
    };

    const handlePointerUp = () => {
        const wasDragged = dragState.current.moved;
        dragState.current.isDragging = false;
        dragState.current.moved = false;
        if (!wasDragged) {
            // Tap without drag: exit fullscreen profile back to drawer (not close entirely)
            setShowFullscreen(false);
        }
    };

    if (!pipParticipant) return null;

    return (
        <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ left: pos.x, top: pos.y, touchAction: 'none' }}
            className={`fixed z-60 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border-2 border-white/10 cursor-grab active:cursor-grabbing select-none ${isMobile ? 'w-28 h-44' : 'w-[240px] h-[360px]'}`}
        >
            {hasVideo(pipParticipant) ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-full w-full object-cover pointer-events-none"
                />
            ) : (
                <div className="h-full w-full bg-neutral-900 flex items-center justify-center">
                    <span className="text-white/60 text-xs">No video</span>
                </div>
            )}
            {/* LIVE badge */}
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 px-2 py-0.5 rounded-full pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase">Live</span>
            </div>
        </div>
    );
};

// Inner component that has access to useCallStateHooks
const LiveStreamInner: React.FC<{
    children: React.ReactNode;
    isViewer: boolean;
    isGuest: boolean;
    call: Call;
    isChatVisible: boolean;
    setChatVisible: (visible: boolean) => void;
    isGiftingOpen: boolean;
    setIsGiftingOpen: (open: boolean) => void;
    streamEnded: boolean;
    setStreamEnded: (ended: boolean) => void;
}> = ({ children, isViewer, isGuest, call, isChatVisible, setChatVisible, isGiftingOpen, setIsGiftingOpen, streamEnded, setStreamEnded }) => {
    const { showFullscreen } = useUserProfileStore();
    const showPiP = showFullscreen;

    // Lock body scroll while live stream is active (prevents mobile scroll that hides navbar)
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (

        <LiveStreamContext.Provider value={{ isViewer, isGuest, call, isChatVisible, setChatVisible, isGiftingOpen, setIsGiftingOpen, streamEnded, setStreamEnded }}>
            <div className="fixed inset-0 pt-18 w-full bg-[#0f1117] text-white overflow-hidden flex flex-col" data-viewer={isViewer}>
                <div className="flex-1 min-h-0 relative">
                    {children}
                </div>
                {showPiP && <FloatingPiP />}
                <UserProfileModal />
            </div>
        </LiveStreamContext.Provider>
    );
};

export const LiveStreamLayout: React.FC<LiveStreamLayoutProps> = ({ children, callId: viewerCallId }) => {
    const { streamData } = useGoLiveStore();
    const { user } = useAuthStore();
    const userRef = useRef(user);
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [chatClient, setChatClient] = useState<StreamChat | null>(null);
    const [call, setCall] = useState<Call | null>(null);
    const [isViewer, setIsViewer] = useState(false);
    const [isChatVisible, setChatVisible] = useState(true);
    const [isGiftingOpen, setIsGiftingOpen] = useState(false);
    const [streamEnded, setStreamEnded] = useState(false);
    const navigate = useNavigate();
    const isTerminatingRef = useRef(false);
    const [initError, setInitError] = useState<string | null>(null);

    useEffect(() => {
        const handleBeforeUnload = () => {
            isTerminatingRef.current = true;
            localStorage.removeItem('pulse_host_is_currently_live');
            localStorage.setItem('pulse_host_left_at', String(Date.now()));
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    useEffect(() => {
        userRef.current = user;
        if (!!streamData) {
            useGoLiveStore.setState({ isRejoinBannerDismissed: false });
            // If we are currently live, we shouldn't have a 'left_at' timestamp
            // unless we just resumed.
            const leftAt = localStorage.getItem('pulse_host_left_at');
            if (!leftAt) {
                localStorage.removeItem('pulse_host_left_at');
            }
        }
    }, [user, !!streamData]);

    // Handle Sleep/Wake detection for Host
    useEffect(() => {
        if (!streamData) return;

        const checkInterruption = async () => {
            const leftAt = localStorage.getItem('pulse_host_left_at');
            if (!leftAt) return;

            const timeAway = Date.now() - Number(leftAt);
            // If away for more than 10 seconds, trigger rejoin flow
            if (timeAway > 10000) {
                try {
                    const status = await userService.getUserStream();
                    if (status.isLive && status.callId === streamData.callId) {
                        useGoLiveStore.getState().openRejoinSetup(status);
                    }
                } catch (err) {
                    console.error("Failed to check stream status on wake:", err);
                    // If backend check fails due to network, we'll try again on next visibility change
                    // but we don't want to block the user forever.
                }
            } else {
                // Short interruption, just clear it
                localStorage.removeItem('pulse_host_left_at');
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                localStorage.setItem('pulse_host_left_at', String(Date.now()));
            } else {
                checkInterruption();
            }
        };

        // Initial check on mount (handles page reload/wake that causes re-mount)
        checkInterruption();

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [streamData]);

    useEffect(() => {
        const isHostMode = !!streamData;
        const isViewerMode = !streamData && !!viewerCallId;

        if (!isHostMode && !isViewerMode) return;
        setStreamEnded(false);

        let mounted = true;
        let _client: StreamVideoClient | null = null;
        let _chatClient: StreamChat | null = null;
        let _call: Call | null = null;
        let _callId: string | null = null;
        let _isHost = false;

        // Reset the terminating flag each time the effect runs (new stream session)
        isTerminatingRef.current = false;

        const initCall = async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (!mounted) return;

            let callType: string;
            let callIdToUse: string;
            let token: string | undefined;

            if (isHostMode && streamData) {
                // Host mode - use existing stream data
                callType = streamData.callType;
                callIdToUse = streamData.callId;
                token = streamData.token;
                _isHost = true;
                _callId = streamData.callId;
                setIsViewer(false);

                localStorage.setItem('pulse_host_is_currently_live', 'true');
            } else if (isViewerMode && viewerCallId) {
                // Viewer mode - join the stream
                try {
                    // Use guest join for unauthenticated users
                    if (userRef.current) {
                        const joinResponse = await liveService.joinStream(viewerCallId);

                        // Guard against component unmount during the async joinStream call
                        if (!mounted) return;

                        callType = joinResponse.callType;
                        callIdToUse = joinResponse.callId;
                        token = joinResponse.token;
                    } else {
                        callType = 'livestream';
                        callIdToUse = viewerCallId;
                        token = undefined;
                    }
                    _callId = callIdToUse;
                    setIsViewer(true);
                } catch (error) {
                    console.error('Failed to join stream:', error);
                    toast.error('Stream ended or blocked for current user');
                    navigate({ to: '/for-you' });
                    return;
                }
            } else {
                return;
            }

            const currentUser = userRef.current;
            const userData = currentUser ? {
                id: String(currentUser.id),
                name: currentUser.username || `User ${currentUser.id}`,
                image: currentUser.profileImage,
            } : {
                type: 'anonymous'
            };

            // Initialize Video Client
            _client = StreamVideoClient.getOrCreateInstance({
                apiKey,
                user: userData as any,
                tokenProvider: token ? async () => token : undefined,
            });
            _call = _client.call(callType, callIdToUse);

            // Initialize Chat Client
            _chatClient = StreamChat.getInstance(apiKey);
            let chatConnected = false;
            try {
                const targetUserId = currentUser ? String(currentUser.id) : null;
                const currentUserId = _chatClient.userID;

                // If already connected to a DIFFERENT user, disconnect first
                if (currentUserId && currentUserId !== targetUserId) {
                    console.log('[LiveStreamLayout] Disconnecting previous chat user:', currentUserId);
                    await _chatClient.disconnectUser();
                }

                // If NOT connected, connect now
                if (!_chatClient.userID) {
                    if (!currentUser) {
                        console.log('[LiveStreamLayout] Connecting anonymous chat user');
                        await _chatClient.connectAnonymousUser();
                    } else {
                        console.log('[LiveStreamLayout] Connecting chat user:', targetUserId);
                        await _chatClient.connectUser(userData as any, token);
                    }
                }

                chatConnected = true;
                // Guard against unmount during chat connection
                if (!mounted) return;
            } catch (err) {
                console.error('Failed to connect chat user:', err);
            }

            try {
                await _call.join({ create: isHostMode });

                if (!mounted) return;

                if (isViewerMode && _call) {
                    const streamerName = _call.state.createdBy?.name || _call.state.createdBy?.id || 'Streamer';
                    useViewerRejoinStore.getState().setRejoinData({
                        callId: callIdToUse,
                        streamerName: streamerName,
                    });
                }

                // Restriction: Prevent creator from joining their own stream as a viewer
                if (isViewerMode && userRef.current && _call.state.createdBy?.id === String(userRef.current.id)) {
                    // Clean up before redirecting
                    await _call.leave();
                    _client?.disconnectUser();
                    if (_chatClient) await _chatClient.disconnectUser();
                    toast.error('Cannot join your own livestream as a viewer with same account!');
                    navigate({ to: '/for-you' });
                    return;
                }

                // Guest viewers can watch freely - login modal will appear on interaction

                // Only configure camera/mic for hosts
                if (isHostMode) {
                    const { isCameraEnabled, isMicEnabled } = useGoLiveStore.getState();

                    try {
                        if (isCameraEnabled) {
                            await _call.camera.enable();
                        } else {
                            // Standard disable. Avoid forceStop: true during initialization
                            // to prevent the SDK state from getting stuck.
                            await _call.camera.disable();
                        }
                    } catch (e) {
                        console.error("Failed to set initial camera state:", e);
                        toast.error("Could not access camera. Please check permissions.");
                    }

                    if (!mounted) return;

                    try {
                        if (isMicEnabled) {
                            await _call.microphone.enable();
                        } else {
                            await _call.microphone.disable({ forceStop: true } as any);
                            // Disable background speech detection and clean up detectors
                            _call.microphone.disableSpeakingWhileMutedNotification().catch(() => { });
                            try {
                                const mic = _call.microphone as any;
                                if (typeof mic.noAudioDetectorCleanup === 'function') mic.noAudioDetectorCleanup();
                                if (typeof mic.soundDetectorCleanup === 'function') mic.soundDetectorCleanup();
                            } catch (e) { }
                        }
                    } catch (e) {
                        console.error("Failed to set initial mic state:", e);
                        toast.error("Could not access microphone. Please check permissions.");
                    }

                    if (!mounted) return;

                    try {
                        // Refresh the call state from the server to see if it's already live
                        await _call.get();
                        const state = _call.state;

                        const { isRejoining } = useGoLiveStore.getState();
                        const leftAt = localStorage.getItem('pulse_host_left_at');

                        // CRITICAL: Skip auto goLive if:
                        // 1. We are in the middle of a Rejoin UI flow
                        // 2. We just returned from a sleep/interruption (leftAt exists)
                        // 3. The server already says the call is started
                        const alreadyStarted = !!state.startedAt;

                        if (isRejoining || leftAt || alreadyStarted) {
                            console.log("[LiveStreamLayout] Skipping auto goLive()", { isRejoining, hasLeftAt: !!leftAt, alreadyStarted });
                            if (alreadyStarted && !isRejoining && !leftAt) {
                                toast.info("Resuming your active stream...");
                            }
                        } else {
                            if (!state.backstage && !state.startedAt) {
                                await _call.goLive();
                            } else if (state.backstage) {
                                await _call.goLive();
                            }
                            toast.success("Your stream is now live and visible to viewers!");
                        }

                        // Start recording AFTER successful join and goLive
                        // if (_callId) {
                        //     liveService.startRecording(_callId).catch(err => {
                        //         console.error("Failed to start recording:", err);
                        //     });
                        // }
                    } catch (e) {
                        console.error("Failed to verify/start goLive:", e);
                    }
                } else {
                    // Viewers shouldn't have camera/mic enabled by default
                    try {
                        await _call.camera.disable();
                        await _call.microphone.disable();
                    } catch (e) {
                        console.error(" Viewer Error: Failed to disable camera/microphone for viewer");
                    }
                }

            } catch (err) {
                console.error('Failed to join call:', err);
                setInitError('Failed to connect to the live session. Please check your internet connection.');
                toast.error('Failed to join live session');
            }

            if (mounted) {
                setClient(_client);
                // Set the chat client even if connection failed/is pending to avoid crashing the Chat provider
                if (_chatClient) setChatClient(_chatClient);
                setCall(_call);
            }
        };

        initCall();

        return () => {
            mounted = false;

            if (_call) {
                // Block any new getUserMedia calls during teardown so the SDK
                // cannot re-acquire the mic for internal detection loops.
                (window as any).pulseBlockMedia = true;

                teardownCallMedia(_call).catch(e => console.warn("Layout cleanup: teardown failed", e));

                if (!(_isHost && isTerminatingRef.current)) {
                    _call.leave().catch(() => { });
                }

                // Restore getUserMedia after a safe window (SDK teardown completes)
                setTimeout(() => { (window as any).pulseBlockMedia = false; }, 3000);
            }
            if (_client) {
                _client.disconnectUser().catch(() => { });
            }
            if (_chatClient) {
                _chatClient.disconnectUser().catch(() => { });
            }

            if (_isHost && _callId) {
                localStorage.removeItem('pulse_host_is_currently_live');

                if (!isTerminatingRef.current) {
                    localStorage.removeItem('pulse_host_left_at');
                }

                if (!isTerminatingRef.current) {
                    // const { isEndingStream } = useGoLiveStore.getState();

                    // if (!isEndingStream) {
                    //     liveService.endLiveStream(_callId, false).catch((err) => {
                    //         console.error('Failed to end live stream on navigate away:', err);
                    //     });
                    // }

                    // // Always reset the store when actually navigating away
                    useGoLiveStore.getState().reset();
                }
            }

            if (!_isHost) {
                useViewerRejoinStore.getState().clearRejoinData();
            }

            setClient(null);
            setChatClient(null);
            setCall(null);
        };
    }, [streamData, viewerCallId, user?.id]);



    const { isRejoining } = useGoLiveStore();

    if (initError && !client) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0f1117] z-50 p-6 text-center">
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md">
                    <p className="text-red-500 mb-6">{initError}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-[#FF8800] text-white rounded-xl font-semibold hover:bg-[#FF9911] transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    // If we don't have essential data yet, show the loader.
    // Exception: If we are currently in the 'rejoining' state (Rejoin Modal is open),
    // we return a blank background instead of the loader to avoid z-index conflicts
    // and let the Rejoin UI be the primary focus.
    if (!client || !call || !chatClient) {
        if (isRejoining) {
            return <div className="fixed inset-0 bg-[#0f1117] z-40" />;
        }
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#0f1117] z-40 overflow-hidden">
                <Loader2 className="h-10 w-10 animate-spin text-[#FF8800]" />
            </div>
        );
    }

    return (
        <StreamVideo client={client}>
            <Chat client={chatClient}>
                <StreamCall call={call}>
                    <LiveStreamInner
                        isViewer={isViewer}
                        isGuest={!user}
                        call={call}
                        isChatVisible={isChatVisible}
                        setChatVisible={setChatVisible}
                        isGiftingOpen={isGiftingOpen}
                        setIsGiftingOpen={setIsGiftingOpen}
                        streamEnded={streamEnded}
                        setStreamEnded={setStreamEnded}
                    >
                        {children}
                        <FloatingHearts />
                    </LiveStreamInner>
                </StreamCall>
            </Chat>
        </StreamVideo>
    );
};

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
import { FloatingHearts } from '@/features/live/components/overlay/FloatingHearts';

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

    // PiP dimensions (w-28 = 112px, h-44 = 176px)
    const PIP_W = 112;
    const PIP_H = 176;

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
    const [pos, setPos] = React.useState({ x: 16, y: 64 }); // default top-left (left:16, top:64)

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
            className="fixed z-60 w-28 h-44 rounded-2xl overflow-hidden shadow-2xl shadow-black/60 border-2 border-white/10 cursor-grab active:cursor-grabbing select-none"
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
    const isMobile = useIsMobile();
    const showPiP = isMobile && showFullscreen;

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
    const isMobile = useIsMobile();
    const isTerminatingRef = useRef(false);
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
            localStorage.removeItem('pulse_host_left_at');
        }
    }, [user, !!streamData]);

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
            try {
                if (!currentUser) {
                    await _chatClient.connectAnonymousUser();
                } else {
                    await _chatClient.connectUser(userData as any, token);
                }

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
                            await _call.microphone.disable();
                        }
                    } catch (e) {
                        console.error("Failed to set initial mic state:", e);
                        toast.error("Could not access microphone. Please check permissions.");
                    }

                    if (!mounted) return;

                    try {
                        const state = _call.state;
                        if (!state.backstage && !state.startedAt) {
                            await _call.goLive();
                        } else if (state.backstage) {
                            await _call.goLive();
                        }
                        toast.success("Your stream is now live and visible to viewers!");

                        // Start recording AFTER successful join and goLive
                        if (_callId) {
                            liveService.startRecording(_callId).catch(err => {
                                console.error("Failed to start recording:", err);
                            });
                        }
                    } catch (e) {
                        console.error("Failed to go live:", e);
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
                toast.error('Failed to join live session');
            }

            if (mounted) {
                setClient(_client);
                setChatClient(_chatClient);
                setCall(_call);
            }
        };

        initCall();

        return () => {
            mounted = false;

            if (_call) {
                // Explicitly stop hardware tracks to ensure light goes off immediately
                const local = _call.state.localParticipant;
                if (local) {
                    local.videoStream?.getTracks().forEach(track => track.stop());
                    local.audioStream?.getTracks().forEach(track => track.stop());
                }

                _call.camera.disable();
                _call.microphone.disable();

                if (!(_isHost && isTerminatingRef.current)) {
                    _call.leave();
                }
            }
            if (_client) {
                _client.disconnectUser();
            }
            if (_chatClient) {
                _chatClient.disconnectUser();
            }

            if (_isHost && _callId) {
                localStorage.removeItem('pulse_host_is_currently_live');

                if (!isTerminatingRef.current) {
                    localStorage.removeItem('pulse_host_left_at');
                }

                if (!isTerminatingRef.current) {
                    const { isEndingStream } = useGoLiveStore.getState();

                    if (!isEndingStream) {
                        liveService.endLiveStream(_callId, false).catch((err) => {
                            console.error('Failed to end live stream on navigate away:', err);
                        });
                    }

                    // Always reset the store when actually navigating away
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



    if (!client || !call || !chatClient) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-[#0f1117] z-[10000] overflow-hidden">
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

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
import { useGoLiveStore } from '../stores/goLiveStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { liveService } from '../services/live.service';
import { FloatingHearts } from './FloatingHearts';

const apiKey = import.meta.env.VITE_STREAM_API_KEY || 'placeholder_key';

import { UserProfileModal } from './UserProfileModal';
import { useUserProfileStore } from '../stores/userProfileStore';
import { useIsMobile } from '@/hooks/use-mobile';

// Context for sharing viewer state with child components
interface LiveStreamContextValue {
    isViewer: boolean;
    isGuest: boolean;
    call: Call | null;
    isChatVisible: boolean;
    setChatVisible: (visible: boolean) => void;
}

const LiveStreamContext = createContext<LiveStreamContextValue>({
    isViewer: false,
    isGuest: false,
    call: null,
    isChatVisible: true,
    setChatVisible: () => { },
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
}> = ({ children, isViewer, isGuest, call, isChatVisible, setChatVisible }) => {
    const { showFullscreen } = useUserProfileStore();
    const isMobile = useIsMobile();
    const showPiP = isMobile && showFullscreen;

    // Participant sync is now handled in LiveStreamChat.tsx 25 seconds after the stream starts

    return (

        <LiveStreamContext.Provider value={{ isViewer, isGuest, call, isChatVisible, setChatVisible }}>
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
    const navigate = useNavigate();

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        // Determine if user is a host (has streamData) or viewer (has viewerCallId but no streamData)
        const isHostMode = !!streamData;
        const isViewerMode = !streamData && !!viewerCallId;

        if (!isHostMode && !isViewerMode) return;

        let mounted = true;
        let _client: StreamVideoClient | null = null;
        let _chatClient: StreamChat | null = null;
        let _call: Call | null = null;
        let _callId: string | null = null;
        let _isHost = false;
        let _isReloading = false;

        const initCall = async () => {
            // Wait for hardware to release from GoLiveModal
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (!mounted) return;

            let callType: string;
            let callIdToUse: string;
            let token: string;

            if (isHostMode && streamData) {
                // Host mode - use existing stream data
                callType = streamData.callType;
                callIdToUse = streamData.callId;
                token = streamData.token;
                _isHost = true;
                _callId = streamData.callId;
                setIsViewer(false);
            } else if (isViewerMode && viewerCallId) {
                // Viewer mode - join the stream
                try {
                    // Use guest join for unauthenticated users
                    if (userRef.current) {
                        const joinResponse = await liveService.joinStream(viewerCallId);
                        callType = joinResponse.callType;
                        callIdToUse = joinResponse.callId;
                        token = joinResponse.token;
                    } else {
                        // Anonymous join without backend endpoint
                        callType = 'livestream';
                        callIdToUse = viewerCallId;
                        token = undefined as any;
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
            } catch (err) {
                console.error('Failed to connect chat user:', err);
            }

            try {
                // For viewers, just join without create permission
                await _call.join({ create: isHostMode });

                if (!mounted) return;

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

        // Warn user before closing/refreshing the tab during a live stream
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            _isReloading = true;
            e.preventDefault();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        initCall();

        return () => {
            mounted = false;
            window.removeEventListener('beforeunload', handleBeforeUnload);

            if (_call) {
                // Explicitly stop hardware tracks to ensure light goes off immediately
                const local = _call.state.localParticipant;
                if (local) {
                    local.videoStream?.getTracks().forEach(track => track.stop());
                    local.audioStream?.getTracks().forEach(track => track.stop());
                }

                _call.camera.disable();
                _call.microphone.disable();
                _call.leave();
            }
            if (_client) {
                _client.disconnectUser();
            }
            if (_chatClient) {
                _chatClient.disconnectUser();
            }

            // If host, end the stream on the backend if not already ending
            // Logic:
            // 1. If isEndingStream is true, the header already called the API. We just need to reset.
            // 2. If isEndingStream is false and NOT a page reload, user navigated away. End the stream.
            // 3. If page is reloading (_isReloading), skip ending so host can rejoin.
            if (_isHost && _callId) {
                // If page is reloading, skip ending stream so host can rejoin
                if (_isReloading) return;

                const { isEndingStream } = useGoLiveStore.getState();

                if (!isEndingStream) {
                    liveService.endLiveStream(_callId).catch((err) => {
                        console.error('Failed to end live stream on navigate away:', err);
                    });
                }

                // Always reset the store when actually navigating away
                useGoLiveStore.getState().reset();
            }

            setClient(null);
            setChatClient(null);
            setCall(null);
        };
    }, [streamData, viewerCallId, user?.id]);



    if (!client || !call || !chatClient) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0f1117]">
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
                    >
                        {children}
                        <FloatingHearts />
                    </LiveStreamInner>
                </StreamCall>
            </Chat>
        </StreamVideo>
    );
};


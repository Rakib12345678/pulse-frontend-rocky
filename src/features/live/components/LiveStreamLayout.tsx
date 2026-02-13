import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    StreamVideo,
    StreamVideoClient,
    Call,
    StreamCall,
} from '@stream-io/video-react-sdk';
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useGoLiveStore } from '../stores/goLiveStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { liveService } from '../services/live.service';
import { FloatingHearts } from './FloatingHearts';

const apiKey = import.meta.env.VITE_STREAM_API_KEY || 'placeholder_key';

import { UserProfileModal } from './UserProfileModal';

// Context for sharing viewer state with child components
interface LiveStreamContextValue {
    isViewer: boolean;
    call: Call | null;
    isChatVisible: boolean;
    setChatVisible: (visible: boolean) => void;
}

const LiveStreamContext = createContext<LiveStreamContextValue>({
    isViewer: false,
    call: null,
    isChatVisible: true,
    setChatVisible: () => { },
});

export const useLiveStreamContext = () => useContext(LiveStreamContext);

interface LiveStreamLayoutProps {
    children: React.ReactNode;
    callId?: string;
}

// Inner component that has access to useCallStateHooks
const LiveStreamInner: React.FC<{
    children: React.ReactNode;
    isViewer: boolean;
    call: Call;
    isChatVisible: boolean;
    setChatVisible: (visible: boolean) => void;
}> = ({ children, isViewer, call, isChatVisible, setChatVisible }) => {
    return (
        <LiveStreamContext.Provider value={{ isViewer, call, isChatVisible, setChatVisible }}>
            <div className="relative h-screen w-full bg-[#0f1117] text-white overflow-hidden" data-viewer={isViewer}>
                {children}
                <UserProfileModal />
            </div>
        </LiveStreamContext.Provider>
    );
};

export const LiveStreamLayout: React.FC<LiveStreamLayoutProps> = ({ children, callId: viewerCallId }) => {
    const { streamData } = useGoLiveStore();
    const { user } = useAuthStore();
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [chatClient, setChatClient] = useState<StreamChat | null>(null);
    const [call, setCall] = useState<Call | null>(null);
    const [isViewer, setIsViewer] = useState(false);
    const [isChatVisible, setChatVisible] = useState(true);

    useEffect(() => {
        // Determine if user is a host (has streamData) or viewer (has viewerCallId but no streamData)
        const isHostMode = !!streamData;
        const isViewerMode = !streamData && !!viewerCallId;

        if (!user || (!isHostMode && !isViewerMode)) return;

        let mounted = true;
        let _client: StreamVideoClient | null = null;
        let _chatClient: StreamChat | null = null;
        let _call: Call | null = null;
        let _callId: string | null = null;
        let _isHost = false;

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
                    const joinResponse = await liveService.joinStream(viewerCallId);
                    callType = joinResponse.callType;
                    callIdToUse = joinResponse.callId;
                    token = joinResponse.token;
                    _callId = joinResponse.callId;
                    setIsViewer(true);
                } catch (error) {
                    console.error('Failed to join stream:', error);
                    toast.error('Failed to join the stream');
                    return;
                }
            } else {
                return;
            }

            const userData = {
                id: String(user.id),
                name: user.username || `User ${user.id}`,
                image: user.profileImage,
            };

            // Initialize Video Client
            _client = StreamVideoClient.getOrCreateInstance({
                apiKey,
                user: userData,
                tokenProvider: async () => token,
            });
            _call = _client.call(callType, callIdToUse);

            // Initialize Chat Client
            _chatClient = StreamChat.getInstance(apiKey);
            try {
                await _chatClient.connectUser(userData, token);
            } catch (err) {
                console.error('Failed to connect chat user:', err);
                // We don't want to block the video if chat fails, but maybe log it
            }

            try {
                // For viewers, just join without create permission
                await _call.join({ create: isHostMode });

                if (!mounted) return;

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
            e.preventDefault();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        initCall();

        return () => {
            mounted = false;
            window.removeEventListener('beforeunload', handleBeforeUnload);

            if (_call) {
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
            // 2. If isEndingStream is false, user navigated away/closed tab. We need to call the API.
            if (_isHost && _callId) {
                const { isEndingStream } = useGoLiveStore.getState();

                if (!isEndingStream) {
                    liveService.endLiveStream(_callId).catch((err) => {
                        console.error('Failed to end live stream on navigate away:', err);
                    });
                }

                // Always reset the store when the component unmounts for a host
                useGoLiveStore.getState().reset();
            }

            setClient(null);
            setChatClient(null);
            setCall(null);
        };
    }, [streamData, user, viewerCallId]);

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


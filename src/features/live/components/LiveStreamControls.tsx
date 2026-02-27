import React, { useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { cn } from '@/lib/utils';
import { useLiveStreamContext } from './LiveStreamLayout';
import { useIsMobile } from '@/hooks/use-mobile';

interface LiveStreamControlsProps {
    isViewer?: boolean;
}

export const LiveStreamControls: React.FC<LiveStreamControlsProps> = ({
    isViewer = false,
}) => {
    const { useCameraState, useMicrophoneState } = useCallStateHooks();
    const { camera, isMute: isCameraMuted } = useCameraState();
    const { microphone, isMute: isMicMuted } = useMicrophoneState();
    const { call } = useLiveStreamContext();
    const [isMuted, setIsMuted] = useState(false);
    const isMobile = useIsMobile();

    const toggleCamera = async () => {
        try {
            await camera.toggle();
        } catch (error) {
            console.error('Failed to toggle camera:', error);
        }
    };

    const toggleMicrophone = async () => {
        try {
            await microphone.toggle();
        } catch (error) {
            console.error('Failed to toggle microphone:', error);
        }
    };

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

    // Viewer controls - positioned at bottom right
    if (isViewer) {
        if (isMobile) return null; // Hidden on mobile — overlaps with Join Stream button
        return (
            <>
                {/* Volume toggle - bottom right (desktop only) */}
                <div className="absolute bottom-10 right-6 flex items-center gap-3 z-20">
                    <button
                        onClick={toggleMute}
                        className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                            "backdrop-blur-md border",
                            isMuted
                                ? "bg-red-500 border-red-400/50 text-white hover:bg-red-600"
                                : "bg-white/10 border-white/10 hover:bg-white/20"
                        )}
                        title={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? (
                            <VolumeX className="w-5 h-5 text-white" />
                        ) : (
                            <Volume2 className="w-5 h-5 text-white/70" />
                        )}
                    </button>
                </div>
            </>
        );
    }

    // Host controls on mobile: top-right (matching Figma - sits in header area)
    if (isMobile) {
        return (
            <div className="absolute top-3 right-4 flex gap-2 z-20">
                <button
                    onClick={toggleMicrophone}
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md border",
                        !isMicMuted
                            ? "bg-white/10 border-white/10 text-white hover:bg-white/20"
                            : "bg-red-500 border-red-400/50 text-white hover:bg-red-600"
                    )}
                >
                    {!isMicMuted ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                    onClick={toggleCamera}
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md border",
                        !isCameraMuted
                            ? "bg-white/10 border-white/10 text-white hover:bg-white/20"
                            : "bg-red-500 border-red-400/50 text-white hover:bg-red-600"
                    )}
                >
                    {!isCameraMuted ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                </button>
            </div>
        );
    }

    // Host controls on desktop: centered at bottom
    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 z-20">
            <button
                onClick={toggleCamera}
                className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md border",
                    !isCameraMuted
                        ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                        : "bg-red-500 border-red-400/50 text-white hover:bg-red-600 ring-4 ring-red-500/10"
                )}
            >
                {!isCameraMuted ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
            </button>

            <button
                onClick={toggleMicrophone}
                className={cn(
                    "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md border",
                    !isMicMuted
                        ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                        : "bg-red-500 border-red-400/50 text-white hover:bg-red-600 ring-4 ring-red-500/10"
                )}
            >
                {!isMicMuted ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>
        </div>
    );
};

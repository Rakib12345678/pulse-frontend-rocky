import React, { useState } from 'react';
import { Camera, CameraOff, Mic, MicOff, Volume2, VolumeX, ArrowLeft, Users } from 'lucide-react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { cn } from '@/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { useLiveStreamContext } from './LiveStreamLayout';

interface LiveStreamControlsProps {
    isViewer?: boolean;
}

export const LiveStreamControls: React.FC<LiveStreamControlsProps> = ({
    isViewer = false,
}) => {
    const { useCameraState, useMicrophoneState, useParticipantCount } = useCallStateHooks();
    const { camera, isMute: isCameraMuted } = useCameraState();
    const { microphone, isMute: isMicMuted } = useMicrophoneState();
    const participantCount = useParticipantCount();
    const { call } = useLiveStreamContext();
    const navigate = useNavigate();
    const [isMuted, setIsMuted] = useState(false);

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

    const handleExitStream = async () => {
        try {
            if (call) {
                await call.camera.disable();
                await call.microphone.disable();
                await call.leave();
            }
            navigate({ to: '/for-you' });
        } catch (error) {
            console.error('Failed to leave stream:', error);
            navigate({ to: '/for-you' });
        }
    };

    const toggleMute = () => {
        if (call) {
            // Toggle mute state for all remote audio
            const newMutedState = !isMuted;
            setIsMuted(newMutedState);

            // Mute/unmute all remote audio tracks
            call.state.remoteParticipants.forEach((participant) => {
                participant.audioStream?.getAudioTracks().forEach((track) => {
                    track.enabled = !newMutedState;
                });
            });
        }
    };

    // Viewer controls - positioned at bottom right
    if (isViewer) {
        return (
            <>
                {/* Back button and viewer count - top left */}
                <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
                    <button
                        onClick={handleExitStream}
                        className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                            "bg-white/10 backdrop-blur-md border border-white/10",
                            "hover:bg-white/20"
                        )}
                        title="Exit stream"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>

                    {/* Viewer count badge */}
                    <div className="flex items-center gap-2 bg-[#FF8800] px-4 py-2 rounded-full">
                        <Users className="w-4 h-4 text-black" />
                        <span className="text-sm font-bold text-black">
                            {participantCount >= 1000 ? `${(participantCount / 1000).toFixed(1)}k` : participantCount}
                        </span>
                    </div>
                </div>

                {/* Volume toggle - bottom right */}
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

    // Host controls - centered at bottom
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

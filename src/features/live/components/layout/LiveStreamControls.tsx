import React from 'react';
import { Camera, CameraOff, Mic, MicOff } from 'lucide-react';
import { useCallStateHooks, OwnCapability } from '@stream-io/video-react-sdk';
import { cn } from '@/lib/utils';

import { useIsMobile } from '@/hooks/use-mobile';

interface LiveStreamControlsProps {
    isViewer?: boolean;
}

export const LiveStreamControls: React.FC<LiveStreamControlsProps> = ({
    isViewer = false,
}) => {
    const { useCameraState, useMicrophoneState, useHasPermissions } = useCallStateHooks();
    const { camera, status: cameraStatus } = useCameraState();
    const { microphone, status: micStatus } = useMicrophoneState();

    const isCameraMuted = cameraStatus !== 'enabled';
    const isMicMuted = micStatus !== 'enabled';

    // Check if local participant has been granted send permissions
    const canSendAudio = useHasPermissions(OwnCapability.SEND_AUDIO);
    const canSendVideo = useHasPermissions(OwnCapability.SEND_VIDEO);


    const isMobile = useIsMobile();

    // A viewer who has been granted publish permissions is a co-host.
    const isCoHost = isViewer && (canSendAudio || canSendVideo);


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



    // Co-host: viewer with publish permissions
    if (isCoHost) {
        if (isMobile) {
            // Mobile co-host: mic + cam shifted left to be in a row with the header '...' menu
            return (
                <div className="absolute top-5 right-[64px] flex flex-row gap-2 z-20">
                    <button
                        onClick={toggleMicrophone}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md border shadow-lg",
                            !isMicMuted
                                ? "bg-white/10 border-white/10 text-white hover:bg-white/20"
                                : "bg-[#FF0000] border-red-500 text-white hover:bg-[#EE0000] shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                        )}
                        title={isMicMuted ? "Unmute mic" : "Mute mic"}
                    >
                        {!isMicMuted ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={toggleCamera}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md border shadow-lg",
                            !isCameraMuted
                                ? "bg-white/10 border-white/10 text-white hover:bg-white/20"
                                : "bg-[#FF0000] border-red-500 text-white hover:bg-[#EE0000] shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                        )}
                        title={isCameraMuted ? "Start camera" : "Stop camera"}
                    >
                        {!isCameraMuted ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                    </button>
                </div>
            );
        }

        // Desktop co-host: mic + cam centered at bottom
        return (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 z-20">
                <button
                    onClick={toggleCamera}
                    className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md border",
                        !isCameraMuted
                            ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                            : "bg-[#FF0000] border-red-500 text-white hover:bg-[#EE0000] ring-4 ring-red-500/10 shadow-[0_0_20px_rgba(255,0,0,0.4)]"
                    )}
                    title={isCameraMuted ? "Start camera" : "Stop camera"}
                >
                    {!isCameraMuted ? <Camera className="w-6 h-6" /> : <CameraOff className="w-6 h-6" />}
                </button>

                <button
                    onClick={toggleMicrophone}
                    className={cn(
                        "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-md border",
                        !isMicMuted
                            ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                            : "bg-[#FF0000] border-red-500 text-white hover:bg-[#EE0000] ring-4 ring-red-500/10 shadow-[0_0_20px_rgba(255,0,0,0.4)]"
                    )}
                    title={isMicMuted ? "Unmute mic" : "Mute mic"}
                >
                    {!isMicMuted ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </button>
            </div>
        );
    }

    // Viewer: no controls here — volume toggle lives in ViewerBottomBar (LiveStreamChat)
    if (isViewer) {
        return null;
    }

    // Host: mic + cam controls
    if (isMobile) {
        return (
            <div className="absolute top-5 right-4 flex flex-row gap-2 z-20">
                <button
                    onClick={toggleMicrophone}
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md border shadow-lg",
                        !isMicMuted
                            ? "bg-white/10 border-white/10 text-white hover:bg-white/20"
                            : "bg-[#FF0000] border-red-500 text-white hover:bg-[#EE0000] shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                    )}
                >
                    {!isMicMuted ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                    onClick={toggleCamera}
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-md border shadow-lg",
                        !isCameraMuted
                            ? "bg-white/10 border-white/10 text-white hover:bg-white/20"
                            : "bg-[#FF0000] border-red-500 text-white hover:bg-[#EE0000] shadow-[0_0_15px_rgba(255,0,0,0.3)]"
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

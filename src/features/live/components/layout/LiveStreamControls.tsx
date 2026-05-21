import React from 'react';
import { Camera, CameraOff, Mic, MicOff } from 'lucide-react';
import { useCall, useCallStateHooks, OwnCapability } from '@stream-io/video-react-sdk';
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
    const call = useCall();

    const isCameraMuted = cameraStatus !== 'enabled';
    const isMicMuted = micStatus !== 'enabled';

    // Check if local participant has been granted send permissions
    const canSendAudio = useHasPermissions(OwnCapability.SEND_AUDIO);
    const canSendVideo = useHasPermissions(OwnCapability.SEND_VIDEO);

    // REACTIVE CLEANUP: Ensure tracks are stopped whenever the SDK reports them as disabled
    React.useEffect(() => {
        if (micStatus === 'disabled') {
            (window as any).activeMediaTracks?.forEach((t: MediaStreamTrack) => {
                if (t.kind === 'audio') try { t.stop(); } catch (e) { }
            });
        }
    }, [micStatus]);

    React.useEffect(() => {
        if (cameraStatus === 'disabled') {
            (window as any).activeMediaTracks?.forEach((t: MediaStreamTrack) => {
                if (t.kind === 'video') try { t.stop(); } catch (e) { }
            });
        }
    }, [cameraStatus]);

    // MEDIA GUARDIAN: Actively poll and kill "ghost" tracks during the first 10s of joining.
    // This prevents the SDK from re-acquiring media in the background during its initialization.
    React.useEffect(() => {
        const guardian = setInterval(() => {
            if ((window as any).activeMediaTracks) {
                (window as any).activeMediaTracks.forEach((t: MediaStreamTrack) => {
                    if (t.kind === 'audio' && micStatus === 'disabled') {
                        try { t.stop(); } catch (e) { }
                    }
                    if (t.kind === 'video' && cameraStatus === 'disabled') {
                        try { t.stop(); } catch (e) { }
                    }
                });
            }
        }, 1000);

        const timeout = setTimeout(() => clearInterval(guardian), 10000);
        return () => {
            clearInterval(guardian);
            clearTimeout(timeout);
        };
    }, [micStatus, cameraStatus]);


    const isMobile = useIsMobile();

    // A viewer who has been granted publish permissions is a co-host.
    const isCoHost = isViewer && (canSendAudio || canSendVideo);


    const toggleCamera = async () => {
        try {
            if (!isCameraMuted) {
                // Block new acquisitions during disable sequence
                (window as any).pulseBlockMedia = true;

                // Stop all local video tracks to force browser indicator off
                const local = call?.state.localParticipant;
                if (local && local.videoStream) {
                    local.videoStream.getTracks().forEach(t => t.stop());
                }

                await camera.disable({ forceStop: true } as any);

                // Restore after a window
                setTimeout(() => { (window as any).pulseBlockMedia = false; }, 2000);
            } else {
                await camera.enable();
            }
        } catch (error) {
            console.error('Failed to toggle camera:', error);
            (window as any).pulseBlockMedia = false;
        }
    };

    const toggleMicrophone = async () => {
        try {
            if (!isMicMuted) {
                // Block new acquisitions during disable sequence
                (window as any).pulseBlockMedia = true;

                // Important: disable background speech detection which keeps mic active
                await microphone.disableSpeakingWhileMutedNotification().catch(() => { });
                
                // Force cleanup of internal audio contexts/detectors that lock the microphone hardware
                try {
                    const mic = microphone as any;
                    if (typeof mic.noAudioDetectorCleanup === 'function') mic.noAudioDetectorCleanup();
                    if (typeof mic.soundDetectorCleanup === 'function') mic.soundDetectorCleanup();
                } catch (e) { console.warn("Failed to clean up audio detectors", e); }

                // Stop all local audio tracks to force browser indicator off
                const local = call?.state.localParticipant;
                if (local && local.audioStream) {
                    local.audioStream.getTracks().forEach(t => t.stop());
                }

                await microphone.disable({ forceStop: true } as any);

                // Restore after a window
                setTimeout(() => { (window as any).pulseBlockMedia = false; }, 2000);
            } else {
                await microphone.enable();
            }
        } catch (error) {
            console.error('Failed to toggle microphone:', error);
            (window as any).pulseBlockMedia = false;
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
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all border shadow-lg",
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
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all border shadow-lg",
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
            <div className="absolute bottom-[1vh] sm:bottom-[1.5vh] md:bottom-[2vh] left-1/2 -translate-x-1/2 flex gap-[2vw] z-20">
                <button
                    onClick={toggleCamera}
                    className={cn(
                        "w-[8vh] h-[8vh] max-w-[56px] max-h-[56px] min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-all shadow-xl border",
                        !isCameraMuted
                            ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                            : "bg-[#FF0000] border-red-500 text-white hover:bg-[#EE0000] ring-4 ring-red-500/10 shadow-[0_0_20px_rgba(255,0,0,0.4)]"
                    )}
                    title={isCameraMuted ? "Start camera" : "Stop camera"}
                >
                    {!isCameraMuted ? <Camera className="w-[3.5vh] h-[3.5vh] max-w-[24px] max-h-[24px]" /> : <CameraOff className="w-[3.5vh] h-[3.5vh] max-w-[24px] max-h-[24px]" />}
                </button>

                <button
                    onClick={toggleMicrophone}
                    className={cn(
                        "w-[8vh] h-[8vh] max-w-[56px] max-h-[56px] min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-all shadow-xl border",
                        !isMicMuted
                            ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                            : "bg-[#FF0000] border-red-500 text-white hover:bg-[#EE0000] ring-4 ring-red-500/10 shadow-[0_0_20px_rgba(255,0,0,0.4)]"
                    )}
                    title={isMicMuted ? "Unmute mic" : "Mute mic"}
                >
                    {!isMicMuted ? <Mic className="w-[3.5vh] h-[3.5vh] max-w-[24px] max-h-[24px]" /> : <MicOff className="w-[3.5vh] h-[3.5vh] max-w-[24px] max-h-[24px]" />}
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
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all border shadow-lg",
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
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all border shadow-lg",
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
        <div className="absolute bottom-[1vh] sm:bottom-[1.5vh] md:bottom-[2vh] left-1/2 -translate-x-1/2 flex gap-[2vw] z-20">
            <button
                onClick={toggleCamera}
                className={cn(
                    "w-[8vh] h-[8vh] max-w-[56px] max-h-[56px] min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-all shadow-xl border",
                    !isCameraMuted
                        ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                        : "bg-red-500 border-red-400/50 text-white hover:bg-red-600 ring-4 ring-red-500/10"
                )}
            >
                {!isCameraMuted ? <Camera className="w-[3.5vh] h-[3.5vh] max-w-[24px] max-h-[24px]" /> : <CameraOff className="w-[3.5vh] h-[3.5vh] max-w-[24px] max-h-[24px]" />}
            </button>

            <button
                onClick={toggleMicrophone}
                className={cn(
                    "w-[8vh] h-[8vh] max-w-[56px] max-h-[56px] min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-all shadow-xl border",
                    !isMicMuted
                        ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                        : "bg-red-500 border-red-400/50 text-white hover:bg-red-600 ring-4 ring-red-500/10"
                )}
            >
                {!isMicMuted ? <Mic className="w-[3.5vh] h-[3.5vh] max-w-[24px] max-h-[24px]" /> : <MicOff className="w-[3.5vh] h-[3.5vh] max-w-[24px] max-h-[24px]" />}
            </button>
        </div>
    );
};

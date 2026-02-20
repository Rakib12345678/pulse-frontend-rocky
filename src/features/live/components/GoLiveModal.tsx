import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Camera, Mic, MicOff, CameraOff, Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoLiveStore, Category } from '../stores/goLiveStore';
import { liveService } from '../services/live.service';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import noCamera from '@/assets/noCamera.svg'

const CATEGORIES: Category[] = [
    'Lifestyle', 'Blogging', 'Coding', 'Dancing',
    'Cooking', 'Speaking', 'Science & Tech', 'Others'
];

export const GoLiveModal = () => {
    const {
        isOpen,
        closeModal,
        streamTitle,
        setStreamTitle,
        selectedCategory,
        setCategory,
        isCameraEnabled,
        toggleCamera,
        isMicEnabled,
        toggleMic,
        isLoading,
        setLoading,
    } = useGoLiveStore();

    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    const stopStream = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const initiateMedia = async () => {
        setPermissionError(null);

        try {
            let newStream: MediaStream;

            try {
                // Try getting both first for best experience
                newStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
            } catch (err: any) {
                console.warn("Could not get both video and audio, trying video only...", err);
                try {
                    // Fallback 1: Try video only
                    newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    toast.warning("Microphone not found or blocked. Video only preview.");
                } catch (err2: any) {
                    console.warn("Could not get video, trying audio only...", err2);
                    try {
                        // Fallback 2: Try audio only
                        newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        toast.warning("Camera not found or blocked. Audio only preview.");
                    } catch (err3: any) {
                        // Critical failure: All attempts failed
                        console.error("Critical failure: Could not get any media device", err3);
                        throw err3;
                    }
                }
            }

            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }

            // Sync initial state based on available tracks
            const videoTracks = newStream.getVideoTracks();
            const audioTracks = newStream.getAudioTracks();

            if (videoTracks.length > 0) {
                videoTracks.forEach(track => {
                    track.enabled = isCameraEnabled;
                });
            }

            if (audioTracks.length > 0) {
                audioTracks.forEach(track => {
                    track.enabled = isMicEnabled;
                });
            }

        } catch (err: any) {
            console.error("Error accessing media devices:", err);
            let errorMessage = "Could not access camera/microphone";

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = "Permission denied. Please allow access in your browser settings.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage = "Camera or microphone not found.";
            }

            setPermissionError(errorMessage);
            toast.error(errorMessage);
        }
    };

    // Ensure video gets stream on re-mount or when enabling camera
    useEffect(() => {
        if (videoRef.current && stream && isCameraEnabled) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, isCameraEnabled]);

    // Effect to toggle tracks when state changes
    useEffect(() => {
        if (stream) {
            const videoTracks = stream.getVideoTracks();
            const audioTracks = stream.getAudioTracks();

            videoTracks.forEach(track => {
                if (track.enabled !== isCameraEnabled) {
                    track.enabled = isCameraEnabled;
                }
            });

            audioTracks.forEach(track => {
                if (track.enabled !== isMicEnabled) {
                    track.enabled = isMicEnabled;
                }
            });
        }
    }, [isCameraEnabled, isMicEnabled, stream]);

    // Handle initial mount/open
    useEffect(() => {
        if (isOpen) {
            initiateMedia();
        } else {
            stopStream();
        }

        return () => stopStream();
    }, [isOpen]);

    const navigate = useNavigate();

    const handleGoLive = async () => {
        if (permissionError) {
            toast.error("Please fix camera/microphone permissions first");
            return;
        }

        const { user } = useAuthStore.getState();
        const fallbackTitle = user?.username ? `${user.username}'s Live Stream` : "Untitled Stream";
        const finalTitle = streamTitle.trim() || fallbackTitle;
        const finalCategory = selectedCategory || 'Others';

        const { setStreamData } = useGoLiveStore.getState();

        console.log("Handle Go Live triggered", { finalTitle, finalCategory });

        setLoading(true);
        try {
            console.log("Calling liveService.createLiveStream...");
            const response = await liveService.createLiveStream({
                title: finalTitle,
                category: finalCategory
            });
            console.log("Live stream created successfully", response);

            toast.success("Going live...");

            // Store the stream data for the layout to use
            setStreamData({
                callId: response.callId,
                callType: response.callType,
                token: response.token
            });

            // Navigate to the live page
            navigate({
                to: '/live/$id',
                params: { id: response.callId }
            });

            closeModal();
        } catch (error) {
            console.error("Failed to start stream:", error);
            toast.error("Failed to start stream");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-300 px-4">
            <div className="absolute inset-0" onClick={closeModal} />

            <div className="relative z-10 w-full max-w-[1000px] h-[600px] bg-[#0f1117] rounded-[24px] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-white/5 animate-in zoom-in-95 duration-300">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(150%_150%_at_100%_0%,rgba(255,136,0,0.15)_0%,rgba(255,100,0,0.1)_25%,rgba(255,50,0,0.05)_50%,transparent_80%)]" />

                <div className="relative z-10 flex flex-col md:flex-row h-full w-full">
                    {/* Left Panel - Video Preview */}
                    <div className="relative w-full md:w-[42%] h-[300px] md:h-full bg-transparent p-6 flex flex-col items-center justify-center border-r border-white/5">
                        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#1a1c24]/40 flex items-center justify-center group shadow-inner border border-white/5">
                            {permissionError ? (
                                <div className="flex flex-col items-center gap-4 text-center px-8">
                                    <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                                        <CameraOff className="w-12 h-12" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-semibold text-white">{permissionError}</p>
                                        <p className="text-xs text-gray-500">Enable access in your browser and click retry</p>
                                    </div>
                                    <Button
                                        onClick={initiateMedia}
                                        variant="outline"
                                        className="mt-2 border-white/10 text-black hover:bg-white/5"
                                    >
                                        Retry Access
                                    </Button>
                                </div>
                            ) : !isCameraEnabled ? (
                                <div className="flex flex-col items-center gap-3 sm:gap-4 text-gray-500">
                                    <div className="p-4 sm:p-6 rounded-full bg-white/5 border border-white/10">
                                        <img src={noCamera} alt="No Camera" className="w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12" />
                                    </div>
                                </div>

                            ) : (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover mirror"
                                />
                            )}

                            {/* Camera/Mic Controls Overlay */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 transition-transform duration-300 group-hover:scale-110">
                                <button
                                    onClick={toggleCamera}
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg border",
                                        isCameraEnabled
                                            ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                                            : "bg-red-500 border-red-400/50 text-white hover:bg-red-600 ring-4 ring-red-500/20"
                                    )}
                                >
                                    {isCameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={toggleMic}
                                    className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg border",
                                        isMicEnabled
                                            ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
                                            : "bg-red-500 border-red-400/50 text-white hover:bg-red-600 ring-4 ring-red-500/20"
                                    )}
                                >
                                    {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Form */}
                    <div className="relative w-full md:w-[58%] h-full p-8 md:p-12 flex flex-col justify-center overflow-visible">
                        <button
                            onClick={closeModal}
                            className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:bg-white/5 hover:text-white transition-all z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-10">
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
                                1 Step Away to <span className="text-[#FF8800]">Go Live</span>
                            </h2>
                        </div>

                        <div className="space-y-8">
                            {/* Stream Title */}
                            <div className="space-y-2.5">
                                <label className="text-xs font-semibold text-gray-400 tracking-widest ml-1 mb-1">
                                    Stream Title
                                </label>
                                <Input
                                    value={streamTitle}
                                    onChange={(e) => setStreamTitle(e.target.value)}
                                    placeholder="Enter Stream Title Here..."
                                    className="h-14 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#FF8800]/50 focus:ring-1 focus:ring-[#FF8800]/30 transition-all text-lg"
                                />
                            </div>

                            {/* Category Selection */}
                            <div className="space-y-4">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest ml-1">
                                    Category
                                </label>
                                <div className="flex flex-wrap gap-2.5">
                                    {CATEGORIES.map((category) => {
                                        const isSelected = selectedCategory === category;
                                        return (
                                            <button
                                                key={category}
                                                onClick={() => setCategory(category)}
                                                className={cn(
                                                    "min-w-[73px] h-[36px] px-4 py-[6px] rounded-full text-sm font-medium transition-all flex items-center justify-center gap-[10px] border whitespace-nowrap",
                                                    isSelected
                                                        ? "bg-[#FF8800]/10 border-[#FF8800] text-[#FF8800] shadow-[0_0_15px_rgba(255,136,0,0.1)]"
                                                        : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white hover:bg-white/10"
                                                )}
                                            >
                                                {isSelected && <Check className="w-3 h-3" />}
                                                {category}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Button
                                    onClick={handleGoLive}
                                    disabled={isLoading}
                                    className="h-14 flex-1 rounded-full bg-[#FF8800] text-black font-bold text-lg hover:bg-[#ff9d2e] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_8px_20px_-4px_rgba(255,136,0,0.4)] disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Go Live"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={closeModal}
                                    disabled={isLoading}
                                    className="h-14 flex-1 rounded-full border-2 border-[#FF8800] text-[#FF8800] bg-transparent font-bold text-lg hover:bg-[#FF8800]/10 hover:border-[#ff9d2e] transition-all"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

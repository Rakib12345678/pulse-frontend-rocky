import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Camera, Mic, MicOff, CameraOff, Check, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGoLiveStore, Category } from '@/features/live/stores/goLiveStore';
import { liveService } from '@/features/live/services/live.service';
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
        showConflict,
        setShowConflict,
        conflictStream,
        setConflictStream,
        isRejoining,
        setIsRejoining
    } = useGoLiveStore();

    const videoRef = useRef<HTMLVideoElement>(null);
    const activeStreamRef = useRef<MediaStream | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [permissionError, setPermissionError] = useState<string | null>(null);

    const stopStream = useCallback(() => {
        // Synchronously stop the active stream reference to prevent races
        if (activeStreamRef.current) {
            activeStreamRef.current.getTracks().forEach(track => track.stop());
            activeStreamRef.current = null;
        }

        setStream((current) => {
            if (current) {
                current.getTracks().forEach(track => track.stop());
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            return null;
        });
    }, []);

    const initiateMedia = useCallback(async () => {
        setPermissionError(null);

        const { isCameraEnabled: camEnabled, isMicEnabled: micEnabled } =
            useGoLiveStore.getState();

        try {
            // We rely on the useEffect cleanup or the check below to handle stopping.
            // Redundant stopStream() calls here can cause race conditions.

            let newStream: MediaStream;

            try {
                // Try getting requested media combination
                newStream = await navigator.mediaDevices.getUserMedia({
                    video: camEnabled,
                    audio: micEnabled
                });
            } catch (err: any) {
                console.warn("Could not get requested media combination, trying fallbacks...", err);
                
                // Fallback logic: only try to get what the user has enabled
                if (camEnabled && micEnabled) {
                    try {
                        // Fallback 1: Try video only
                        newStream = await navigator.mediaDevices.getUserMedia({ video: true });
                        toast.warning("Microphone not found or blocked. Video only preview.");
                    } catch (err2: any) {
                        try {
                            // Fallback 2: Try audio only
                            newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                            toast.warning("Camera not found or blocked. Audio only preview.");
                        } catch (err3: any) {
                            throw err3;
                        }
                    }
                } else {
                    // If user only wanted one thing and it failed, re-throw
                    throw err;
                }
            }

            // Keep a synchronous reference to the stream for race-condition-free cleanup
            activeStreamRef.current = newStream;
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            
            return newStream;

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
    }, []);

    // Ensure video gets stream on re-mount or when enabling camera
    useEffect(() => {
        if (videoRef.current && stream && isCameraEnabled) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, isCameraEnabled]);

    // Handle initial mount/open and toggle changes
    useEffect(() => {
        if (!isOpen) {
            stopStream();
            return;
        }

        let isCancelled = false;

        const startMedia = async () => {
            // First, stop any orphaned tracks
            if (activeStreamRef.current) {
                activeStreamRef.current.getTracks().forEach(t => t.stop());
                activeStreamRef.current = null;
            }

            const newStream = await initiateMedia();
            
            if (isCancelled && newStream) {
                // If the modal was closed/changed while getUserMedia was pending,
                // destroy the newly acquired stream immediately.
                newStream.getTracks().forEach(t => t.stop());
            }
        };

        startMedia();

        return () => {
            isCancelled = true;
        };
    }, [isOpen, isCameraEnabled, isMicEnabled, initiateMedia, stopStream]);

    const navigate = useNavigate();

    const handleRejoinConflict = () => {
        if (!conflictStream) return;
        setStreamTitle(conflictStream.title || '');
        setCategory(conflictStream.category as Category || null);
        setIsRejoining(true);
        setShowConflict(false);
    };

    const handleEndAndStartNew = async () => {
        if (!conflictStream) return;
        setLoading(true);
        try {
            await liveService.endLiveStream(conflictStream.callId);
            toast.success("Ended ongoing stream. Starting new...");
            setShowConflict(false);
            setConflictStream(null);
        } catch (err) {
            console.error("Failed to end conflict stream:", err);
            toast.error("Failed to end ongoing stream");
        } finally {
            setLoading(false);
        }
    };

    const handleGoLive = async () => {
        if (permissionError) {
            toast.error("Please fix camera/microphone permissions first");
            return;
        }

        const { setStreamData } = useGoLiveStore.getState();
        const { userService } = await import('../../services/user.service');

        setLoading(true);
        try {
            // 1. Check backend for existing stream first
            const status = await userService.getUserStream();

            if (status.isLive) {
                // 2. If live, join the existing one (Rejoin logic)
                const joinRes = await liveService.joinStream(status.callId!);
                setStreamData({
                    callId: joinRes.callId,
                    callType: joinRes.callType,
                    token: joinRes.token,
                });
                toast.success("Rejoining your active stream...");
                navigate({
                    to: '/live/$id',
                    params: { id: status.callId! },
                });
                closeModal();
            } else {
                // 3. If not live, create a new one
                if (!streamTitle.trim()) {
                    toast.error("Stream title is required");
                    setLoading(false);
                    return;
                }
                if (!selectedCategory) {
                    toast.error("Category is required");
                    setLoading(false);
                    return;
                }

                const response = await liveService.createLiveStream({
                    title: streamTitle.trim(),
                    category: selectedCategory
                });

                toast.success("Going live...");

                setStreamData({
                    callId: response.callId,
                    callType: response.callType,
                    token: response.token
                });

                navigate({
                    to: '/live/$id',
                    params: { id: response.callId }
                });

                closeModal();
            }
        } catch (error: any) {
            console.error("Failed to start/rejoin stream:", error);
            if (isRejoining) {
                const { setStreamData: clearData } = useGoLiveStore.getState();
                clearData(null);
                localStorage.removeItem('pulse_host_left_at');
                toast.error("Stream has already ended. Start a new one!");
                closeModal(true);
            } else {
                toast.error("Failed to start stream");
            }
        } finally {
            setLoading(false);
        }
    };

    const isMobile = useIsMobile();

    if (!isOpen) return null;

    if (isLoading && !showConflict) {
        return (
            <div className="fixed inset-0 z-[50000] flex items-center justify-center bg-[#0f1117]/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-[#FF8800] animate-spin" />
                    <p className="text-white font-medium">Checking stream status...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ===== MOBILE: Fullscreen Layout ===== */}
            {isMobile ? (
                <div
                    className="fixed inset-0 bg-[#0f1117] flex flex-col h-dvh overflow-hidden"
                    style={{ zIndex: 50000 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !showConflict) closeModal(true);
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-6 pb-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => !showConflict && closeModal(true)}
                                className={cn("text-white", showConflict && "opacity-50 cursor-not-allowed")}
                                disabled={showConflict}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                            </button>
                            <h1 className="text-xl font-bold text-white">Live</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleMic}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                    isMicEnabled
                                        ? "bg-[#FF8800] text-black"
                                        : "bg-[#2a2c30] text-gray-400"
                                )}
                            >
                                {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={toggleCamera}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                    isCameraEnabled
                                        ? "bg-[#FF8800] text-black"
                                        : "bg-[#2a2c30] text-gray-400"
                                )}
                            >
                                {isCameraEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Camera Preview Area */}
                    <div className="flex-1 min-h-0 flex items-center justify-center px-6 py-4">
                        {permissionError ? (
                            <div className="flex flex-col items-center gap-4 text-center px-8">
                                <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                                    <CameraOff className="w-12 h-12" />
                                </div>
                                <p className="text-sm font-semibold text-white">{permissionError}</p>
                                <Button onClick={initiateMedia} variant="outline" className="mt-2 border-white/10 text-black hover:bg-white/5">
                                    Retry Access
                                </Button>
                            </div>
                        ) : !isCameraEnabled ? (
                            <div className="flex flex-col items-center gap-3 text-gray-500">
                                <div className="p-6 rounded-full bg-white/5 border border-white/10">
                                    <img src={noCamera} alt="No Camera" className="w-12 h-12" />
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-full max-sm rounded-2xl overflow-hidden bg-[#1a1c24]/40 border border-white/5">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover mirror"
                                />
                            </div>
                        )}
                    </div>

                    {/* Bottom Form Section */}
                    <div className="px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4 space-y-5 shrink-0">
                        <div className="bg-[#1a1c24] rounded-2xl p-4 border border-white/5">
                            <label className="text-xs font-semibold text-gray-400 tracking-wider mb-2 block">Stream Title</label>
                            <Input
                                value={streamTitle}
                                onChange={(e) => setStreamTitle(e.target.value)}
                                placeholder="Enter Stream Title Here..."
                                disabled={isRejoining && !!streamTitle}
                                className="bg-transparent border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#FF8800]/50 focus:ring-0 text-base h-12 disabled:opacity-50"
                            />

                            {/* Category */}
                            <label className="text-xs font-semibold text-gray-400 tracking-wider mt-4 mb-2 block">Category</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map((category) => {
                                    const isSelected = selectedCategory === category;
                                    return (
                                        <button
                                            key={category}
                                            onClick={() => (!isRejoining || !selectedCategory) && setCategory(category)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap",
                                                isSelected
                                                    ? "bg-[#FF8800]/10 border-[#FF8800] text-[#FF8800]"
                                                    : "bg-white/5 border-white/10 text-gray-400",
                                                (isRejoining && selectedCategory && !isSelected) && "cursor-not-allowed opacity-50"
                                            )}
                                        >
                                            {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                                            {category}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Go Live Button */}
                        <Button
                            onClick={handleGoLive}
                            disabled={isLoading || !streamTitle.trim() || !selectedCategory}
                            className={cn(
                                "w-full h-14 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2",
                                streamTitle.trim() && selectedCategory
                                    ? "bg-[#FF8800] text-black hover:bg-[#ff9d2e] shadow-[0_8px_20px_-4px_rgba(255,136,0,0.4)]"
                                    : "bg-[#2a2c30] text-white cursor-not-allowed"
                            )}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Camera className="w-5 h-5" />
                                    {isRejoining ? "Rejoin Stream" : "Go Live"}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            ) : (
                /* ===== DESKTOP: Original Modal Layout ===== */
                <div className="fixed inset-0 z-400 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-300 px-4" style={{ zIndex: 9999 }}>
                    <div className="absolute inset-0" onClick={() => !showConflict && closeModal(true)} />

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
                                    onClick={() => closeModal(true)}
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
                                            disabled={isRejoining && !!streamTitle}
                                            className="h-14 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:border-[#FF8800]/50 focus:ring-1 focus:ring-[#FF8800]/30 transition-all text-lg disabled:opacity-50"
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
                                                        onClick={() => (!isRejoining || !selectedCategory) && setCategory(category)}
                                                        className={cn(
                                                            "min-w-[73px] h-[36px] px-4 py-[6px] rounded-full text-sm font-medium transition-all flex items-center justify-center gap-[10px] border whitespace-nowrap",
                                                            isSelected
                                                                ? "bg-[#FF8800]/10 border-[#FF8800] text-[#FF8800] shadow-[0_0_15px_rgba(255,136,0,0.1)]"
                                                                : "bg-white/5 border-white/10 text-gray-400 hover:border-white/30 hover:text-white hover:bg-white/10",
                                                            (isRejoining && selectedCategory && !isSelected) && "cursor-not-allowed opacity-50"
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
                                            disabled={isLoading || !streamTitle.trim() || !selectedCategory}
                                            className={cn(
                                                "h-14 flex-1 rounded-full font-bold text-lg transition-all disabled:opacity-50 disabled:hover:scale-100",
                                                streamTitle.trim() && selectedCategory
                                                    ? "bg-[#FF8800] text-black hover:bg-[#ff9d2e] hover:scale-[1.02] active:scale-95 shadow-[0_8px_20px_-4px_rgba(255,136,0,0.4)]"
                                                    : "bg-[#2a2c30] text-white cursor-not-allowed"
                                            )}
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRejoining ? "Rejoin Stream" : "Go Live")}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => closeModal(true)}
                                            disabled={isLoading || showConflict}
                                            className="h-14 flex-1 rounded-full border-2 border-[#FF8800] text-[#FF8800] bg-transparent font-bold text-lg hover:bg-[#FF8800]/10 hover:border-[#ff9d2e] transition-all disabled:opacity-50"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Conflict Resolution Modal */}
            {showConflict && (
                <div className="fixed inset-0 z-[50001] flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
                    <div className="bg-[#1c1c1e] rounded-3xl p-8 w-full max-w-sm flex flex-col items-center gap-5 shadow-2xl border border-white/5">
                        <div className="w-16 h-16 rounded-full bg-[#FF8800]/10 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-[#FF8800]" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-white text-xl font-bold">Ongoing Stream</h3>
                            <p className="text-gray-400 text-sm">
                                You already have an active stream: <span className="text-white font-medium">"{conflictStream?.title}"</span>. What would you like to do?
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 w-full mt-2">
                            <Button
                                onClick={handleRejoinConflict}
                                disabled={isLoading}
                                className="w-full py-6 rounded-full bg-[#FF8800] text-black font-bold text-base hover:bg-[#ff9d2e] active:scale-95 transition-all shadow-lg"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Rejoin Ongoing"}
                            </Button>
                            <Button
                                onClick={handleEndAndStartNew}
                                disabled={isLoading}
                                variant="outline"
                                className="w-full py-6 rounded-full border-2 border-[#FF8800] text-[#FF8800] bg-transparent font-bold text-base hover:bg-[#FF8800]/10 active:scale-95 transition-all"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "End & Start New"}
                            </Button>
                            <button
                                onClick={() => closeModal(true)}
                                className="text-gray-500 text-sm font-medium hover:text-white transition-colors mt-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

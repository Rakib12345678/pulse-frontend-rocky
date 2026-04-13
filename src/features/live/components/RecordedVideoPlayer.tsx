import React, { useRef, useState, useEffect } from 'react';
import { useRecordingContext } from './RecordingLayout';
import { StreamerInfoOverlay } from './StreamerInfoOverlay';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export const RecordedVideoPlayer: React.FC = () => {
    const { recordingMetadata } = useRecordingContext();
    const isMobile = useIsMobile();
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout>(null);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const total = videoRef.current.duration;
            setProgress((current / total) * 100);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (videoRef.current) {
            const time = (Number(e.target.value) / 100) * videoRef.current.duration;
            videoRef.current.currentTime = time;
            setProgress(Number(e.target.value));
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen();
            //@ts-ignore
            else if (videoRef.current.webkitRequestFullscreen) videoRef.current.webkitRequestFullscreen();
        }
    };

    // Auto-hide controls
    useEffect(() => {
        const handleMouseMove = () => {
            setShowControls(true);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    if (!recordingMetadata?.recordingUrl) return null;

    return (
        <div className={cn(
            "relative h-full w-full overflow-hidden bg-black group",
            !isMobile && "rounded-3xl border border-white/5 shadow-2xl"
        )}>
            <video
                ref={videoRef}
                src={recordingMetadata.recordingUrl}
                className="h-full w-full object-cover"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlay}
                autoPlay
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />

            {/* Overlay Gradient (Top and Bottom) */}
            <div className={cn(
                "absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/60 transition-opacity duration-300 pointer-events-none",
                showControls ? "opacity-100" : "opacity-0"
            )} />

            {/* Metadata Overlay (matches live bottom info) */}
            <div className={cn(
                "absolute bottom-8 left-4 right-4 z-10 transition-transform duration-300",
                showControls ? "-translate-y-12" : "translate-y-0"
            )}>
                <StreamerInfoOverlay
                    streamerName={recordingMetadata.username || 'Host'}
                    streamerUsername={recordingMetadata.username}
                />
            </div>

            {/* Custom Controls (Subtle) */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 p-4 pb-6 transition-all duration-300 z-20",
                showControls ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}>
                <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlay} className="text-white hover:text-[#FF8800] transition-colors">
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                        </button>
                        
                        <div className="flex items-center gap-2">
                            <button onClick={toggleMute} className="text-white hover:text-[#FF8800] transition-colors">
                                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </button>
                        </div>

                        <span className="text-white/80 text-[10px] font-bold tabular-nums tracking-wider uppercase">
                            {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => { if(videoRef.current) videoRef.current.currentTime = 0; }} 
                            className="text-white/70 hover:text-[#FF8800] transition-colors"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <button onClick={handleFullscreen} className="text-white/70 hover:text-[#FF8800] transition-colors">
                            <Maximize size={18} />
                        </button>
                    </div>
                </div>

                {/* Scrub Bar (Hidden by default, shown on control show) */}
                <div className="relative group/seeker px-1">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-[#FF8800] hover:h-2 transition-all"
                    />
                </div>
            </div>

            {/* Subtle Progress Track (Always visible at very bottom) */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 h-1 bg-white/10 transition-opacity duration-300",
                showControls ? "opacity-0" : "opacity-100"
            )}>
                <div 
                    className="h-full bg-[#FF8800]" 
                    style={{ width: `${progress}%` }} 
                />
            </div>

            {/* Large Center Play/Pause Overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <button 
                        onClick={togglePlay}
                        className="w-20 h-20 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 hover:scale-110 transition-transform active:scale-95"
                    >
                        <Play size={40} className="text-white ml-2" fill="currentColor" />
                    </button>
                </div>
            )}
        </div>
    );
};

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

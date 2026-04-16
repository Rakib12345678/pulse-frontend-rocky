import React, { useRef } from 'react';
import { useRecordingContext } from '@/features/live/components/layout/RecordingLayout';
import { Loader2 } from 'lucide-react';

export const RecordedVideoPlayer: React.FC = () => {
    const {
        recordingMetadata,
        setIsPlaying
    } = useRecordingContext();

    const videoRef = useRef<HTMLVideoElement>(null);

    if (!recordingMetadata?.recordingUrl) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#FF8800]" />
                    <span className="text-white/40 font-medium">Loading Recording...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 w-full h-full bg-black flex items-center justify-center z-0">
            <video
                ref={videoRef}
                src={recordingMetadata.recordingUrl}
                className="w-full h-full object-cover"
                autoPlay
                controls
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            />
        </div>
    );
};

import React, { useRef } from 'react';
import { useRecordingContext } from '@/features/live/components/layout/RecordingLayout';
import { Loader2 } from 'lucide-react';

export const RecordedVideoPlayer: React.FC = () => {
    const {
        recordingMetadata,
        setIsPlaying,
        setCurrentTime,
        setDuration
    } = useRecordingContext();

	const videoRef = useRef<HTMLVideoElement>(null);

	if (!recordingMetadata?.mobileVideoUrl) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-black">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-10 w-10 animate-spin text-[#FF8800]" />
                    <span className="text-white/40 font-medium">Loading Recording...</span>
				</div>
			</div>
		);
	}

	const handleTimeUpdate = () => {
		if (videoRef.current) {
			setCurrentTime(videoRef.current.currentTime);
		}
	};

	const handleLoadedMetadata = () => {
		if (videoRef.current) {
			setDuration(videoRef.current.duration);
		}
	};

	return (
		<div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center z-0">
			<video
				ref={videoRef}
				src={recordingMetadata.mobileVideoUrl}
				className="w-full h-full object-contain select-none"
				autoPlay
				playsInline
				controls
				controlsList="nodownload"
				disablePictureInPicture
				onContextMenu={(e) => e.preventDefault()}
				onPlay={() => setIsPlaying(true)}
				onPause={() => setIsPlaying(false)}
				onTimeUpdate={handleTimeUpdate}
				onLoadedMetadata={handleLoadedMetadata}
			/>
		</div>
	);
};

import React, { useEffect } from 'react';
import { useCallStateHooks, ParticipantView } from '@stream-io/video-react-sdk';
import { Pin } from 'lucide-react';
import { useLiveStreamContext } from './LiveStreamLayout';
import { useNavigate } from '@tanstack/react-router';
import { StreamerInfoOverlay } from './StreamerInfoOverlay';

export const LiveStreamVideoPlayer: React.FC = () => {
    const { useParticipants } = useCallStateHooks();
    const { isViewer, isChatVisible } = useLiveStreamContext();
    const participants = useParticipants();
    const navigate = useNavigate();

    // Filter participants: only show those who are publishing video OR audio
    // Viewers won't appear in the video grid - only hosts/publishers
    const activeParticipants = participants.filter((p) => {
        // Always show local participant if they're a host (not viewer)
        if (p.isLocalParticipant && !isViewer) return true;
        // For others, only show if they're publishing video or audio
        return p.publishedTracks?.length > 0;
    });

    // Sort participants: local user (host) first, then others
    const sortedParticipants = [...activeParticipants].sort((a, b) => {
        if (a.isLocalParticipant) return -1;
        if (b.isLocalParticipant) return 1;
        return 0;
    });
    const count = sortedParticipants.length;

    // Auto-exit if no streamers for 10 seconds
    useEffect(() => {
        if (count === 0) {
            const timer = setTimeout(() => {
                navigate({ to: '/for-you' });
            }, 15000);
            return () => clearTimeout(timer);
        }
    }, [count, navigate]);

    const renderParticipant = (p: any, showPin = false) => (
        <div key={p.sessionId} className="relative h-full w-full rounded-3xl overflow-hidden bg-neutral-900 border border-white/5 shadow-2xl group">
            <ParticipantView
                participant={p}
                className="h-full w-full object-cover"
                ParticipantViewUI={null}
            />
            {showPin && (
                <div className="absolute top-4 left-4 flex gap-2">
                    <div className="p-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                        <Pin className="w-4 h-4 text-[#FF8800]" />
                    </div>
                </div>
            )}
            {isChatVisible && (
                <div className="absolute bottom-4 left-4 right-4">
                    {showPin && isViewer ? (
                        <StreamerInfoOverlay
                            streamerName={p.name || (p.isLocalParticipant ? 'Host' : 'Guest')}
                            streamerImage={p.image}
                        />
                    ) : (
                        <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium border border-white/10 inline-block">
                            {p.name || (p.isLocalParticipant ? 'Host' : 'Guest')}
                        </span>
                    )}
                </div>
            )}
        </div>
    );

    const renderLayout = () => {
        if (count === 0) {
            return (
                <div className="flex-1 flex items-center justify-center rounded-3xl bg-neutral-900 border border-white/5">
                    <span className="text-white/50 text-lg">Streamer not available</span>
                </div>
            );
        }

        if (count === 1) {
            return (
                <div className="flex justify-center w-full h-full">
                    <div className="h-full aspect-9/16 max-w-sm">
                        {renderParticipant(sortedParticipants[0], true)}
                    </div>
                </div>
            );
        }

        if (count === 2) {
            return (
                <div className="flex h-full w-full gap-4 justify-center">
                    <div className="flex-1 h-full aspect-9/16 max-w-[calc(50%-8px)]">
                        {renderParticipant(sortedParticipants[0], true)}
                    </div>
                    <div className="flex-1 h-full aspect-9/16 max-w-[calc(50%-8px)]">
                        {renderParticipant(sortedParticipants[1])}
                    </div>
                </div>
            );
        }

        // 3 or 4 participants
        const mainParticipant = sortedParticipants[0];
        const sides = sortedParticipants.slice(1);

        return (
            <div className="flex h-full w-full gap-6">
                {/* Main Video (Left) */}
                <div className="flex-1 h-full aspect-9/16">
                    {renderParticipant(mainParticipant, true)}
                </div>

                {/* Side Column (Right) */}
                <div className="w-72 flex flex-col gap-4 h-full">
                    {sides.map((p) => (
                        <div key={p.sessionId} className="flex-1 min-h-0">
                            {renderParticipant(p)}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full w-full p-6 pt-28 overflow-hidden">
            {renderLayout()}
        </div>
    );
};

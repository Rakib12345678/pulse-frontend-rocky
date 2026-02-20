import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useCallStateHooks, ParticipantView, hasVideo, hasAudio } from '@stream-io/video-react-sdk';
import { useLiveStreamContext } from './LiveStreamLayout';
import { useNavigate } from '@tanstack/react-router';
import { StreamerInfoOverlay } from './StreamerInfoOverlay';
import { MicOff, VideoOff } from 'lucide-react';
import { useGoLiveStore } from '../stores/goLiveStore';

export const LiveStreamVideoPlayer: React.FC = () => {
    const { useParticipants } = useCallStateHooks();
    const { isViewer, isChatVisible, call } = useLiveStreamContext();
    const participants = useParticipants();
    const navigate = useNavigate();

    // Get the call creator ID to always show the host
    const creatorId = call?.state.createdBy?.id;

    // Filter participants: show host always, others only if publishing
    const activeParticipants = participants.filter((p) => {
        // Always show local participant if they're a host (not viewer)
        if (p.isLocalParticipant && !isViewer) return true;
        // Always show the stream creator (host) regardless of published tracks
        if (creatorId && p.userId === creatorId) return true;
        // For others, only show if they're publishing video or audio for now, will implement in join later
        return p.publishedTracks?.length > 0;
    });

    // Sort participants: local user (host) first, then others
    const sortedParticipants = [...activeParticipants].sort((a, b) => {
        if (a.isLocalParticipant) return -1;
        if (b.isLocalParticipant) return 1;
        return 0;
    });
    const count = sortedParticipants.length;

    // Listen for call.ended event — navigates ALL users (host + viewers) to /for-you
    useEffect(() => {
        if (!call) return;
        const unsubscribe = call.on('call.ended', () => {
            // Signal the route blocker to let navigation through for the host
            useGoLiveStore.getState().setEndingStream(true);
            toast.info('Stream has ended');
            navigate({ to: '/for-you' });
        });
        return () => unsubscribe();
    }, [call, navigate]);

    // Fallback: auto-exit if no streamers for 15 seconds
    useEffect(() => {
        if (count === 0) {
            const timer = setTimeout(() => {
                navigate({ to: '/for-you' });
            }, 15000);
            return () => clearTimeout(timer);
        }
    }, [count, navigate]);

    const renderParticipant = (p: any, showPin = false) => {
        const participantHasVideo = hasVideo(p);
        const participantHasAudio = hasAudio(p);

        return (
            <div key={p.sessionId} className="relative h-full w-full rounded-3xl overflow-hidden bg-neutral-900 border border-white/5 shadow-2xl group">
                {participantHasVideo ? (
                    <ParticipantView
                        participant={p}
                        className="h-full w-full object-cover"
                        ParticipantViewUI={null}
                    />
                ) : (
                    /* Camera off: show avatar fallback */
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 mb-3">
                            {p.image ? (
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#FF8800]/20 flex items-center justify-center">
                                    <span className="text-3xl font-bold text-[#FF8800]">
                                        {(p.name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="text-white/60 text-sm font-medium">{p.name || 'Host'}</span>
                        <div className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            <VideoOff className="w-3.5 h-3.5 text-red-400" />
                            <span className="text-xs text-white/40">Camera off</span>
                        </div>
                    </div>
                )}

                {/* Mic off indicator — top right corner */}
                {!participantHasAudio && (
                    <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center border border-red-400/50">
                        <MicOff className="w-4 h-4 text-white" />
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
    };

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

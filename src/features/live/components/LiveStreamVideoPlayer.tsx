import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useCallStateHooks, ParticipantView, hasVideo, hasAudio } from '@stream-io/video-react-sdk';
import { useLiveStreamContext } from './LiveStreamLayout';
import { useNavigate } from '@tanstack/react-router';
import { StreamerInfoOverlay } from './StreamerInfoOverlay';
import { MicOff, VideoOff, PhoneOff, Mic } from 'lucide-react';
import { useGoLiveStore } from '../stores/goLiveStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserProfileStore } from '../stores/userProfileStore';

export const LiveStreamVideoPlayer: React.FC = () => {
    const { useParticipants } = useCallStateHooks();
    const { isViewer, isGuest, isChatVisible, call } = useLiveStreamContext();
    const participants = useParticipants();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { openModal: openProfileModal } = useUserProfileStore();

    // Get the call creator ID to always show the host
    const creatorId = call?.state.createdBy?.id;

    // Filter participants: show host always, others only if publishing
    const activeParticipants = participants.filter((p) => {
        if (p.isLocalParticipant && !isViewer) return true;
        if (creatorId && p.userId === creatorId) return true;
        return p.publishedTracks?.length > 0;
    });

    // Sort: host (creator or local) first, then co-hosts
    const sortedParticipants = [...activeParticipants].sort((a, b) => {
        // Creator always first
        if (creatorId && a.userId === creatorId) return -1;
        if (creatorId && b.userId === creatorId) return 1;
        if (a.isLocalParticipant) return -1;
        if (b.isLocalParticipant) return 1;
        return 0;
    });

    const host = sortedParticipants[0];
    const coHosts = sortedParticipants.slice(1);

    // Listen for call.ended event
    useEffect(() => {
        if (!call) return;
        const unsubscribe = call.on('call.ended', async () => {
            // Disable camera and mic before navigating away
            try {
                await call.camera.disable();
                await call.microphone.disable();
            } catch (e) {
                // Ignore — call may already be torn down
            }
            useGoLiveStore.getState().setEndingStream(true);
            toast.info('Stream has ended');
            navigate({ to: '/for-you' });
        });

        let pollInterval: NodeJS.Timeout;
        if (isGuest) {
            pollInterval = setInterval(async () => {
                try {
                    const callState = await call.get();
                    if (callState.call.ended_at) {
                        toast.info('Stream has ended');
                        navigate({ to: '/for-you' });
                    }
                } catch (e) {
                    toast.info('Stream has ended');
                    navigate({ to: '/for-you' });
                }
            }, 5000);
        }

        return () => {
            unsubscribe();
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [call, navigate, isGuest]);

    // Fallback: auto-exit if no streamers for 15 seconds
    useEffect(() => {
        if (sortedParticipants.length === 0) {
            const timer = setTimeout(() => navigate({ to: '/for-you' }), 15000);
            return () => clearTimeout(timer);
        }
    }, [sortedParticipants.length, navigate]);

    /** Kick a co-host: revoke permissions so they stop publishing */
    const handleKickCoHost = async (userId: string, userName: string) => {
        if (!call) return;
        try {
            console.log('[Kick] Revoking permissions for:', userId);
            await call.updateUserPermissions({
                user_id: userId,
                revoke_permissions: [
                    'send-audio',
                    'send-video',
                ],
            });
            // Notify the co-host they were kicked
            await call.sendCustomEvent({
                type: 'kicked',
                userId,
            });
            toast.success(`Removed @${userName} from stream`);
        } catch (err) {
            console.error('[Kick] Failed to kick co-host:', err);
            toast.error('Failed to remove co-host');
        }
    };

    /** Render the main host video */
    const renderHostVideo = (p: any) => {
        const participantHasVideo = hasVideo(p);
        const participantHasAudio = hasAudio(p);

        return (
            <div className={`relative h-full w-full overflow-hidden bg-neutral-900 ${isMobile ? '' : 'rounded-3xl border border-white/5 shadow-2xl'}`}>
                {participantHasVideo ? (
                    <ParticipantView
                        participant={p}
                        className="h-full w-full object-cover"
                        ParticipantViewUI={null}
                    />
                ) : (
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

                {/* Mic off indicator */}
                {!participantHasAudio && !(isMobile && !isViewer) && (
                    <div className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-red-500/80 backdrop-blur-md flex items-center justify-center border border-red-400/50">
                        <MicOff className="w-4 h-4 text-white" />
                    </div>
                )}

                {/* Pin badge for host */}
                {isChatVisible && (
                    <div className="absolute bottom-4 left-4 right-4">
                        {isViewer && !isMobile ? (
                            <StreamerInfoOverlay
                                streamerName={p.name || 'Host'}
                                streamerImage={p.image}
                            />
                        ) : (
                            <button
                                onClick={() => openProfileModal(p.name || 'Host')}
                                className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium border border-white/10 inline-block cursor-pointer hover:bg-black/60 transition-colors"
                            >
                                {p.name || 'Host'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    /** Render a co-host video card (smaller, with badges) */
    const renderCoHostCard = (p: any) => {
        const participantHasVideo = hasVideo(p);
        const participantHasAudio = hasAudio(p);

        return (
            <div key={p.sessionId} className={`relative rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-xl ${isMobile ? 'w-28 h-36' : 'w-44 h-52'}`}>
                {participantHasVideo ? (
                    <ParticipantView
                        participant={p}
                        className="h-full w-full object-cover"
                        ParticipantViewUI={null}
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-800">
                        <div className={`rounded-full overflow-hidden border border-white/10 ${isMobile ? 'w-10 h-10' : 'w-14 h-14'}`}>
                            {p.image ? (
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-[#FF8800]/20 flex items-center justify-center">
                                    <span className={`font-bold text-[#FF8800] ${isMobile ? 'text-lg' : 'text-xl'}`}>
                                        {(p.name || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="text-white/50 text-xs mt-1">{p.name || 'Guest'}</span>
                    </div>
                )}

                {/* Disconnect badge — top left */}
                {!isViewer && (
                    <button
                        onClick={() => handleKickCoHost(p.userId, p.name || p.userId)}
                        className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-lg border border-red-400/50 hover:bg-red-600 transition-colors cursor-pointer"
                        title="Remove from stream"
                    >
                        <PhoneOff className="w-3.5 h-3.5 text-white" />
                    </button>
                )}

                {/* Mic status badge — top right */}
                <div className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border ${participantHasAudio
                    ? 'bg-white/10 backdrop-blur-md border-white/10'
                    : 'bg-red-500/80 border-red-400/50'
                    }`}>
                    {participantHasAudio ? (
                        <Mic className="w-3.5 h-3.5 text-white/70" />
                    ) : (
                        <MicOff className="w-3.5 h-3.5 text-white" />
                    )}
                </div>
            </div>
        );
    };

    if (!host) {
        return (
            <div className="flex h-full w-full items-center justify-center p-6 pt-28">
                <div className="flex-1 flex items-center justify-center rounded-3xl bg-neutral-900 border border-white/5 max-w-sm aspect-9/16">
                    <span className="text-white/50 text-lg">Streamer not available</span>
                </div>
            </div>
        );
    }

    /* ===== MOBILE LAYOUT ===== */
    if (isMobile) {
        return (
            <div className="relative h-full w-full overflow-hidden">
                {/* Host video — full screen */}
                {renderHostVideo(host)}

                {/* Co-host cards — stacked right side */}
                {coHosts.length > 0 && (
                    <div className="absolute top-20 right-3 z-10 flex flex-col gap-3">
                        {coHosts.map((p) => renderCoHostCard(p))}
                    </div>
                )}
            </div>
        );
    }

    /* ===== DESKTOP LAYOUT ===== */

    // 2 participants: side by side equal
    if (coHosts.length === 1) {
        return (
            <div className="flex h-full w-full p-6 pt-28 overflow-hidden">
                <div className="flex-1 h-full flex justify-center gap-4">
                    <div className="h-full aspect-9/16 max-w-sm">
                        {renderHostVideo(host)}
                    </div>
                    <div className="h-full aspect-9/16 max-w-sm relative rounded-3xl overflow-hidden bg-neutral-900 border border-white/5 shadow-2xl">
                        {(() => {
                            const p = coHosts[0];
                            const participantHasVideo = hasVideo(p);
                            const participantHasAudio = hasAudio(p);
                            return (
                                <>
                                    {participantHasVideo ? (
                                        <ParticipantView
                                            participant={p}
                                            className="h-full w-full object-cover"
                                            ParticipantViewUI={null}
                                        />
                                    ) : (
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
                                            <span className="text-white/60 text-sm font-medium">{p.name || 'Guest'}</span>
                                        </div>
                                    )}
                                    {/* Disconnect badge — top left */}
                                    {!isViewer && (
                                        <button
                                            onClick={() => handleKickCoHost(p.userId, p.name || p.userId)}
                                            className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg border border-red-400/50 hover:bg-red-600 transition-colors cursor-pointer"
                                        >
                                            <PhoneOff className="w-4 h-4 text-white" />
                                        </button>
                                    )}
                                    {/* Mic badge — top right */}
                                    <div className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border ${participantHasAudio ? 'bg-white/10 backdrop-blur-md border-white/10' : 'bg-red-500/80 border-red-400/50'}`}>
                                        {participantHasAudio ? <Mic className="w-4 h-4 text-white/70" /> : <MicOff className="w-4 h-4 text-white" />}
                                    </div>
                                    {/* Name badge */}
                                    {isChatVisible && (
                                        <div className="absolute bottom-4 left-4">
                                            <span className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium border border-white/10 inline-block">
                                                {p.name || 'Guest'}
                                            </span>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>
        );
    }

    // 3+ participants: main host + right sidebar
    return (
        <div className="flex h-full w-full p-6 pt-28 overflow-hidden">
            <div className="relative flex-1 h-full flex justify-center">
                <div className="h-full aspect-9/16 max-w-md">
                    {renderHostVideo(host)}
                </div>
                <div className="ml-4 flex flex-col gap-4 justify-start py-4">
                    {coHosts.map((p) => renderCoHostCard(p))}
                </div>
            </div>
        </div>
    );
};

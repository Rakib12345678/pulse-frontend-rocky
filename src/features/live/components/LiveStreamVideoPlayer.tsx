import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useCallStateHooks, ParticipantView, hasVideo, hasAudio, OwnCapability } from '@stream-io/video-react-sdk';
import { useChatContext } from 'stream-chat-react';
import { useLiveStreamContext } from './LiveStreamLayout';
import { useNavigate } from '@tanstack/react-router';
import { StreamerInfoOverlay } from './StreamerInfoOverlay';
import { MicOff, VideoOff, PhoneOff, Mic, Pin } from 'lucide-react';
import { useGoLiveStore } from '../stores/goLiveStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUserProfileStore } from '../stores/userProfileStore';
import { liveService } from '../services/live.service';
import kick from '@/assets/kick.svg';
import { cn } from '@/lib/utils';
import { useParticipantPresence } from '../hooks/useParticipantPresence';
import { useParticipantPresenceStore } from '../stores/participantPresenceStore';

export const LiveStreamVideoPlayer: React.FC = () => {
    const { useParticipants } = useCallStateHooks();
    const { isViewer, isGuest, isChatVisible, call } = useLiveStreamContext();
    const isHost = !isViewer;
    const { client: chatClient } = useChatContext();
    const channel = React.useMemo(() => (call && chatClient) ? chatClient.channel('livestream', call.id) : null, [chatClient, call?.id]);
    const participants = useParticipants();

    // Helper to extract fullName from participant custom fields
    const getFullName = (p: any): string =>
        p?.custom?.fields?.fullName?.kind?.stringValue || p.name || '';

    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { openModal: openProfileModal } = useUserProfileStore();

    // Confirmation modal state for kicking a co-host
    const [confirmKick, setConfirmKick] = useState<{ userId: string; userName: string } | null>(null);

    // --- Participant Presence ---
    // Viewers: send heartbeat while tab is visible
    useParticipantPresence(call, isViewer);

    // Host: listen for presence events and track active viewers
    const { markActive, markInactive, pruneStale, clear: clearPresence } = useParticipantPresenceStore();

    useEffect(() => {
        if (!call || !isHost) return;

        const unsubscribe = call.on('custom', (event: any) => {
            const customData = event?.custom;
            const senderUserId = event?.user?.id;
            if (!senderUserId) return;

            if (customData?.type === 'presence-heartbeat') {
                markActive(senderUserId);
            } else if (customData?.type === 'presence-inactive') {
                markInactive(senderUserId);
            }
        });

        // Prune stale entries every 5 seconds
        const pruneInterval = setInterval(pruneStale, 5000);

        return () => {
            unsubscribe();
            clearInterval(pruneInterval);
            clearPresence();
        };
    }, [call, isHost, markActive, markInactive, pruneStale, clearPresence]);


    // Get the call creator ID to always show the host
    const creatorId = call?.state.createdBy?.id;

    // Filter participants: show host always, others only if they are co-hosts and actively connected
    const activeParticipants = participants.filter((p: any) => {
        // Exclude users who are offline or have left
        if (p.connectionQuality === 'offline' || !p.sessionId) return false;

        if (p.isLocalParticipant && !isViewer) return true;
        if (creatorId && p.userId === creatorId) return true;

        // A user is a co-host if they have the role OR they have publishing capabilities
        const isCoHostRole = p.roles?.includes('co_host') || p.roles?.includes('admin') || p.roles?.includes('host');
        const hasCapabilities = p.capabilities?.includes('send-audio') || p.capabilities?.includes('send-video');

        const hasActiveTracks = p.publishedTracks?.length > 0;

        return isCoHostRole || (hasCapabilities && hasActiveTracks);
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

            // Only auto-navigate for viewers. Hosts handle their own end-stream flow.
            if (!isHost) {
                useGoLiveStore.getState().setEndingStream(true);
                toast.info('Stream has ended');
                navigate({ to: '/for-you' });
            }
        });

        let pollInterval: NodeJS.Timeout;
        if (isGuest) {
            pollInterval = setInterval(async () => {
                try {
                    const callState = await call.get();
                    if (callState.call.ended_at && !isHost) {
                        toast.info('Stream has ended');
                        navigate({ to: '/for-you' });
                    }
                } catch (e) {
                    if (!isHost) {
                        toast.info('Stream has ended');
                        navigate({ to: '/for-you' });
                    }
                }
            }, 5000);
        }

        return () => {
            unsubscribe();
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [call, navigate, isGuest, isHost]);

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

            // Revoke publisher permissions
            await call.updateUserPermissions({
                user_id: userId,
                revoke_permissions: [
                    OwnCapability.SEND_AUDIO,
                    OwnCapability.SEND_VIDEO,
                ],
            });
            // Revoke the exact 'co_host' role
            await call.updateCallMembers({
                update_members: [{ user_id: userId, role: 'user' }],
            });
            // Notify the co-host they were kicked
            await call.sendCustomEvent({
                type: 'kicked',
                userId,
            });

            // Hit the leave endpoint here
            if (call.id) {
                await liveService.removeCoHost(call.id, userName);
            }

            if (channel) {
                try {
                    await channel.sendMessage({
                        text: `@${userName} was kicked`,
                    });
                } catch (e) {
                    console.error('Failed to send kick chat message:', e);
                }
            }

            toast.success(`Removed @${userName} from stream`);
        } catch (err) {
            console.error('[Kick] Failed to kick co-host:', err);
            toast.error('Failed to remove co-host');
        }
    };

    /** Mute a co-host's audio — only the co-host can unmute themselves */
    const handleMuteCoHost = async (userId: string, userName: string) => {
        if (!call || isViewer) return;
        try {
            await call.muteUser(userId, 'audio');
            toast.success(`Muted @${userName}`);
        } catch (err) {
            console.error('[Mute] Failed to mute co-host:', err);
            toast.error('Failed to mute co-host');
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
                                        {(getFullName(p) || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="text-white/60 text-sm font-medium">{getFullName(p) || 'Host'}</span>
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

                {/* Pin icon — shown when co-hosts are present */}
                {coHosts.length > 0 && (
                    <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-[#F5C842] flex items-center justify-center shadow-lg">
                        <Pin className="w-4 h-4 text-black fill-black" />
                    </div>
                )}

                {/* Name badge for host */}
                {isChatVisible && !p.isLocalParticipant && (
                    <div className="absolute bottom-4 left-4 right-4">
                        {isViewer && !isMobile ? (
                            <StreamerInfoOverlay
                                streamerName={getFullName(p) || 'Host'}
                                streamerUsername={p.name}
                                streamerImage={p.image}
                            />
                        ) : (
                            <button
                                onClick={() => {
                                    if (!p.isLocalParticipant) {
                                        openProfileModal(p.name || 'Host');
                                    }
                                }}
                                className={cn(
                                    "bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium border border-white/10 inline-block transition-colors",
                                    !p.isLocalParticipant ? "cursor-pointer hover:bg-black/60" : "cursor-default"
                                )}
                            >
                                {getFullName(p) || 'Host'}
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderCoHostCard = (p: any, className?: string) => {
        const participantHasVideo = hasVideo(p);
        const participantHasAudio = hasAudio(p);

        return (
            <div key={p.sessionId} className={cn(
                "relative rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-xl",
                isMobile ? 'w-28 h-36' : (className || 'w-44 h-52')
            )}>
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
                                        {(getFullName(p) || 'U').charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        <span className="text-white/50 text-xs mt-1">{getFullName(p) || 'Guest'}</span>
                    </div>
                )}

                {/* Disconnect badge — top left */}
                {!isViewer && (
                    <button
                        onClick={() => setConfirmKick({ userId: p.userId, userName: p.name || p.userId })}
                        className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-red-500 flex items-center justify-center shadow-lg border border-red-400/50 hover:bg-red-600 transition-colors cursor-pointer"
                        title="Remove from stream"
                    >
                        <PhoneOff className="w-3.5 h-3.5 text-white" />
                    </button>
                )}

                {/* Mic status badge — top right */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isViewer && participantHasAudio) {
                            handleMuteCoHost(p.userId, p.name || 'Guest');
                        }
                    }}
                    disabled={isViewer || !participantHasAudio}
                    title={!isViewer && participantHasAudio ? 'Mute co-host' : ''}
                    className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border outline-none ${!isViewer && participantHasAudio ? 'cursor-pointer hover:bg-white/20' : ''
                        } ${participantHasAudio
                            ? 'bg-white/10 backdrop-blur-md border-white/10'
                            : 'bg-red-500/80 border-red-400/50'
                        }`}
                >
                    {participantHasAudio ? (
                        <Mic className="w-3.5 h-3.5 text-white/70" />
                    ) : (
                        <MicOff className="w-3.5 h-3.5 text-white" />
                    )}
                </button>

                {/* Name badge */}
                {isChatVisible && !p.isLocalParticipant && (
                    <div className="absolute bottom-2 left-2">
                        <button
                            onClick={() => openProfileModal(p.name || 'Guest')}
                            className="bg-black/40 backdrop-blur-md px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium border border-white/10 inline-block cursor-pointer hover:bg-black/60 transition-colors"
                        >
                            {getFullName(p) || 'Guest'}
                        </button>
                    </div>
                )}
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

                {/* Kick confirmation modal */}
                {confirmKick && (
                    <RemoveCoHostModal
                        onConfirm={() => { handleKickCoHost(confirmKick.userId, confirmKick.userName); setConfirmKick(null); }}
                        onCancel={() => setConfirmKick(null)}
                    />
                )}
            </div>
        );
    }

    /* ===== DESKTOP: host + 1 co-host ===== */
    if (coHosts.length === 1) {
        return (
            <div className="flex h-full w-full p-6 pt-28 pb-32 overflow-hidden">
                <div className="flex-1 h-full flex justify-center gap-4">
                    <div className="h-full w-fit aspect-9/16 max-w-sm">
                        {renderHostVideo(host)}
                    </div>
                    <div className="h-full w-fit aspect-9/16 max-w-sm relative rounded-3xl overflow-hidden bg-neutral-900 border border-white/5 shadow-2xl">
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
                                                            {(getFullName(p) || 'U').charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-white/60 text-sm font-medium">{getFullName(p) || 'Guest'}</span>
                                        </div>
                                    )}
                                    {/* Disconnect badge — top left */}
                                    {!isViewer && (
                                        <button
                                            onClick={() => setConfirmKick({ userId: p.userId, userName: p.name || p.userId })}
                                            className="absolute top-3 left-3 z-10 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shadow-lg border border-red-400/50 hover:bg-red-600 transition-colors cursor-pointer"
                                        >
                                            <PhoneOff className="w-4 h-4 text-white" />
                                        </button>
                                    )}
                                    {/* Mic badge — top right */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isViewer && participantHasAudio) {
                                                handleMuteCoHost(p.userId, p.name || 'Guest');
                                            }
                                        }}
                                        disabled={isViewer || !participantHasAudio}
                                        title={!isViewer && participantHasAudio ? 'Mute co-host' : ''}
                                        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-lg border outline-none ${!isViewer && participantHasAudio ? 'cursor-pointer hover:bg-white/20' : ''
                                            } ${participantHasAudio ? 'bg-white/10 backdrop-blur-md border-white/10' : 'bg-red-500/80 border-red-400/50'}`}
                                    >
                                        {participantHasAudio ? <Mic className="w-4 h-4 text-white/70" /> : <MicOff className="w-4 h-4 text-white" />}
                                    </button>
                                    {/* Name badge */}
                                    {isChatVisible && !p.isLocalParticipant && (
                                        <div className="absolute bottom-4 left-4">
                                            <button
                                                onClick={() => openProfileModal(p.name || 'Guest')}
                                                className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-medium border border-white/10 inline-block cursor-pointer hover:bg-black/60 transition-colors"
                                            >
                                                {getFullName(p) || 'Guest'}
                                            </button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>

                {/* Kick confirmation modal */}
                {confirmKick && (
                    <RemoveCoHostModal
                        onConfirm={() => { handleKickCoHost(confirmKick!.userId, confirmKick!.userName); setConfirmKick(null); }}
                        onCancel={() => setConfirmKick(null)}
                    />
                )}
            </div>
        );
    }

    // 3-4 participants: Host on left, 2-3 Co-hosts stacked on right (50/50 split)
    if (coHosts.length === 2 || coHosts.length === 3) {
        return (
            <div className="flex h-full w-full p-6 pt-28 pb-32 overflow-hidden">
                <div className="flex-1 h-full flex justify-center gap-6">
                    {/* Host Column */}
                    <div className="h-full w-fit aspect-9/16 max-w-sm">
                        {renderHostVideo(host)}
                    </div>
                    {/* Co-host Column (stacked) */}
                    <div className="h-full w-fit aspect-9/16 flex flex-col gap-4 max-w-sm">
                        {coHosts.map((p) => (
                            <div key={p.sessionId} className="flex-1 min-h-0">
                                {renderCoHostCard(p, "w-full h-full")}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Kick confirmation modal */}
                {confirmKick && (
                    <RemoveCoHostModal
                        onConfirm={() => { handleKickCoHost(confirmKick!.userId, confirmKick!.userName); setConfirmKick(null); }}
                        onCancel={() => setConfirmKick(null)}
                    />
                )}
            </div>
        );
    }

    // 4+ participants: main host + right sidebar
    return (
        <div className="flex h-full w-full p-6 pt-28 pb-32 overflow-hidden">
            <div className="relative flex-1 h-full flex justify-center">
                <div className="h-full w-fit aspect-9/16 max-w-md">
                    {renderHostVideo(host)}
                </div>
                <div className="ml-4 flex flex-col gap-4 justify-start py-4">
                    {coHosts.map((p) => renderCoHostCard(p))}
                </div>
            </div>
            {confirmKick && (
                <RemoveCoHostModal
                    onConfirm={() => { handleKickCoHost(confirmKick!.userId, confirmKick!.userName); setConfirmKick(null); }}
                    onCancel={() => setConfirmKick(null)}
                />
            )}
        </div>
    );
};

/** Confirmation modal before kicking a co-host from the stream */
const RemoveCoHostModal: React.FC<{
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
        <div className="bg-[#1c1c1e] rounded-3xl p-8 w-full max-w-sm flex flex-col items-center gap-5 shadow-2xl">
            <img src={kick} alt="kick" className="w-12 h-12" />
            <p className="text-white text-xl font-semibold text-center leading-snug">
                Do you want to remove the user from the live stream?
            </p>
            <div className="flex gap-3 w-full mt-1">
                <button
                    onClick={onConfirm}
                    className="flex-1 py-3.5 rounded-full bg-[#FF8800] text-black font-semibold text-base hover:bg-[#ff9a22] active:scale-95 transition-all"
                >
                    Yes! Remove
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 py-3.5 rounded-full border-2 border-[#FF8800] text-[#FF8800] font-semibold text-base hover:bg-[#FF8800]/10 active:scale-95 transition-all"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

import React, { useEffect, useState } from 'react';
import {
    useCall,
    useCallStateHooks,
    OwnCapability,
} from '@stream-io/video-react-sdk';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useJoinRequestStore } from '@/features/live/stores/joinRequestStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { liveService } from '@/features/live/services/live.service';

export const MAX_COHOSTS = 3;

interface JoinRequest {
    userId: string;
    userName: string;
    userImage?: string;
}

export const JoinRequestPopup: React.FC = () => {
    const call = useCall();
    const { useLocalParticipant, useParticipants } = useCallStateHooks();
    const localParticipant = useLocalParticipant();
    const participants = useParticipants();
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
    const isMobile = useIsMobile();

    // Count current active co-hosts (exclude the host/creator)
    const creatorId = call?.state.createdBy?.id;
    const currentCoHostCount = participants.filter((p: any) => {
        if (p.userId === creatorId) return false; // skip host
        if (p.userId === localParticipant?.userId && !p.roles?.includes('co_host')) return false;
        const isCoHost = p.roles?.includes('co_host') || p.roles?.includes('admin') ||
            p.capabilities?.includes('send-video');
        return isCoHost;
    }).length;

    const isStageFull = currentCoHostCount >= MAX_COHOSTS;

    useEffect(() => {
        if (!call) return;

        const unsubscribe = call.on('custom', (event: any) => {
            const customData = event?.custom;
            if (customData?.type === 'join-request' && customData?.userId !== localParticipant?.userId) {
                setJoinRequests((prev) => {
                    // Avoid duplicates
                    if (prev.some((r) => r.userId === customData.userId)) return prev;
                    return [...prev, {
                        userId: customData.userId,
                        userName: customData.userName || customData.userId,
                        userImage: customData.userImage,
                    }];
                });
            } else if (customData?.type === 'cancel-join-request') {
                setJoinRequests((prev) => prev.filter((r) => r.userId !== customData.userId));
            }
        });
        return () => { unsubscribe(); };
    }, [call, localParticipant]);

    if (!call || joinRequests.length === 0) return null;

    const handleApprove = async (request: JoinRequest) => {
        // Enforce max co-host limit (re-check at approval time in case someone joined since render)
        const liveCoHostCount = participants.filter((p: any) => {
            if (p.userId === creatorId) return false;
            if (p.userId === localParticipant?.userId && !p.roles?.includes('co_host')) return false;
            return p.roles?.includes('co_host') || p.roles?.includes('admin') ||
                p.capabilities?.includes('send-video');
        }).length;

        if (liveCoHostCount >= MAX_COHOSTS) {
            toast.error(`Stage is full (max ${MAX_COHOSTS} co-hosts). Remove someone first.`);
            // Auto-decline the request so the viewer knows
            try {
                await call.sendCustomEvent({
                    type: 'join-response', userId: request.userId, accepted: false,
                });
            } catch (err) {
                console.error('[JoinRequestPopup] Failed to send stage-full decline:', err);
            }
            setJoinRequests((prev) => prev.filter((r) => r.userId !== request.userId));
            return;
        }

        try {
            // Grant permissions and assign the co-host role so they are recognized by all viewers
            await call.updateUserPermissions({
                user_id: request.userId,
                grant_permissions: [
                    OwnCapability.SEND_AUDIO,
                    OwnCapability.SEND_VIDEO,
                ],
            });
            // Also explicitly upgrade their role to 'co-host'
            await call.updateCallMembers({
                update_members: [{ user_id: request.userId, role: 'co_host' }],
            });

            // Notify the viewer they were accepted
            await call.sendCustomEvent({
                type: 'join-response', userId: request.userId, accepted: true,
            });

            // Add co-host to the backend
            if (call.id) {
                await liveService.addCoHost(call.id, request.userName);
            }

            toast.success(`@${request.userName} joined as co-host`);
        } catch (err) {
            console.error('[JoinRequestPopup] Failed to grant permissions:', err);
            toast.error(`Failed to add @${request.userName} as co-host`);
        }
    };

    const handleDecline = async (request: JoinRequest) => {
        try {
            // Notify the viewer they were declined
            await call.sendCustomEvent({
                type: 'join-response', userId: request.userId, accepted: false,
            });
            toast(`Declined @${request.userName}'s request`);
        } catch (err) {
            console.error('[JoinRequestPopup] Failed to send decline:', err);
            toast.error(`Failed to decline @${request.userName}'s request`);
        }
        setJoinRequests((prev) => prev.filter((r) => r.userId !== request.userId));
    };

    return (
        <div className={`absolute z-40 flex flex-col gap-3 ${isMobile ? 'bottom-44 left-4 right-4' : 'bottom-20 right-10 w-[24rem]'}`}>
            {joinRequests.map((request, idx) => (
                <div
                    key={`${request.userId}-${idx}`}
                    className={cn(
                        "p-5 rounded-2xl",
                        "bg-[#232323]",
                        "shadow-2xl shadow-black/30",
                        "animate-in slide-in-from-bottom-5 duration-300"
                    )}
                >
                    {/* User info */}
                    <div className="flex flex-col gap-2 mb-6">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 border border-white/40 shrink-0">
                                <AvatarImage src={request.userImage} alt={request.userName} />
                                <AvatarFallback className="bg-zinc-800 text-white font-bold text-sm">
                                    {request.userName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-wrap items-center gap-x-2">
                                <span className="text-[#a0a0a0] text-[17px]">@{request.userName}</span>
                                <span className="text-white text-[17px] font-medium">wants to join you on this live stream</span>
                            </div>
                        </div>
                    </div>

                    {/* Stage count indicator */}
                    {isStageFull && (
                        <div className="text-xs text-amber-400/80 mb-2 text-center">
                            Stage full ({currentCoHostCount}/{MAX_COHOSTS} co-hosts) — remove someone to accept
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleApprove(request)}
                            disabled={isStageFull}
                            className={`flex-1 py-3 rounded-full font-medium text-[19px] transition-all active:scale-95 ${
                                isStageFull
                                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                                    : 'bg-[#FF7B00] text-black hover:bg-[#ff8822]'
                            }`}
                        >
                            {isStageFull ? 'Stage Full' : 'Accept'}
                        </button>
                        <button
                            onClick={() => handleDecline(request)}
                            className="flex-1 py-3 rounded-full border-2 border-[#FF0000] text-[#FF0000] font-medium text-[19px] bg-transparent transition-all hover:bg-[#FF0000]/10 active:scale-95"
                        >
                            Decline
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

/** Decline notification banner shown to the viewer when their request is declined */
export const JoinDeclineBanner: React.FC = () => {
    const { declineMessage, clearDeclineMessage } = useJoinRequestStore();

    useEffect(() => {
        if (declineMessage) {
            const timer = setTimeout(() => clearDeclineMessage(), 5000);
            return () => clearTimeout(timer);
        }
    }, [declineMessage, clearDeclineMessage]);

    if (!declineMessage) return null;

    return (
        <div className="absolute bottom-44 left-4 right-4 z-40 animate-in slide-in-from-bottom-5 duration-300">
            <div className="bg-red-500 rounded-2xl p-5 shadow-2xl shadow-black/30">
                <p className="text-white text-sm leading-relaxed">
                    {declineMessage}
                </p>
            </div>
        </div>
    );
};

/** Viewer-side popup showing when a request is pending. Handles 15s auto-cancel. */
export const ViewerPendingRequestPopup: React.FC = () => {
    const { requestStatus, setRequestStatus } = useJoinRequestStore();
    const { user } = useAuthStore();
    const call = useCall();
    const { useCallCreatedBy } = useCallStateHooks();
    const createdBy = useCallCreatedBy();

    useEffect(() => {
        if (requestStatus !== 'pending') return;
        let cancelled = false;

        const timer = setTimeout(async () => {
            // Host hasn't responded in 15 seconds, auto-cancel
            if (cancelled) return;
            try {
                if (call && user) {
                    await call.sendCustomEvent({
                        type: 'cancel-join-request',
                        userId: String(user.id),
                    });
                }
            } catch (err) {
                console.error('[ViewerPendingRequestPopup] Failed to auto-cancel request:', err);
            } finally {
                if (!cancelled) {
                    setRequestStatus('idle');
                }
            }
        }, 15000);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [requestStatus, call, user, setRequestStatus]);

    if (requestStatus !== 'pending' || !createdBy) return null;

    const hostName = createdBy.name || createdBy.id || 'Host';
    const hostImage = createdBy.image as string | undefined;

    const handleCancel = async () => {
        try {
            if (call && user) {
                await call.sendCustomEvent({
                    type: 'cancel-join-request',
                    userId: String(user.id),
                });
            }
        } catch (err) {
            console.error('[ViewerPendingRequestPopup] Failed to cancel request:', err);
        } finally {
            setRequestStatus('idle');
        }
    };

    return (
        <div className="absolute z-40 bottom-44 left-4 right-4 sm:bottom-20 sm:left-auto sm:right-10 sm:w-80">
            <div
                className={cn(
                    "p-5 rounded-2xl",
                    "bg-[#232323]",
                    "shadow-2xl shadow-black/30",
                    "animate-in slide-in-from-bottom-5 duration-300"
                )}
            >
                {/* Host info */}
                <div className="flex flex-col gap-2 mb-6">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border border-white/40 shrink-0">
                            <AvatarImage src={hostImage} alt={hostName} />
                            <AvatarFallback className="bg-zinc-800 text-white font-bold text-sm">
                                {hostName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-wrap items-center gap-x-2">
                            <span className="text-[#a0a0a0] text-[17px]">@{hostName}</span>
                            <span className="text-white text-[17px] font-medium">Join Request Pending</span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleCancel}
                    className="w-full py-3 rounded-full border-2 border-[#FF0000] text-[#FF0000] font-medium text-[19px] bg-transparent transition-all hover:bg-[#FF0000]/10 active:scale-95"
                >
                    Decline your Join Request
                </button>
            </div>
        </div>
    );
};
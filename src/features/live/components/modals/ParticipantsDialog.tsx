import React, { useState, useEffect, useRef } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useUserProfileStore } from '@/features/live/stores/userProfileStore';
import { userService } from '@/features/live/services/user.service';
import { useParticipantPresenceStore } from '@/features/live/stores/participantPresenceStore';

// Helper to extract fullName from participant custom fields
const getFullName = (p: any): string =>
    p?.custom?.fields?.fullName?.kind?.stringValue || p?.name || '';

export const ParticipantsDialog: React.FC = () => {
    const { useParticipants, useCallCreatedBy } = useCallStateHooks();
    const participants = useParticipants();
    const createdBy = useCallCreatedBy();
    const connectedParticipants = participants.filter((p: any) => {
        const isCreator = p.roles?.includes('host') || p.roles?.includes('admin') || p.userId === createdBy?.id;
        return p.connectionQuality !== 'offline' && !!p.sessionId && !isCreator;
    });

    // Only show participants who have an active presence heartbeat
    const { getActiveUserIds } = useParticipantPresenceStore();
    const activeUserIds = new Set(getActiveUserIds());
    const activeParticipants = connectedParticipants.filter((p: any) => {
        // Always show the local participant (self)
        if (p.isLocalParticipant) return true;
        // Co-hosts are always shown (they have publishing capabilities)
        const isCoHost = p.roles?.includes('co_host') ||
            p.capabilities?.includes('send-audio') ||
            p.capabilities?.includes('send-video');
        if (isCoHost) return true;
        // Regular viewers: only show if they have an active heartbeat
        return activeUserIds.has(p.userId);
    });
    const { user } = useAuthStore();
    const { openModal } = useUserProfileStore();

    const [followStatuses, setFollowStatuses] = useState<Record<number, boolean>>({});
    const [loadingFollow, setLoadingFollow] = useState<Record<number, boolean>>({});
    const fetchedIdsRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!user) return;

        const fetchFollowStatuses = async () => {
            const usersToCheck = activeParticipants
                .filter(p => !p.isLocalParticipant)
                .map(p => ({
                    userId: parseInt(p.userId, 10),
                    username: p.name || "",
                }))
                .filter(u => !isNaN(u.userId) && u.username && !fetchedIdsRef.current.has(u.userId));

            if (usersToCheck.length > 0) {
                usersToCheck.forEach(u => fetchedIdsRef.current.add(u.userId));
                try {
                    const statuses = await userService.getFollowStatuses(usersToCheck);
                    const newStatuses: Record<number, boolean> = {};
                    statuses.forEach((status) => {
                        newStatuses[status.userId] = status.isFollowing;
                    });
                    setFollowStatuses(prev => ({ ...prev, ...newStatuses }));
                } catch (error) {
                    console.error('Failed to fetch follow statuses:', error);
                    usersToCheck.forEach(u => fetchedIdsRef.current.delete(u.userId));
                }
            }
        };

        fetchFollowStatuses();
    }, [participants, user]);

    const toggleFollow = async (e: React.MouseEvent, targetUserId: number) => {
        e.stopPropagation();
        if (loadingFollow[targetUserId] || !user) return;

        setLoadingFollow(prev => ({ ...prev, [targetUserId]: true }));
        const isFollowing = followStatuses[targetUserId];

        try {
            if (isFollowing) {
                await userService.unfollowUser(targetUserId);
            } else {
                await userService.followUser(targetUserId);
            }
            setFollowStatuses(prev => ({ ...prev, [targetUserId]: !isFollowing }));
        } catch (error) {
            console.error('Failed to toggle follow status:', error);
        } finally {
            setLoadingFollow(prev => ({ ...prev, [targetUserId]: false }));
        }
    };

    return (
        <DialogContent className="sm:max-w-[380px] bg-[#0f1117] border-white/5 text-white fixed top-[50%] right-6 left-auto translate-x-0 translate-y-[-50%] rounded-2xl max-h-[70vh]">
            <DialogHeader className="flex flex-row items-center justify-between">
                <DialogTitle className="text-xl font-bold mt-2">Participants ({activeParticipants.length})</DialogTitle>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-4">
                    {activeParticipants.map((participant: any) => {
                        const isMe = participant.isLocalParticipant;
                        const isCreator = participant.roles?.includes('host') || participant.roles?.includes('admin') || participant.userId === createdBy?.id;
                        const isCoHost = !isCreator && (
                            participant.roles?.includes('co_host') ||
                            participant.capabilities?.includes('send-audio') ||
                            participant.capabilities?.includes('send-video')
                        );

                        const displayName = (isMe && user) ? (user.fullName || user.username) : getFullName(participant);
                        const displayImage = (isMe && user) ? user.profileImage : participant.image;
                        const modalUsername = (isMe && user) ? user.username : participant.name;

                        let roleLabel = 'Viewer';
                        if (isCreator) roleLabel = isMe ? 'Host / You' : 'Host';
                        else if (isCoHost) roleLabel = isMe ? 'Co-Host / You' : 'Co-Host';
                        else if (isMe) roleLabel = 'You';

                        return (
                            <div
                                key={participant.sessionId}
                                className={cn("flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors", !isMe ? "cursor-pointer" : "")}
                                onClick={() => {
                                    if (modalUsername && !isMe) openModal(modalUsername);
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className={cn("h-10 w-10 border", isCreator ? "border-[#FF8800]" : (isCoHost ? "border-purple-500" : "border-white/10"))}>
                                        <AvatarImage src={displayImage} alt={displayName} />
                                        <AvatarFallback className={cn("font-bold text-white", isCreator ? "bg-[#FF8800]/20" : (isCoHost ? "bg-purple-500/20" : "bg-white/10"))}>
                                            {(displayName || 'U').charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">
                                            {displayName || 'Anonymous User'}
                                            {isMe && (
                                                <span className="ml-2 text-[10px] bg-[#FF8800] text-black px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    Me
                                                </span>
                                            )}
                                        </span>
                                        <span className={cn("text-xs", isCreator ? "text-[#FF8800]" : (isCoHost ? "text-purple-400" : "text-gray-500"))}>
                                            {roleLabel}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {!isMe && user && !isNaN(parseInt(participant.userId, 10)) && (
                                        <button
                                            onClick={(e) => toggleFollow(e, parseInt(participant.userId, 10))}
                                            disabled={loadingFollow[parseInt(participant.userId, 10)]}
                                            className={cn(
                                                "w-[80px] py-1.5 rounded-full text-xs font-medium transition-colors border flex items-center justify-center",
                                                followStatuses[parseInt(participant.userId, 10)]
                                                    ? "border-white/20 text-gray-400 hover:bg-white/5"
                                                    : "border-[#FF8800] text-[#FF8800] hover:bg-[#FF8800]/10",
                                                loadingFollow[parseInt(participant.userId, 10)] ? "opacity-50 cursor-not-allowed" : ""
                                            )}
                                        >
                                            {loadingFollow[parseInt(participant.userId, 10)] ? (
                                                <div className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                            ) : (
                                                followStatuses[parseInt(participant.userId, 10)] ? "Following" : "Follow"
                                            )}
                                        </button>
                                    )}
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        isCreator ? "bg-[#FF8800]" : (isCoHost ? "bg-purple-500" : "bg-blue-500")
                                    )} />
                                </div>
                            </div>
                        );

                    })}
                </div>
            </div>
        </DialogContent>
    );
};

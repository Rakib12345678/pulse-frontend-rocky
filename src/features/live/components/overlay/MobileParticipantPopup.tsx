import React, { useEffect, useRef, useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { userService } from '@/features/live/services/user.service';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useViewerVisibilityStore } from '@/features/live/stores/participantPresenceStore';
import { Loader2 } from 'lucide-react';

const getFullName = (p: any): string =>
    p?.custom?.fields?.fullName?.kind?.stringValue || p?.name || '';

interface MobileParticipantPopupProps {
    onClose: () => void;
}

export const MobileParticipantPopup: React.FC<MobileParticipantPopupProps> = ({ onClose }) => {
    const { useParticipants, useCallCreatedBy } = useCallStateHooks();
    const participants = useParticipants();
    const createdBy = useCallCreatedBy();
    const { user } = useAuthStore();
    const { hiddenUsers } = useViewerVisibilityStore();

    const connectedParticipants = participants.filter((p: any) => {
        const isCreator = p.roles?.includes('host') || p.roles?.includes('admin') || p.userId === createdBy?.id;
        return p.connectionQuality !== 'offline' && !!p.sessionId && !isCreator;
    });

    const activeParticipants = connectedParticipants.filter((p: any) => {
        if (p.isLocalParticipant) return true;
        const isCoHost = p.roles?.includes('co_host') ||
            p.capabilities?.includes('send-audio') ||
            p.capabilities?.includes('send-video');
        if (isCoHost) return true;
        return !hiddenUsers.has(p.userId);
    });

    const [followStatuses, setFollowStatuses] = useState<Record<number, boolean>>({});
    const [loadingFollow, setLoadingFollow] = useState<Record<number, boolean>>({});
    const fetchedRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!user || activeParticipants.length === 0) return;
        const toCheck = activeParticipants
            .filter(p => !p.isLocalParticipant)
            .map(p => ({ userId: parseInt(p.userId, 10), username: p.name || '' }))
            .filter(u => !isNaN(u.userId) && u.username && !fetchedRef.current.has(u.userId));

        if (toCheck.length > 0) {
            toCheck.forEach(u => fetchedRef.current.add(u.userId));
            userService.getFollowStatuses(toCheck).then(statuses => {
                const map: Record<number, boolean> = {};
                statuses.forEach(s => { map[s.userId] = s.isFollowing; });
                setFollowStatuses(prev => ({ ...prev, ...map }));
            }).catch(() => {
                toCheck.forEach(u => fetchedRef.current.delete(u.userId));
            });
        }
    }, [participants, user]);

    const toggleFollow = async (e: React.MouseEvent, targetId: number) => {
        e.stopPropagation();
        if (loadingFollow[targetId] || !user) return;
        setLoadingFollow(prev => ({ ...prev, [targetId]: true }));
        const isFollowing = followStatuses[targetId];
        try {
            if (isFollowing) {
                await userService.unfollowUser(targetId);
            } else {
                await userService.followUser(targetId);
            }
            setFollowStatuses(prev => ({ ...prev, [targetId]: !isFollowing }));
        } catch {
            // ignore
        } finally {
            setLoadingFollow(prev => ({ ...prev, [targetId]: false }));
        }
    };

    // Close on outside click
    const popupRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div
            ref={popupRef}
            className="absolute top-20 right-4 z-50 w-72 rounded-2xl bg-[#1C1C1E]/95 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden"
        >
            <div className="py-2 px-1 max-h-64 overflow-y-auto scrollbar-hide">
                {activeParticipants.length === 0 ? (
                    <p className="text-white/40 text-sm text-center py-4">No viewers yet</p>
                ) : (
                    activeParticipants.slice(0, 10).map((participant: any) => {
                        const isMe = participant.isLocalParticipant;
                        const displayName = (isMe && user) ? (user.fullName || user.username || '') : getFullName(participant);
                        const displayImage = (isMe && user) ? user.profileImage : participant.image;
                        const userId = parseInt(participant.userId, 10);
                        const isFollowing = followStatuses[userId];
                        const isLoading = loadingFollow[userId];

                        return (
                            <div
                                key={participant.sessionId}
                                className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors"
                            >
                                <Avatar className="h-9 w-9 shrink-0">
                                    <AvatarImage src={displayImage} className="object-cover" />
                                    <AvatarFallback className="bg-[#FF8800]/20 text-[#FF8800] font-bold text-sm">
                                        {(displayName || 'U').charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-white text-sm font-semibold truncate">
                                        @{participant.name || displayName || 'anonymous'}
                                    </span>
                                    {/* follower count if available */}
                                    <span className="text-white/40 text-xs">Viewer</span>
                                </div>
                                {!isMe && user && !isNaN(userId) && (
                                    <button
                                        onClick={(e) => toggleFollow(e, userId)}
                                        disabled={isLoading}
                                        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${isFollowing
                                            ? 'border-white/20 text-white/50 bg-white/5'
                                            : 'border-[#FF8800] text-[#FF8800] hover:bg-[#FF8800]/10'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

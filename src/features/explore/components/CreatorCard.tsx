import React from 'react';
// removed Button import
import { useToggleFollow } from '@/features/profile/services/profile.service';
import { Creator } from '../types/explore.types';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/UserAvatar';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import coHostIcon from '@/assets/co-host.svg';

interface CreatorCardProps {
    creator: Creator;
}

export const CreatorCard: React.FC<CreatorCardProps> = ({ creator }) => {
    const { mutate: toggleFollow, isPending } = useToggleFollow();
    const navigate = useNavigate();

    const handleFollowClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFollow(
            { targetUserId: creator.id, followedByMe: creator.followedByMe || false },
            {
                onError: (err: any) => {
                    toast.error(err?.message || 'Failed to update follow status');
                }
            }
        );
    };

    const handleCardClick = () => {
        if (creator.username && !/^\d+$/.test(creator.username)) {
            navigate({ to: `/profile/${creator.username}` as any });
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className="relative bg-[#1A1C1E] rounded-2xl p-6 flex flex-col items-center border border-white/5 hover:border-white/10 transition-all group w-full shadow-lg h-auto cursor-pointer"
        >
            {/* Top Right: Cohosts */}
            {creator.cohosts && creator.cohosts.length > 0 && (
                <div className="absolute right-3 top-3 z-10 flex -space-x-3 items-center">
                    {creator.cohosts.map((cohost, idx) => (
                        <div
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (cohost.username && !/^\d+$/.test(cohost.username)) {
                                    navigate({ to: `/profile/${cohost.username}` as any });
                                }
                            }}
                            className="relative transition-transform duration-300 hover:scale-110 hover:z-20 cursor-pointer"
                            style={{ zIndex: creator.cohosts!.length - idx }}
                        >
                            <img
                                src={cohost.profileImage || `https://i.pravatar.cc/150?u=${cohost.username}`}
                                alt={cohost.username}
                                className="h-9 w-9 rounded-full object-cover bg-zinc-800"
                            />
                            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFE9C0] border border-white/20">
                                <img src={coHostIcon} className="h-2.5 w-2.5" alt="co-host" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <UserAvatar
                src={creator.profileImage}
                alt={creator.displayName}
                isLive={creator.isLive}
                callId={creator.callId}
                username={creator.username}
                size="lg"
                className="mb-5"
                clickable={true}
            />

            {/* Name & Username */}
            <div className="w-full text-center mb-5">
                <h3 className="text-white font-bold text-base leading-tight truncate px-1">
                    {creator.displayName || creator.username}
                </h3>
                <p className="text-gray-500 text-[11px] mt-0.5 truncate">
                    @{creator.username}
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {creator.category && (
                        <span className="text-[9px] font-bold text-[#FF8800] uppercase tracking-wider bg-[#FF8800]/10 px-2.5 py-0.5 rounded-full border border-[#FF8800]/20">
                            {creator.category}
                        </span>
                    )}
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                        {(creator.followerCount || 0).toLocaleString()} followers
                    </span>
                </div>
            </div>

            {/* Follow Button */}
            <button
                type="button"
                onClick={handleFollowClick}
                disabled={isPending || creator.isFollower}
                className={cn(
                    "w-[120px] h-[48px] rounded-[100px] py-3 px-6 flex items-center justify-center gap-4 text-xs font-bold transition-all shadow-lg",
                    creator.isFollower
                        ? "bg-[#262626] text-gray-500 cursor-not-allowed opacity-100"
                        : "bg-[#FF8800] text-black hover:bg-[#ff941a] shadow-orange-900/10 cursor-pointer"
                )}
            >
                {creator.isFollower ? 'Following' : 'Follow'}
            </button>
        </div>
    );
};

import React from 'react';
import { Button } from '@/components/ui/button';
import { useToggleFollow } from '@/features/profile/services/profile.service';
import { Creator } from '../types/explore.types';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

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
            { targetUserId: creator.id, followedByMe: creator.followedByMe },
            {
                onError: (err: any) => {
                    toast.error(err?.message || 'Failed to update follow status');
                }
            }
        );
    };

    const handleCardClick = () => {
        navigate({ to: `/profile/${creator.username}` as any });
    };

    return (
        <div 
            onClick={handleCardClick}
            className="bg-[#1A1C1E] rounded-3xl p-6 flex flex-col items-center border border-white/5 hover:border-white/10 transition-all group w-full shadow-lg h-auto cursor-pointer"
        >
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden mb-5 border-2 border-[#25282B] group-hover:border-[#FF8800]/50 transition-colors shrink-0">
                {creator.profileImage ? (
                    <img 
                        src={creator.profileImage} 
                        alt={creator.displayName} 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-[#25282B] flex items-center justify-center">
                        <User className="w-10 h-10 text-gray-500" />
                    </div>
                )}
            </div>

            {/* Name & Username */}
            <div className="w-full text-center mb-5">
                <h3 className="text-white font-bold text-lg leading-tight truncate px-1">
                    {creator.displayName || creator.username}
                </h3>
                <p className="text-gray-500 text-xs mt-0.5 truncate">
                    @{creator.username}
                </p>
                <div className="mt-3 flex justify-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                        {creator.followerCount.toLocaleString()} followers
                    </span>
                </div>
            </div>

            {/* Follow Button */}
            <Button
                onClick={handleFollowClick}
                disabled={isPending}
                className={creator.followedByMe 
                    ? "w-full bg-[#25282B] text-gray-400 hover:bg-[#2F3235] rounded-full h-11 text-xs font-bold cursor-pointer transition-all"
                    : "w-full bg-[#FF8800] text-black hover:bg-[#ff941a] rounded-full h-11 text-xs font-bold cursor-pointer transition-all shadow-lg shadow-orange-900/10"
                }
            >
                {creator.followedByMe ? 'Following' : 'Follow'}
            </Button>
        </div>
    );
};

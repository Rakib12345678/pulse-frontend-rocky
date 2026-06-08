import React, { useState, useEffect } from 'react';
import { Loader2, UserPlus, UserCheck } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { userService, UserProfile } from '@/features/live/services/user.service';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { useUserProfileStore } from '@/features/live/stores/userProfileStore';

interface StreamerInfoOverlayProps {
    streamerName: string;
    streamerUsername?: string; // username for API calls (falls back to streamerName)
    streamerImage?: string;
    className?: string;
}

export const StreamerInfoOverlay: React.FC<StreamerInfoOverlayProps> = ({
    streamerName,
    streamerUsername,
    streamerImage,
    className
}) => {
    const { user: currentUser } = useAuthStore();
    const { openModal: openLoginModal, setMode, setStep } = useSignUpStore();
    const { openModal: openProfileModal, followStateMap, setFollowState } = useUserProfileStore();

    // Use streamerUsername for API calls, fall back to streamerName
    const apiName = streamerUsername || streamerName;

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [followerCount, setFollowerCount] = useState<string>('0');

    // Derive follow state from the shared store so it stays in sync with UserProfileModal
    const isFollowing = profile ? (followStateMap[profile.id] ?? profile.followedByMe) : false;

    // Format follower count (e.g., 1.5k, 1M)
    const formatCount = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    useEffect(() => {
        const fetchProfile = async () => {
            if (!streamerName) return;
            try {
                // Remove '@'
                const cleanName = apiName.startsWith('@') ? apiName.slice(1) : apiName;
                const { data } = await userService.getUserProfile(cleanName);
                if (data) {
                    setProfile(data);
                    setFollowerCount(formatCount(data.followerCount));
                    // Only seed the store if there's no entry yet (avoids overwriting a
                    // follow toggled from UserProfileModal before this fetch finished)
                    if (!(data.id in followStateMap)) {
                        setFollowState(data.id, data.followedByMe);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch streamer profile", error);
            }
        };

        fetchProfile();
    }, [apiName, currentUser]); // Re-fetch if user logs in to get correct follow status

    const handleFollowToggle = async (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        // Prevent default for touch events to avoid double-firing with click
        if (e.type === 'touchend' && e.cancelable) {
            e.preventDefault();
        }

        if (!currentUser) {
            setMode('login');
            setStep('input');
            openLoginModal();
            return;
        }

        if (!profile) return;

        setIsLoading(true);
        try {
            if (isFollowing) {
                await userService.unfollowUser(profile.id);
                setFollowState(profile.id, false); // broadcast to all subscribers
                toast.success(`Unfollowed ${streamerName}`);
            } else {
                await userService.followUser(profile.id);
                setFollowState(profile.id, true); // broadcast to all subscribers
                toast.success(`Followed ${streamerName}`);
            }
        } catch (error) {
            toast.error("Failed to update follow status");
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileClick = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        openProfileModal(apiName);
    };

    if (!streamerName) return null;

    return (
        <div className={`flex items-center gap-2 bg-[#1A1A1A]/95 backdrop-blur-sm px-2.5 py-1.5 pr-2.5 rounded-full border border-white/5 max-w-full ${className}`}>
            <div
                className="relative cursor-pointer group shrink-0"
                onClick={handleProfileClick}
                onTouchEnd={handleProfileClick}
            >
                <Avatar className="h-8 w-8 border-2 border-[#FF4500]">
                    <AvatarImage src={profile?.profileImage || streamerImage} className="object-cover" />
                    <AvatarFallback>{streamerName[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
            </div>

            <div className="flex flex-col mr-1 min-w-0 flex-1">
                <span
                    className="text-white font-bold text-xs hover:underline cursor-pointer truncate"
                    onClick={handleProfileClick}
                    onTouchEnd={handleProfileClick}
                >
                    {streamerName.startsWith('@') ? streamerName : `${streamerName}`}
                </span>
                <span className="text-white/60 text-[10px] text-left truncate">
                    {followerCount} Followers
                </span>
            </div>

            {/* Don't show follow button if it's the current user */}
            {currentUser?.username !== (profile?.username || apiName.replace('@', '')) && (
                <button
                    className={`ml-auto shrink-0 h-8 w-8 rounded-full transition-all flex items-center justify-center ${isFollowing
                        ? "bg-[#262626] hover:bg-[#333]"
                        : "bg-[#FF8800] hover:bg-[#FF7700]"
                        }`}
                    onClick={handleFollowToggle}
                    onTouchEnd={handleFollowToggle}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className={`h-5 w-5 animate-spin ${isFollowing ? 'text-gray-400' : 'text-black'}`} />
                    ) : isFollowing ? (
                        <UserCheck className="h-5 w-5 text-gray-400" />
                    ) : (
                        <UserPlus className="h-5 w-5 text-black" />
                    )}
                </button>
            )}
        </div>
    );
};

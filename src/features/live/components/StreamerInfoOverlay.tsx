import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { userService, UserProfile } from '../services/user.service';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { useUserProfileStore } from '../stores/userProfileStore';

interface StreamerInfoOverlayProps {
    streamerName: string;
    streamerImage?: string;
    className?: string;
}

export const StreamerInfoOverlay: React.FC<StreamerInfoOverlayProps> = ({
    streamerName,
    streamerImage,
    className
}) => {
    const { user: currentUser } = useAuthStore();
    const { openModal: openLoginModal, setMode, setStep } = useSignUpStore();
    const { openModal: openProfileModal } = useUserProfileStore();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [followerCount, setFollowerCount] = useState<string>('0');

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
                const cleanName = streamerName.startsWith('@') ? streamerName.slice(1) : streamerName;
                const { data } = await userService.getUserProfile(cleanName);
                if (data) {
                    setProfile(data);
                    setIsFollowing(data.followedByMe);
                    setFollowerCount(formatCount(data.followerCount));
                }
            } catch (error) {
                console.error("Failed to fetch streamer profile", error);
            }
        };

        fetchProfile();
    }, [streamerName, currentUser]); // Re-fetch if user logs in to get correct follow status

    const handleFollowToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();

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
                setIsFollowing(false);
                // Optionally decrement count locally or refetch
                toast.success(`Unfollowed ${streamerName}`);
            } else {
                await userService.followUser(profile.id);
                setIsFollowing(true);
                toast.success(`Followed ${streamerName}`);
            }
        } catch (error) {
            toast.error("Failed to update follow status");
        } finally {
            setIsLoading(false);
        }
    };

    const handleProfileClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        openProfileModal(streamerName);
    };

    if (!streamerName) return null;

    return (
        <div className={`flex items-center gap-3 bg-[#1A1A1A]/95 backdrop-blur-sm px-3 py-2 pr-3 rounded-full border border-white/5 ${className}`}>
            <div
                className="relative cursor-pointer group"
                onClick={handleProfileClick}
            >
                <Avatar className="h-10 w-10 border-2 border-[#FF4500]">
                    <AvatarImage src={profile?.profileImage || streamerImage} className="object-cover" />
                    <AvatarFallback>{streamerName[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
            </div>

            <div className="flex flex-col mr-2">
                <span
                    className="text-white font-bold text-sm hover:underline cursor-pointer"
                    onClick={handleProfileClick}
                >
                    {streamerName.startsWith('@') ? streamerName : `@${streamerName}`}
                </span>
                <span className="text-white/60 text-xs text-left">
                    {followerCount} Followers
                </span>
            </div>

            {/* Don't show follow button if it's the current user */}
            {currentUser?.username !== (profile?.username || streamerName.replace('@', '')) && (
                <Button
                    size="sm"
                    className={`ml-auto h-8 px-6 rounded-full transition-all text-xs font-semibold ${isFollowing
                        ? "bg-[#FF4500] hover:bg-[#FF5722] text-white border-none"
                        : "bg-[#FF4500] hover:bg-[#FF5722] text-white"
                        }`}
                    onClick={handleFollowToggle}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isFollowing ? (
                        "Following"
                    ) : (
                        "Follow"
                    )}
                </Button>
            )}
        </div>
    );
};

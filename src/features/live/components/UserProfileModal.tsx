import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogClose
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, X, Share2, User, Flag, Ban, Loader2, LayoutGrid, Video } from 'lucide-react';
import { useUserProfileStore } from '../stores/userProfileStore';
import { userService, UserProfile } from '../services/user.service';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { useNavigate } from '@tanstack/react-router';

export const UserProfileModal: React.FC = () => {
    const { isOpen, username: targetUsername, closeModal } = useUserProfileStore();
    const { user: currentUser } = useAuthStore();
    const { openModal: openLoginModal, setMode, setStep } = useSignUpStore();
    const navigate = useNavigate();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    useEffect(() => {
        if (isOpen && targetUsername) {
            if (!currentUser) {
                closeModal();
                setMode('login');
                openLoginModal();
                return;
            }
            fetchProfile(targetUsername);
        } else {
            setProfile(null);
        }
    }, [isOpen, targetUsername, currentUser]);

    const fetchProfile = async (username: string) => {
        setIsLoading(true);
        try {
            const cleanName = username.startsWith('@') ? username.slice(1) : username;
            const { data } = await userService.getUserProfile(cleanName);
            setProfile(data);
        } catch (error) {
            toast.error("Failed to load user profile");
            closeModal();
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!currentUser) {
            closeModal();
            setMode('login');
            setStep('input');
            openLoginModal();
            return;
        }

        if (!profile) return;

        setIsFollowLoading(true);
        try {
            if (profile.followedByMe) {
                await userService.unfollowUser(profile.id);
                setProfile(prev => prev ? ({
                    ...prev,
                    followedByMe: false,
                    followerCount: Math.max(0, prev.followerCount - 1)
                }) : null);
                toast.success(`Unfollowed @${profile.username}`);
            } else {
                await userService.followUser(profile.id);
                setProfile(prev => prev ? ({
                    ...prev,
                    followedByMe: true,
                    followerCount: prev.followerCount + 1
                }) : null);
                toast.success(`Followed @${profile.username}`);
            }
        } catch (error) {
            toast.error("Failed to update follow status");
        } finally {
            setIsFollowLoading(false);
        }
    };

    const handleBlock = () => {
        // Todo later onn
        toast.info("Block functionality coming soon");
    };

    const handleShare = () => {
        if (!profile) return;
        const url = `${window.location.origin}/profile/${profile.username}`;
        navigator.clipboard.writeText(url);
        toast.success("Profile link copied to clipboard");
    };

    const handleViewProfile = () => {
        if (!profile) return;
        closeModal();
        navigate({ to: `/profile/${profile.username}` });
    };

    const handleReport = () => {
        toast.info("Report functionality coming soon");
    };

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent showCloseButton={false} className="sm:max-w-md bg-[#0f1117] border-white/10 text-white p-0 overflow-hidden gap-0">
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-[#FF8800]" />
                    </div>
                ) : profile ? (
                    <>
                        <div className="p-6 pb-2 relative">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-lg text-white font-medium">@{profile.username}</h2>
                                <div className="flex items-center gap-4">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="text-white/60 hover:text-white transition-colors outline-none">
                                                <MoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 bg-[#1a1d24] border-white/10 text-white">
                                            <DropdownMenuItem onClick={handleShare} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white">
                                                <Share2 className="w-4 h-4 mr-2" /> Share Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleViewProfile} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white">
                                                <User className="w-4 h-4 mr-2" /> View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleReport} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-red-400 focus:text-red-400">
                                                <Flag className="w-4 h-4 mr-2" /> Report User
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <DialogClose className="text-white/60 hover:text-white transition-colors">
                                        <X className="w-6 h-6" />
                                    </DialogClose>
                                </div>
                            </div>

                            <div className="flex gap-6 items-start">
                                <div className="p-[2px] rounded-full bg-linear-to-tr from-blue-500 via-purple-500 to-orange-500 shrink-0">
                                    <Avatar className="w-24 h-24 border-4 border-[#0f1117]">
                                        <AvatarImage src={profile.profileImage} className="object-cover" />
                                        <AvatarFallback className="text-2xl bg-neutral-800">{profile.username[0]?.toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </div>

                                {/* User Details */}
                                <div className="flex flex-col pt-2">
                                    <h1 className="text-2xl font-bold text-white mb-1">{profile.fullName || profile.username}</h1>

                                    {profile.location && (
                                        <p className="text-white/40 text-sm mb-2">{profile.location}</p>
                                    )}

                                    {profile.bio && (
                                        <p className="text-white/70 text-sm leading-relaxed line-clamp-3">
                                            {profile.bio}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex justify-around mt-8 mb-8 px-4">
                                <div className="text-center">
                                    <div className="font-bold text-2xl text-[#FFD580]">{profile.followerCount.toLocaleString()}</div>
                                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider mt-1">Followers</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-2xl text-[#FFD580]">{profile.followingCount.toLocaleString()}</div>
                                    <div className="text-xs text-white/40 font-medium uppercase tracking-wider mt-1">Following</div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 w-full mb-2">
                                {currentUser?.username !== profile.username && (
                                    <>
                                        <Button
                                            className={`flex-1 rounded-full h-12 font-bold text-base ${profile.followedByMe
                                                ? "bg-white/10 hover:bg-white/20 text-white"
                                                : "bg-[#FF8800] hover:bg-[#FF9922] text-black"
                                                }`}
                                            onClick={handleFollowToggle}
                                            disabled={isFollowLoading}
                                        >
                                            {isFollowLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                profile.followedByMe ? "Following" : "+ Follow"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="flex-1 rounded-full h-12 font-bold text-base border-[#FF8800] text-[#FF8800] bg-transparent hover:bg-[#FF8800]/10 hover:text-[#FF8800]"
                                            onClick={handleBlock}
                                        >
                                            <Ban className="w-4 h-4 mr-2" /> Block
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="mt-2">
                            <Tabs defaultValue="moments" className="w-full">
                                <TabsList className="w-full bg-transparent border-b border-white/5 rounded-none h-12 p-0">
                                    <TabsTrigger
                                        value="moments"
                                        className="flex-1 h-full rounded-none border-transparent data-[state=active]:bg-transparent data-[state=active]:text-[#FF8800] text-white/60"
                                    >
                                        <LayoutGrid className="w-4 h-4 mr-2" /> Moments
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="past-live"
                                        className="flex-1 h-full rounded-none border-transparent data-[state=active]:bg-transparent data-[state=active]:text-[#FF8800] text-white/60"
                                    >
                                        <Video className="w-4 h-4 mr-2" /> Past Live
                                    </TabsTrigger>
                                </TabsList>
                                <div className="h-48 overflow-y-auto custom-scrollbar">
                                    <TabsContent value="moments" className="p-4 mt-0">
                                        <div className="grid grid-cols-3 gap-2">

                                        </div>
                                        <p className="text-center text-white/20 text-sm mt-4">No moments to show</p>
                                    </TabsContent>
                                    <TabsContent value="past-live" className="p-4 mt-0">
                                        <p className="text-center text-white/20 text-sm mt-4">No past lives</p>
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </>
                ) : (
                    <div className="p-8 text-center text-white/50">User not found</div>
                )}
            </DialogContent>
        </Dialog>
    );
};

import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogClose
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
} from '@/components/ui/drawer';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, X, Loader2, LayoutGrid, Video, ChevronLeft, Ban } from 'lucide-react';
import { useUserProfileStore } from '@/features/live/stores/userProfileStore';
import { userService, UserProfile } from '@/features/live/services/user.service';
import { liveService } from '@/features/live/services/live.service';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';

import { useIsMobile } from '@/hooks/use-mobile';
import { useLiveStreamContext } from '@/features/live/components/layout/LiveStreamLayout';
import { ProfilePage } from '@/features/profile';
import { AppBackground } from '@/components/internal/AppBackground';

export const UserProfileModal: React.FC = () => {
    const { isOpen, username: targetUsername, closeModal, showFullscreen, setShowFullscreen } = useUserProfileStore();
    const { user: currentUser } = useAuthStore();
    const { openModal: openLoginModal, setMode, setStep } = useSignUpStore();

    const isMobile = useIsMobile();
    const { call, isViewer } = useLiveStreamContext();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFollowLoading, setIsFollowLoading] = useState(false);
    const [isBlockLoading, setIsBlockLoading] = useState(false);
    const [isBlockDrawerOpen, setIsBlockDrawerOpen] = useState(false);

    useEffect(() => {
        if (isOpen && targetUsername) {
            if (!currentUser) {
                closeModal();
                setMode('login');
                openLoginModal();
                return;
            }
            fetchProfile(targetUsername);
            setShowFullscreen(false);
        } else {
            setProfile(null);
            setShowFullscreen(false);
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

    const handleBlockToggle = async () => {
        if (!currentUser) {
            closeModal();
            setMode('login');
            setStep('input');
            openLoginModal();
            return;
        }

        if (!profile) return;

        setIsBlockLoading(true);
        try {
            if (profile.blockedByMe) {
                await userService.unblockUser(profile.id);
                setProfile(prev => prev ? ({ ...prev, blockedByMe: false }) : null);
                setIsBlockDrawerOpen(false);
                toast.success(`Unblocked @${profile.username}`);
            } else {
                await userService.blockUser(profile.id);
                setProfile(prev => prev ? ({ ...prev, blockedByMe: true }) : null);
                setIsBlockDrawerOpen(false);
                toast.success(`Blocked @${profile.username}`);

                // If we're the host in an active stream, kick the blocked user immediately
                if (call && !isViewer) {
                    const streamUserId = String(profile.id);
                    // Revoke publisher permissions (only applies to co-hosts — 404 is expected for regular viewers)
                    try {
                        await call.updateUserPermissions({
                            user_id: streamUserId,
                            revoke_permissions: ['send-audio', 'send-video'],
                        });
                    } catch (e) {
                        // 404 = viewer had no publisher permissions — that's fine, continue
                    }

                    // Also revoke co-host role specifically
                    try {
                        await call.updateCallMembers({
                            update_members: [{ user_id: streamUserId, role: 'user' }],
                        });
                    } catch (e) { /* ignore */ }

                    // Remove from backend co-host list
                    try {
                        if (call.id) {
                            await liveService.removeCoHost(call.id, profile.username);
                        }
                    } catch (e) { /* ignore */ }

                    // Always send kicked event so the user's client navigates away
                    try {
                        await call.sendCustomEvent({ type: 'kicked', userId: streamUserId });
                    } catch (e) {
                        // ignore
                    }
                }
            }
        } catch (error) {
            toast.error("Failed to update block status");
        } finally {
            setIsBlockLoading(false);
        }
    };

    const handleShare = () => {
        if (!profile) return;
        const url = `${window.location.origin}/profile/${profile.username}`;
        navigator.clipboard.writeText(url);
        toast.success("Profile link copied to clipboard");
    };

    const handleViewProfile = () => {
        if (!profile) return;
        setShowFullscreen(true);
    };

    const handleReport = () => {
        toast.info("Report functionality coming soon");
    };

    const BlockConfirmationDrawer = (
        <Drawer open={isBlockDrawerOpen} onOpenChange={setIsBlockDrawerOpen}>
            <DrawerContent className="bg-[#111213] border-t border-white/10 text-white pb-6 rounded-t-3xl z-100">
                <DrawerTitle className="sr-only">Confirm Block User</DrawerTitle>
                <div className="flex flex-col items-center pt-2 pb-6 px-6">
                    <div className="w-12 h-1.5 bg-white/20 rounded-full mb-6"></div>
                    <h2 className="text-xl text-white font-medium mb-8">Block User</h2>

                    {profile && (
                        <div className="relative mb-8">
                            <div className="p-1 rounded-full bg-linear-to-tr from-blue-500 via-purple-500 to-orange-500">
                                <Avatar className="w-24 h-24 border-4 border-[#111213]">
                                    <AvatarImage src={profile.profileImage} className="object-cover" />
                                    <AvatarFallback className="text-2xl bg-neutral-800">{profile.username[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>
                            </div>
                        </div>
                    )}

                    <p className="text-white/60 mb-2">Are you sure you want to block</p>
                    <p className="text-white font-bold mb-8">@{profile?.username}</p>

                    <div className="flex w-full gap-4 max-w-sm">
                        <Button
                            className="flex-1 rounded-full h-12 font-bold bg-[#FF8800] hover:bg-[#FF9922] text-black"
                            onClick={handleBlockToggle}
                            disabled={isBlockLoading}
                        >
                            {isBlockLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Block User"}
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 rounded-full h-12 font-bold border-[#FF8800] text-[#FF8800] hover:bg-[#FF8800]/10 hover:text-[#FF8800] bg-transparent"
                            onClick={() => setIsBlockDrawerOpen(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );

    if (!isOpen) return null;

    /* ===== MOBILE FULLSCREEN (opened from drawer "View Profile" button) ===== */
    if (isMobile && showFullscreen) {
        return (
            <>
                <div className="fixed inset-0 z-50 bg-[#0f1117] flex flex-col overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 pt-5 pb-3">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowFullscreen(false)} className="text-white">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <h1 className="text-lg font-bold text-white">
                                {profile?.fullName || profile?.username || 'Profile'}
                            </h1>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-[#FF8800]" />
                        </div>
                    ) : profile ? (
                        <div className="flex-1 flex flex-col items-center px-6 pt-6">
                            {/* Avatar */}
                            <div className="p-[3px] rounded-full bg-[#FF8800] mb-4">
                                <Avatar className="w-28 h-28 border-4 border-[#0f1117]">
                                    <AvatarImage src={profile.profileImage} className="object-cover" />
                                    <AvatarFallback className="text-3xl bg-neutral-800">
                                        {profile.username[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            </div>

                            <h2 className="text-xl font-bold text-white mb-1">
                                {profile.fullName || profile.username}
                            </h2>
                            <p className="text-white/40 text-sm mb-1">@{profile.username}</p>
                            {profile.location && (
                                <p className="text-white/30 text-xs mb-2">{profile.location}</p>
                            )}
                            {profile.bio && (
                                <p className="text-white/60 text-sm text-center leading-relaxed mb-5 max-w-xs">
                                    {profile.bio}
                                </p>
                            )}

                            {/* Action buttons */}
                            {currentUser?.id !== profile.id && (
                                <div className="flex flex-col gap-3 w-full max-w-xs mb-5">
                                    {profile.blockedByMe ? (
                                        <Button
                                            className="w-full rounded-full h-11 font-bold text-sm bg-[#FF8800] hover:bg-[#FF9922] text-black"
                                            onClick={handleBlockToggle}
                                            disabled={isBlockLoading}
                                        >
                                            {isBlockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Unblock User"}
                                        </Button>
                                    ) : (
                                        <Button
                                            className={`w-full rounded-full h-11 font-bold text-sm ${profile.followedByMe
                                                ? "bg-white/10 hover:bg-white/20 text-white"
                                                : "bg-[#FF8800] hover:bg-[#FF9922] text-black"
                                                }`}
                                            onClick={handleFollowToggle}
                                            disabled={isFollowLoading}
                                        >
                                            {isFollowLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                profile.followedByMe ? "Following" : "Follow"}
                                        </Button>
                                    )}

                                    <div className="flex gap-3 w-full">
                                        <Button
                                            variant="outline"
                                            className="flex-1 rounded-full h-11 font-bold text-sm border-[#FF8800] text-[#FF8800] bg-transparent hover:bg-[#FF8800]/10 hover:text-[#FF8800]"
                                            onClick={handleShare}
                                        >
                                            Share Profile
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    className="w-11 h-11 rounded-full bg-[#FF8800] hover:bg-[#FF9922] text-black p-0 flex items-center justify-center shrink-0 border-0"
                                                >
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-32 bg-[#1a1d24] border-white/10 text-white">
                                                <DropdownMenuItem onClick={() => setIsBlockDrawerOpen(true)} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white">
                                                    {profile.blockedByMe ? "Unblock User" : "Block User"}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={handleReport} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-red-400 focus:text-red-400">
                                                    Report User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="flex justify-between items-center bg-white/5 rounded-2xl px-6 py-4 mb-6 w-full max-w-xs border border-white/10">
                                <div className="text-center font-bold text-lg text-white">
                                    <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium mb-1">Post</div>
                                    {profile.postCount ?? 0}
                                </div>
                                <div className="text-center font-bold text-lg text-[#FFD580]">
                                    <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium mb-1">Followers</div>
                                    {profile.followerCount >= 1000 ? (profile.followerCount / 1000).toFixed(1) + 'k' : profile.followerCount}
                                </div>
                                <div className="text-center font-bold text-lg text-[#FFD580]">
                                    <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium mb-1">Following</div>
                                    {profile.followingCount >= 1000 ? (profile.followingCount / 1000).toFixed(1) + 'k' : profile.followingCount}
                                </div>
                            </div>

                            {/* Tabs */}
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
                                <TabsContent value="moments" className="p-6 mt-0">
                                    <div className="flex flex-col items-center gap-3 py-10">
                                        <LayoutGrid className="w-10 h-10 text-white/20" />
                                        <p className="text-white/30 text-sm font-medium">No Post</p>
                                        <p className="text-white/20 text-xs text-center max-w-[250px]">
                                            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                                        </p>
                                        <Button className="mt-3 bg-[#FF8800] hover:bg-[#ff9922] text-black rounded-full px-6 h-10 font-bold text-sm">
                                            Explore Live Stream
                                        </Button>
                                    </div>
                                </TabsContent>
                                <TabsContent value="past-live" className="p-6 mt-0">
                                    <div className="flex flex-col items-center gap-3 py-10">
                                        <Video className="w-10 h-10 text-white/20" />
                                        <p className="text-white/30 text-sm font-medium">No Past Lives</p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-white/50">User not found</div>
                    )}
                </div>
                {BlockConfirmationDrawer}
            </>
        );
    }

    /* ===== MOBILE: Bottom Drawer (desktop-like layout) ===== */
    if (isMobile) {
        return (
            <>
                <Drawer open={isOpen} onOpenChange={(open) => !open && closeModal()}>
                    <DrawerContent className="bg-[#111213] border-t border-white/10 text-white max-h-[85vh]">
                        <DrawerTitle className="sr-only">User Profile</DrawerTitle>
                        {isLoading ? (
                            <div className="h-48 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#FF8800]" />
                            </div>
                        ) : profile ? (
                            <div className="flex flex-col overflow-y-auto">
                                {/* Header: @username ... X */}
                                <div className="flex items-center justify-between px-6 pt-2 pb-3">
                                    <h2 className="text-base font-bold text-white">@{profile.username}</h2>
                                    <div className="flex items-center gap-3">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="text-white/60 hover:text-white transition-colors outline-none z-50">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuContent align="end" className="w-48 bg-[#2A2A2A] border-transparent text-white rounded-2xl p-0 overflow-hidden shadow-2xl z-99999">
                                                    <DropdownMenuItem onClick={handleShare} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white p-4 text-[17px] font-medium border-b border-white/10 rounded-none justify-center">
                                                        Share Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={handleViewProfile} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white p-4 text-[17px] font-medium border-b border-white/10 rounded-none justify-center">
                                                        View Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={handleReport} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white p-4 text-[17px] font-medium rounded-none justify-center">
                                                        Report User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenuPortal>
                                        </DropdownMenu>
                                        <button onClick={closeModal} className="text-white/60 hover:text-white transition-colors">
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Avatar + Info */}
                                <div className="flex gap-5 items-start px-6 pb-4">
                                    <div className="p-[2px] rounded-full bg-linear-to-tr from-blue-500 via-purple-500 to-orange-500 shrink-0">
                                        <Avatar className="w-20 h-20 border-4 border-[#1a1d27]">
                                            <AvatarImage src={profile.profileImage} className="object-cover" />
                                            <AvatarFallback className="text-xl bg-neutral-800">{profile.username[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="flex flex-col pt-1 min-w-0">
                                        <h1 className="text-lg font-bold text-white truncate">{profile.fullName || profile.username}</h1>
                                        {profile.location && (
                                            <p className="text-white/40 text-sm">{profile.location}</p>
                                        )}
                                        {profile.bio && (
                                            <p className="text-white/60 text-sm leading-relaxed mt-1 line-clamp-2">{profile.bio}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="px-6 py-2 mb-4 flex justify-around w-full">
                                    <div className="text-center font-bold text-lg text-[#FFD580]">
                                        <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium mb-1">Followers</div>
                                        {profile.followerCount >= 1000 ? (profile.followerCount / 1000).toFixed(1) + 'k' : profile.followerCount}
                                    </div>
                                    <div className="text-center font-bold text-lg text-[#FFD580]">
                                        <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium mb-1">Following</div>
                                        {profile.followingCount >= 1000 ? (profile.followingCount / 1000).toFixed(1) + 'k' : profile.followingCount}
                                    </div>
                                </div>

                                {/* Action buttons */}
                                {currentUser?.id !== profile.id && (
                                    <div className="flex gap-3 px-6 pb-4 w-full">
                                        <Button
                                            className={`flex-1 rounded-full h-11 font-bold text-sm ${profile.followedByMe
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
                                            className="flex-1 rounded-full h-11 font-bold text-sm border-[#FF8800] text-[#FF8800] bg-transparent hover:bg-[#FF8800]/10 hover:text-[#FF8800] flex items-center justify-center gap-1.5"
                                            onClick={() => profile.blockedByMe ? handleBlockToggle() : setIsBlockDrawerOpen(true)}
                                            disabled={isBlockLoading}
                                        >
                                            {isBlockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                profile.blockedByMe ? "Unblock" : (
                                                    <>
                                                        <Ban className="w-4 h-4" /> Block
                                                    </>
                                                )}
                                        </Button>
                                    </div>
                                )}

                                {/* Tabs: Moments / Past Live */}
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
                                    <div className="h-40 overflow-y-auto">
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
                        ) : (
                            <div className="h-48 flex items-center justify-center text-white/50">User not found</div>
                        )}
                    </DrawerContent>
                </Drawer>
                {BlockConfirmationDrawer}
            </>
        );
    }

    /* ===== DESKTOP FULLSCREEN ===== */
    if (!isMobile && showFullscreen) {
        return (
            <>
                <div className="fixed inset-0 z-40 pt-[73px]">
                    <AppBackground>
                        <button
                            onClick={() => setShowFullscreen(false)}
                            className="absolute top-6 left-6 z-50 text-white/70 hover:text-white flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" /> Back to Live
                        </button>
                        {profile ? (
                            <ProfilePage forcedUsername={profile.username} />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#FF8800]" />
                            </div>
                        )}
                    </AppBackground>
                </div>
                {BlockConfirmationDrawer}
            </>
        );
    }

    /* ===== DESKTOP: Dialog-based Modal ===== */
    return (
        <>
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
                                                <button className="text-white/60 hover:text-white transition-colors outline-none z-50">
                                                    <MoreHorizontal className="w-5 h-5" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuPortal>
                                                <DropdownMenuContent align="end" className="w-48 bg-[#2A2A2A] border-transparent text-white rounded-2xl p-0 overflow-hidden shadow-2xl z-99999">
                                                    <DropdownMenuItem onClick={handleShare} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white p-4 text-[17px] font-medium border-b border-white/10 rounded-none justify-center">
                                                        Share Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={handleViewProfile} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white p-4 text-[17px] font-medium border-b border-white/10 rounded-none justify-center">
                                                        View Profile
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={handleReport} className="cursor-pointer hover:bg-white/5 focus:bg-white/5 focus:text-white p-4 text-[17px] font-medium rounded-none justify-center">
                                                        Report User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenuPortal>
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

                                <div className="mb-6 mt-4">
                                    <div className="flex justify-around items-center px-4 py-2 w-full">
                                        <div className="text-center font-bold text-xl text-[#FFD580]">
                                            <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium mb-1">Followers</div>
                                            {profile.followerCount >= 1000 ? (profile.followerCount / 1000).toFixed(1) + 'k' : profile.followerCount}
                                        </div>
                                        <div className="text-center font-bold text-xl text-[#FFD580]">
                                            <div className="text-[11px] text-white/40 uppercase tracking-wider font-medium mb-1">Following</div>
                                            {profile.followingCount >= 1000 ? (profile.followingCount / 1000).toFixed(1) + 'k' : profile.followingCount}
                                        </div>
                                    </div>
                                </div>

                                {currentUser?.id !== profile.id && (
                                    <div className="flex gap-3 px-6 pb-4 w-full">
                                        <Button
                                            className={`flex-1 rounded-full h-11 font-bold text-sm ${profile.followedByMe
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
                                            className="flex-1 rounded-full h-11 font-bold text-sm border-[#FF8800] text-[#FF8800] bg-transparent hover:bg-[#FF8800]/10 hover:text-[#FF8800] flex items-center justify-center gap-1.5"
                                            onClick={() => profile.blockedByMe ? handleBlockToggle() : setIsBlockDrawerOpen(true)}
                                            disabled={isBlockLoading}
                                        >
                                            {isBlockLoading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                profile.blockedByMe ? "Unblock" : (
                                                    <>
                                                        <Ban className="w-4 h-4" /> Block
                                                    </>
                                                )}
                                        </Button>
                                    </div>
                                )}
                            </div>

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
            {BlockConfirmationDrawer}
        </>
    );
};

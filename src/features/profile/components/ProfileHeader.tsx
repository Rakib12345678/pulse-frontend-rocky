import { useState } from 'react';
import { MapPin, MoreHorizontal, Radio } from 'lucide-react';
import { useToggleFollow, useUserLiveStatus } from '@/features/profile/services/profile.service';
import type { User } from '@/features/profile/services/profile.types';
import cameraLogo from "@/assets/Camera.png"
import { toast } from 'sonner';
import { useGoLive } from '@/features/profile/hooks/useGoLive';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
}

export const ProfileHeader = ({ user, isOwnProfile }: ProfileHeaderProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  const { mutate: toggleFollow, isPending } = useToggleFollow();
  const handleGoLiveClick = useGoLive();

  const { data: liveStatus } = useUserLiveStatus(
    !isOwnProfile ? (user.username ?? undefined) : undefined,
    !isOwnProfile,
  );

  const isLive = !isOwnProfile && liveStatus?.isLive === true;

  const handleLiveClick = () => {
    if (isLive && liveStatus?.callId) {
      window.location.href = `/live/${liveStatus.callId}`;
    }
  };

  const stats = [
    { label: 'Post', value: user.postCount ?? 0 },
    { label: 'Followers', value: (user.followerCount ?? 0).toLocaleString() },
    { label: 'Following', value: user.followingCount ?? 0 },
  ];

  const handleFollowClick = () => {
    toggleFollow({
      targetUserId: user.id,
      followedByMe: user.followedByMe ?? false,
    });
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/profile/${user.username}`;
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy profile link");
    }
  };

  return (
    <div className="bg-[#111213] flex flex-col rounded-2xl p-14 border-2 border-[#1D1F20] mb-15">
      <div className="flex flex-col sm:flex-row gap-8 justify-between items-start md:items-center mb-10">
        <div className="flex flex-row gap-6 items-center">
          <div className="relative shrink-0">
            <div
              className={`w-32 h-32 rounded-full p-1 ${isLive ? 'animate-live-ring' : ''}`}
              style={{
                background: isLive
                  ? 'linear-gradient(135deg, #FF3B3B 0%, #FF6B00 100%)'
                  : 'linear-gradient(77.21deg, #718FF2 0%, #2927C5 53%, #FF471A 100%)',
              }}
            >
              <div className="w-full h-full rounded-full border-[3px] border-black overflow-hidden bg-zinc-900">
                <img
                  src={user.profileImage || '/api/placeholder/128/128'}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {isOwnProfile && (
              <button className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-lg border border-gray-200 hover:scale-110 transition-transform">
                <img src={cameraLogo} alt="Edit profile" className="w-4 h-4" />
              </button>
            )}

            {isLive && (
              <button
                onClick={handleLiveClick}
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#FF0000] text-white text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full shadow-md border border-black whitespace-nowrap cursor-pointer hover:bg-red-500 transition-colors"
              >
                <Radio className="w-2.5 h-2.5" />
                LIVE NOW
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
                {user.fullName || user.username}
              </h1>

              {isLive && (
                <button
                  onClick={handleLiveClick}
                  className="flex items-center gap-1.5 bg-[#FF3B3B]/15 border border-[#FF3B3B]/50 text-[#FF5555] text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full hover:bg-[#FF3B3B]/25 transition-colors cursor-pointer mb-1"
                >
                  <span className="w-2 h-2 rounded-full bg-[#FF3B3B] animate-pulse inline-block" />
                  Live
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 text-[#494E50] text-sm mb-3">
              <span className="font-medium">@{user.username}</span>
              {user.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{user.location}</span>
                </div>
              )}
            </div>
            {user.bio && (
              <p className="text-zinc-300 text-base max-w-lg leading-relaxed">{user.bio}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full md:w-auto">
          {isOwnProfile ? (
            <>
              <button
                onClick={handleGoLiveClick}
                className="bg-[#FF7700] text-[#111213] py-3 px-12 rounded-full font-bold hover:bg-[#FF7700] transition-colors cursor-pointer"
              >
                Go Live
              </button>
              <div className="flex gap-3">
                <button className="flex-1 border-2 border-[#FF7700] text-[#FF7700] rounded-full py-2.5 px-8 font-bold hover:bg-orange-500/10 transition-colors cursor-pointer">
                  Edit Profile
                </button>
                <div className="relative">
                  <button
                    onClick={() => setSettingsOpen((prev) => !prev)}
                    className="w-12 h-12 bg-[#FF7700] text-[#111213] rounded-full flex items-center justify-center hover:bg-orange-300 transition-all cursor-pointer"
                  >
                    <MoreHorizontal className="w-6 h-6" />
                  </button>
                  {settingsOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
                      <div className="absolute -right-15 bottom-full w-30 -mb-4 bg-[#121212] border border-zinc-800 rounded-lg shadow-2xl z-50 py-1">
                        <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-800 cursor-pointer">Settings</button>
                        <div className="h-px bg-zinc-800 mx-2" />
                        <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-800 cursor-pointer">Share Profile</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleFollowClick}
                disabled={isPending}
                className="w-full md:w-64 bg-[#FF7700] text-[#111213] font-bold py-3.5 rounded-full disabled:opacity-60 hover:bg-[#FF7700] transition-colors cursor-pointer"
              >
                {isPending ? 'Please wait...' : user.followedByMe ? 'Unfollow' : 'Follow'}
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleShare}
                  className="flex-1 border-2 border-[#FF7700] text-[#FF7700] rounded-full py-2.5 px-8 font-bold hover:bg-orange-500/10 transition-colors cursor-pointer"
                >
                  Share Profile
                </button>
                <div className="relative">
                  <button
                    onClick={() => setActionMenuOpen((prev) => !prev)}
                    className="w-12 h-12 bg-[#FF7700] text-[#111213] rounded-full flex items-center justify-center hover:bg-orange-300 transition-all cursor-pointer"
                  >
                    <MoreHorizontal className="w-6 h-6" />
                  </button>
                  {actionMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActionMenuOpen(false)} />
                      <div className="absolute -right-15 bottom-full w-30 -mb-4 bg-[#121212] border border-zinc-800 rounded-lg shadow-2xl z-50 py-1">
                        <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-800 cursor-pointer">Block User</button>
                        <div className="h-px bg-zinc-800 mx-2" />
                        <button className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-800 cursor-pointer">Report User</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-[#1D1F20] rounded-4xl py-3 px-10 md:px-20 border border-zinc-800/40 shadow-2xl">
        <div className="flex justify-between items-center max-w-2xl">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-[#494E50] text-xs font-bold tracking-widest">{stat.label}</span>
              <span className="text-[#FFE2A5] text-3xl md:text-4xl font-extrabold tracking-tight">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
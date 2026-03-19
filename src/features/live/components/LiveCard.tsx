import React, { useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { Users, Heart } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { toast } from 'sonner';

interface LiveCardProps {
  callId: string;
  thumbnailUrl: string;
  avatarUrl: string;
  streamerName: string;
  viewerCount: string | number;
  followersCount: string;
  category: string;
  title?: string;
  isLive?: boolean;
  collaboratorAvatarUrl?: string;
  cohosts?: { username: string; profileImage: string; status: string }[];
  createdByUserId?: string;
}

export const LiveCard: React.FC<LiveCardProps> = ({
  callId,
  thumbnailUrl,
  avatarUrl,
  streamerName,
  viewerCount,
  followersCount,
  category,
  isLive = false,
  collaboratorAvatarUrl,
  cohosts,
  createdByUserId,
}) => {
  const { user } = useAuthStore();

  const handleCardClick = useCallback(
    async (e: React.MouseEvent) => {
      // If the current user is the creator, they should enter as host
      const isHost = user && createdByUserId && String(user.id) === String(createdByUserId);

      if (isHost) {
        // Prevent joining own stream as viewer from feed
        e.preventDefault();
        toast.info("This is your live stream. Please use the rejoin banner to resume hosting.");
      }
    },
    [user, createdByUserId]
  );

  return (
    <Link
      to="/live/$id"
      params={{ id: callId }}
      onClick={handleCardClick}
      className="group relative block w-full aspect-[3/4.5] overflow-hidden rounded-3xl bg-neutral-900 shadow-lg transition-all hover:shadow-xl cursor-pointer"
    >
      {/* Background Image */}
      <img
        src={thumbnailUrl || avatarUrl}
        alt={streamerName}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-black/10" />

      {/* Top Left: Viewers Pill */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-[#FFE9C0] px-2.5 py-1 text-[11px] font-bold text-[#8B5E3C] shadow-sm">
        <Users className="h-3 w-3 fill-[#8B5E3C]" />
        <span>{viewerCount}</span>
      </div>

      {/* Top Right: Collaborator / Cohosts */}
      {cohosts && cohosts.length > 0 ? (
        <div className="absolute right-3 top-3 z-10 flex -space-x-3 items-center">
          {cohosts.map((cohost, idx) => (
            <div
              key={idx}
              className="relative transition-transform duration-300 hover:scale-110 hover:z-20"
              style={{ zIndex: cohosts.length - idx }}
            >
              <img
                src={cohost.profileImage || `https://i.pravatar.cc/150?u=${cohost.username}`}
                alt={cohost.username}
                className="h-9 w-9 rounded-full border-2 border-white object-cover bg-zinc-800"
              />
              <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFE9C0] ring-1 ring-white">
                <Heart className="h-2.5 w-2.5 fill-[#8B5E3C] text-[#8B5E3C]" />
              </div>
            </div>
          ))}
        </div>
      ) : collaboratorAvatarUrl ? (
        <div className="absolute right-3 top-3 z-10">
          <div className="relative">
            <img
              src={collaboratorAvatarUrl}
              alt="Collaborator"
              className="h-9 w-9 rounded-full border-2 border-white object-cover"
            />
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFE9C0] ring-1 ring-white">
              <Heart className="h-2.5 w-2.5 fill-[#8B5E3C] text-[#8B5E3C]" />
            </div>
          </div>
        </div>
      ) : null}

      {/* Bottom Info Section */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-end justify-between gap-2">

          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Streamer Avatar */}
            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt={streamerName}
                className="h-10 w-10 rounded-full border-2 border-white object-cover"
              />
              {isLive && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-md bg-red-600 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase leading-none ring-1 ring-white">
                  Live
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="truncate text-sm font-bold text-white leading-tight">
                @{streamerName}
              </h3>
              <p className="truncate text-[10px] font-medium text-gray-300">
                {followersCount} Followers
              </p>
            </div>
          </div>

          <div className="shrink-0 max-w-[40%]">
            <div className="truncate rounded-2xl bg-zinc-600/60 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-md text-center">
              {category}
            </div>
          </div>

        </div>
      </div>
    </Link>
  );
};
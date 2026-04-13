import React, { useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { Users, Heart } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import coHostIcon from '@/assets/co-host.svg';

export interface StreamCardProps {
  callId: string;
  thumbnailUrl: string;
  avatarUrl: string;
  streamerName: string;
  viewerCount: string | number;
  followersCount: string;
  category?: string | null;
  title?: string;
  isLive?: boolean;
  cohosts?: { username: string; profileImage: string; status?: string }[];
  collaboratorAvatarUrl?: string; // primarily for standard variant
  createdByUserId?: string;
  variant?: 'standard' | 'explore';
  recordingUrl?: string;
}

export const StreamCard: React.FC<StreamCardProps> = ({
  callId,
  thumbnailUrl,
  avatarUrl,
  streamerName,
  viewerCount,
  followersCount,
  category,
  title,
  isLive = false,
  cohosts,
  collaboratorAvatarUrl,
  createdByUserId,
  variant = 'standard',
  recordingUrl,
}) => {
  const { user } = useAuthStore();

  const handleCardClick = useCallback(
    async (e: React.MouseEvent) => {
      const isHost = user && createdByUserId && String(user.id) === String(createdByUserId);

      if (isHost && isLive) {
        e.preventDefault();
        toast.info("This is your live stream. Please use the rejoin banner to resume hosting.");
      }
    },
    [user, createdByUserId, isLive]
  );

  if (variant === 'explore') {
    const primaryCohost = cohosts && cohosts.length > 0 ? cohosts[0] : null;

    return (
      <Link
        to={recordingUrl ? "/stream/$id" : "/live/$id"}
        params={{ id: callId }}
        search={{
          recordingUrl,
          username: streamerName,
          title,
          category
        }}
        onClick={handleCardClick}
        className="group relative block w-full aspect-[3/5.2] overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl transition-all duration-500 hover:shadow-orange-900/20 cursor-pointer"
      >
        {/* Background Image */}
        <img
          src={thumbnailUrl || avatarUrl}
          alt={streamerName}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/100 via-black/60 to-transparent opacity-90" />

        {/* Top Left */}
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full bg-[#FFE9C0] px-3.5 py-1.5 text-xs font-bold text-[#8B5E3C] shadow-lg backdrop-blur-sm border border-white/20">
          <Users className="h-3.5 w-3.5 fill-[#8B5E3C]" />
          <span>{viewerCount}</span>
        </div>

        {/* Cohost Indicator */}
        {primaryCohost && (
          <div className="absolute right-4 top-4 z-10">
            <div className="relative group/cohost transition-transform duration-300 hover:scale-110">
              <img
                src={primaryCohost.profileImage || `https://i.pravatar.cc/150?u=${primaryCohost.username}`}
                alt={primaryCohost.username}
                className="h-10 w-10 rounded-full object-cover shadow-lg"
              />
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FFE9C0] shadow-sm">
                <img src={coHostIcon} className="h-3 w-3" alt="co-host" />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Info Section */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pt-5 pb-6 bg-gradient-to-t from-black/80 to-transparent backdrop-blur-[2px]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <div className="relative shrink-0">
                <div
                  className={cn(
                    "relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                    isLive ? "p-[1px] bg-gradient-to-br from-[#718FF2] via-[#2927C5] to-[#FF471A]" : ""
                  )}
                >
                  <div className="w-full h-full rounded-full overflow-hidden" title={title || streamerName}>
                    <img src={avatarUrl} alt={streamerName} className="h-full w-full object-cover" />
                  </div>
                </div>
                {isLive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[#FF3B30] px-1.5 py-0.5 text-[6px] font-black text-white uppercase tracking-wider shadow-lg border border-white/50 z-20">
                    Live
                  </div>
                )}
              </div>

              <div className="flex flex-col overflow-hidden">
                <h3 className="truncate text-xm font-bold text-white leading-tight [text-shadow:_0_1px_3px_rgb(0_0_0_/_80%),_0_2px_6px_rgb(0_0_0_/_60%)]">
                  @{streamerName}
                </h3>
                <p className="truncate text-[9px] font-semibold text-gray-200 tracking-wide leading-normal [text-shadow:_0_1px_2px_rgb(0_0_0_/_60%)]">
                  {followersCount} Followers
                </p>
              </div>
            </div>

            {category && (
              <div className="shrink-0">
                <div className="rounded-2xl bg-white/10 px-3 py-1 text-[9px] font-bold text-white/90 backdrop-blur-xl border border-white/10 shadow-lg capitalize">
                  {category}
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // STANDARD VARIANT (LiveCard design)
  return (
    <Link
      to={recordingUrl ? "/stream/$id" : "/live/$id"}
      params={{ id: callId }}
      search={{
        recordingUrl,
        username: streamerName,
        title,
        category
      }}
      onClick={handleCardClick}
      className="group relative block w-full aspect-[3/4.5] overflow-hidden rounded-3xl bg-neutral-900 shadow-lg transition-all hover:shadow-xl cursor-pointer"
    >
      <img
        src={thumbnailUrl || avatarUrl}
        alt={streamerName}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-black/10" />

      <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-[#FFE9C0] px-2.5 py-1 text-[11px] font-bold text-[#8B5E3C] shadow-sm">
        <Users className="h-3 w-3 fill-[#8B5E3C]" />
        <span>{viewerCount}</span>
      </div>

      {cohosts && cohosts.length > 0 ? (
        <div className="absolute right-3 top-3 z-10 flex -space-x-3 items-center">
          {cohosts.map((cohost, idx) => (
            <div
              key={idx}
              className="relative transition-transform duration-300 hover:scale-110 hover:z-20"
              style={{ zIndex: (cohosts?.length || 0) - idx }}
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

      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
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

          {category && (
            <div className="shrink-0 max-w-[40%]">
              <div className="truncate rounded-2xl bg-zinc-600/60 px-2.5 py-1.5 text-[10px] font-semibold text-white backdrop-blur-md text-center">
                {category}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

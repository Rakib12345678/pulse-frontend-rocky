import React, { useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { Users } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import coHostIcon from '@/assets/co-host.svg';

interface ExploreLiveCardProps {
  callId: string;
  thumbnailUrl: string;
  avatarUrl: string;
  streamerName: string;
  viewerCount: string | number;
  followersCount: string;
  category?: string | null;
  title?: string;
  isLive?: boolean;
  cohosts?: { username: string; profileImage: string; status: string }[];
  createdByUserId?: string;
}

export const ExploreLiveCard: React.FC<ExploreLiveCardProps> = ({
  callId,
  thumbnailUrl,
  avatarUrl,
  streamerName,
  viewerCount,
  followersCount,
  category,
  isLive = false,
  cohosts,
  createdByUserId,
}) => {
  const { user } = useAuthStore();

  const handleCardClick = useCallback(
    async (e: React.MouseEvent) => {
      const isHost = user && createdByUserId && String(user.id) === String(createdByUserId);

      if (isHost) {
        e.preventDefault();
        toast.info("This is your live stream. Please use the rejoin banner to resume hosting.");
      }
    },
    [user, createdByUserId]
  );

  const primaryCohost = cohosts && cohosts.length > 0 ? cohosts[0] : null;

  return (
    <Link
      to="/live/$id"
      params={{ id: callId }}
      onClick={handleCardClick}
      className="group relative block w-full aspect-[3/5.2] overflow-hidden rounded-[2.5rem] bg-neutral-900 shadow-2xl transition-all duration-500 hover:shadow-orange-900/20 cursor-pointer border border-white/5"
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
            {/* Streamer Avatar with Live Circle */}
            <div className="relative shrink-0">
              <div
                className={cn(
                  "relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-300",
                  isLive
                    ? "p-[1px] bg-gradient-to-br from-[#718FF2] via-[#2927C5] to-[#FF471A]"
                    : ""
                )}
              >
                <div className="w-full h-full rounded-full overflow-hidden">
                  <img
                    src={avatarUrl}
                    alt={streamerName}
                    className="h-full w-full object-cover"
                  />
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

          {/* Category */}
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
};
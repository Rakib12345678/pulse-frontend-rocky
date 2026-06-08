import React, { useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Users, Trash2, MoreHorizontal } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import coHostIcon from '@/assets/co-host.svg';
import { openAuthModal } from '@/hooks/useGuestGuard';

export interface StreamCardProps {
  callId: string;
  // thumbnailUrl: string;
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
  mobileVideoUrl?: string;
  thumbnailUrl?: string;
  cardClickRedirectToLive?: boolean;
  isDefaultImage?: boolean;
  onDelete?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onLongPress?: () => void;
  /** When true, profile-navigation clicks are blocked and open the auth modal. Recording/live-join card clicks are still allowed. */
  guestMode?: boolean;
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
  mobileVideoUrl,
  thumbnailUrl: propThumbnailUrl,
  cardClickRedirectToLive = false,
  isDefaultImage = false,
  onDelete,
  selectable = false,
  selected = false,
  onSelect,
  onLongPress,
  guestMode = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const longPressTimeout = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPress = React.useRef(false);

  const startPress = useCallback(() => {
    isLongPress.current = false;
    longPressTimeout.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress();
        isLongPress.current = true;
      }
    }, 600);
  }, [onLongPress]);

  const endPress = useCallback(() => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
      longPressTimeout.current = null;
    }
  }, []);

  const handleProfileClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Profile navigation is auth-gated on explore for guests
      if (guestMode) {
        openAuthModal();
        return;
      }

      if (streamerName && !/^\d+$/.test(streamerName)) {
        navigate({ to: `/profile/${streamerName}` as any });
      }
    },
    [navigate, streamerName, guestMode]
  );

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      if (isLongPress.current) {
        e.preventDefault();
        e.stopPropagation();
        isLongPress.current = false;
        return;
      }
      if (selectable && onSelect) {
        e.preventDefault();
        e.stopPropagation();
        onSelect();
        return;
      }
      const isHost = user && createdByUserId && String(user.id) === String(createdByUserId);

      if (isHost && isLive) {
        toast.info("This is your live stream. Please use the rejoin banner to resume hosting.");
        return;
      }

      if (isLive && cardClickRedirectToLive) {
        window.location.href = `/live/${callId}`;
        return;
      }

      navigate({
        to: "/stream/$id" as any,
        params: { id: callId } as any,
        search: {
          mobileVideoUrl,
          thumbnailUrl: propThumbnailUrl || thumbnailUrl,
          username: streamerName,
          title,
          category,
          cohosts: cohosts ? JSON.stringify(cohosts) : undefined
        } as any
      });
    },
    [user, createdByUserId, isLive, streamerName, callId, title, mobileVideoUrl, propThumbnailUrl, thumbnailUrl, category, cohosts, navigate, cardClickRedirectToLive, selectable, onSelect]
  );

  if (variant === 'explore') {
    return (
      <div
        onClick={handleCardClick}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onTouchMove={endPress}
        className={cn(
          "group relative block w-full aspect-[3/5.2] overflow-hidden rounded-2xl bg-neutral-900 shadow-2xl transition-all duration-500 hover:shadow-orange-900/20 cursor-pointer border-2",
          selected
            ? "border-[#FF7700] shadow-[0_0_20px_rgba(255,119,0,0.4)]"
            : "border-transparent hover:border-zinc-700/50"
        )}
      >
        {/* Selected Backdrop Overlay */}
        {selected && (
          <div className="absolute inset-0 bg-[#FF7700]/10 z-10 pointer-events-none transition-colors" />
        )}
        {/* Background Image */}
        {isDefaultImage ? (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/60 overflow-hidden">
            <img
              src={avatarUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover blur-3xl opacity-40 scale-150"
            />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <UserAvatar
                src={avatarUrl}
                alt={streamerName}
                isLive={isLive}
                callId={callId}
                username={streamerName}
                size="custom"
                className="w-24 h-24 sm:w-28 sm:h-28 shadow-2xl"
                clickable={false}
                showBadge={false}
              />
            </div>
          </div>
        ) : (
          <img
            src={thumbnailUrl || avatarUrl}
            alt={streamerName}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Top Left */}
        {viewerCount !== 0 && viewerCount !== "0" && (
          <div className="absolute left-2 sm:left-4 top-2 sm:top-4 z-10 flex items-center gap-1.5 sm:gap-2 rounded-full bg-[#FFE9C0] px-2.5 sm:px-3.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-[#8B5E3C] shadow-lg backdrop-blur-sm border border-white/20">
            <Users className="h-3 sm:h-3.5 w-3 sm:w-3.5 fill-[#8B5E3C]" />
            <span>{viewerCount}</span>
          </div>
        )}

        {/* Select Mode Checkbox */}
        {selectable && (
          <div
            className={cn(
              "absolute z-20 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-lg left-2 sm:left-4",
              (viewerCount !== 0 && viewerCount !== "0") ? "top-10 sm:top-14" : "top-2 sm:top-4",
              selected
                ? "bg-[#FF7700] border-[#FF7700] text-[#111213] scale-110"
                : "bg-black/40 border-white/60 text-transparent"
            )}
          >
            {selected && (
              <svg className="h-4 w-4 stroke-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}

        {/* Menu Container */}
        {!selectable && onDelete && (
          <div className={cn("absolute z-30 left-2 sm:left-4", (viewerCount !== 0 && viewerCount !== "0") ? "top-10 sm:top-14" : "top-2 sm:top-4")}>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white shadow-md backdrop-blur-md border border-white/10 transition-all duration-300 active:scale-90",
                showMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              title="Options"
            >
              <MoreHorizontal className="h-4.5 w-4.5" />
            </button>

            {showMenu && (
              <>
                {/* Click-away backdrop */}
                <div
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                  className="fixed inset-0 z-20 bg-transparent cursor-default"
                />

                {/* Dropdown Menu */}
                <div className="absolute left-0 top-9 z-30 w-28 bg-zinc-950/95 border border-zinc-800 rounded-xl p-1 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer text-left"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Cohost Indicator */}
        {cohosts && cohosts.length > 0 && (
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-10 flex -space-x-2 sm:-space-x-3 items-center">
            {cohosts.map((cohost, idx) => (
              <div
                key={idx}
                className="relative transition-transform duration-300 hover:scale-110 hover:z-20"
                style={{ zIndex: (cohosts?.length || 0) - idx }}
              >
                <img
                  src={
                    cohost.profileImage ||
                    `https://i.pravatar.cc/150?u=${cohost.username}`
                  }
                  alt={cohost.username}
                  className="h-7 w-7 sm:h-10 sm:w-10 rounded-full border-2 border-white object-cover bg-zinc-800 shadow-lg"
                />

                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-[#FFE9C0] shadow-sm">
                  <img
                    src={coHostIcon}
                    className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                    alt="co-host"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Info Section */}
        <div className="absolute bottom-0 left-0 right-0 px-2 sm:px-4 pt-3 sm:pt-5 pb-4 sm:pb-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent backdrop-blur-[2px]">
          <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden flex-1 min-w-0">
              <UserAvatar
                src={avatarUrl}
                alt={streamerName}
                isLive={isLive}
                callId={callId}
                username={streamerName}
                size="custom"
                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0"
                clickable={true}
                showBadge={false}
                guestMode={guestMode}
              />

              <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                <h3
                  onClick={handleProfileClick}
                  className="truncate text-[11px] sm:text-sm font-bold text-white leading-tight [text-shadow:_0_1px_3px_rgb(0_0_0_/_80%),_0_2px_6px_rgb(0_0_0_/_60%)] cursor-pointer hover:text-orange-400 transition-colors"
                >
                  {streamerName}
                </h3>
                <p className="truncate text-[8px] sm:text-[9px] font-semibold text-gray-200 tracking-wide leading-normal [text-shadow:_0_1px_2px_rgb(0_0_0_/_60%)]">
                  {followersCount} Followers
                </p>
              </div>
            </div>

            {category && (
              <div className="shrink-0 max-w-[38%] sm:max-w-[45%]">
                <div className="truncate rounded-full bg-white/20 sm:bg-white/30 px-1.5 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-semibold text-white backdrop-blur-md border border-white/10 shadow-lg capitalize leading-none text-center">
                  {category}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // STANDARD VARIANT (LiveCard design)
  return (
    <div
      onClick={handleCardClick}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onTouchMove={endPress}
      className={cn(
        "group relative block w-full aspect-[3/4.5] overflow-hidden rounded-3xl bg-neutral-900 shadow-lg transition-all hover:shadow-xl cursor-pointer border-2",
        selected
          ? "border-[#FF7700] shadow-[0_0_20px_rgba(255,119,0,0.4)]"
          : "border-transparent hover:border-zinc-700/50"
      )}
    >
      {/* Selected Backdrop Overlay */}
      {selected && (
        <div className="absolute inset-0 bg-[#FF7700]/10 z-10 pointer-events-none transition-colors" />
      )}
      {isDefaultImage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/60 overflow-hidden">
          <img
            src={avatarUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover blur-3xl opacity-40 scale-150"
          />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <UserAvatar
              src={avatarUrl}
              alt={streamerName}
              isLive={isLive}
              callId={callId}
              username={streamerName}
              size="custom"
              className="w-24 h-24 sm:w-28 sm:h-28 shadow-2xl"
              clickable={true}
              showBadge={false}
              guestMode={guestMode}
            />
          </div>
        </div>
      ) : (
        <img
          src={thumbnailUrl || avatarUrl}
          alt={streamerName}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-black/10" />

      {viewerCount !== 0 && viewerCount !== "0" && (
        <div className="absolute left-2 sm:left-3 top-2 sm:top-3 z-10 flex items-center gap-1 sm:gap-1.5 rounded-full bg-[#FFE9C0] px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-[#8B5E3C] shadow-sm">
          <Users className="h-2.5 sm:h-3 w-2.5 sm:w-3 fill-[#8B5E3C]" />
          <span>{viewerCount}</span>
        </div>
      )}

      {/* Select Mode Checkbox */}
      {selectable && (
        <div
          className={cn(
            "absolute z-20 flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-300 shadow-md left-2 sm:left-3",
            (viewerCount !== 0 && viewerCount !== "0") ? "top-9 sm:top-11" : "top-2 sm:top-3",
            selected
              ? "bg-[#FF7700] border-[#FF7700] text-[#111213] scale-110"
              : "bg-black/40 border-white/60 text-transparent"
          )}
        >
          {selected && (
            <svg className="h-3 w-3 stroke-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      )}

      {/* Menu Container */}
      {!selectable && onDelete && (
        <div className={cn("absolute z-30 left-2 sm:left-3", (viewerCount !== 0 && viewerCount !== "0") ? "top-9 sm:top-11" : "top-2 sm:top-3")}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white shadow-md backdrop-blur-md border border-white/10 transition-all duration-300 active:scale-90",
              showMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            title="Options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              {/* Click-away backdrop */}
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(false);
                }}
                className="fixed inset-0 z-20 bg-transparent cursor-default"
              />

              {/* Dropdown Menu */}
              <div className="absolute left-0 top-8 z-30 w-28 bg-zinc-950/95 border border-zinc-800 rounded-xl p-1 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer text-left"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {cohosts && cohosts.length > 0 ? (
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10 flex -space-x-3 items-center">
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
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FFE9C0] shadow-sm">
                <img src={coHostIcon} className="h-3 w-3" alt="co-host" />
              </div>
            </div>
          ))}
        </div>
      ) : collaboratorAvatarUrl ? (
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
          <div className="relative">
            <img
              src={collaboratorAvatarUrl}
              alt="Collaborator"
              className="h-9 w-9 rounded-full border-2 border-white object-cover"
            />
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#FFE9C0] shadow-sm">
              <img src={coHostIcon} className="h-3 w-3" alt="co-host" />
            </div>
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2 w-full">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden flex-1 min-w-0">
            {!isDefaultImage && (
              <UserAvatar
                src={avatarUrl}
                alt={streamerName}
                isLive={isLive}
                callId={callId}
                username={streamerName}
                size="custom"
                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0"
                clickable={true}
                showBadge={false}
                guestMode={guestMode}
              />
            )}

            <div className="flex flex-col overflow-hidden min-w-0 flex-1">
              <h3
                onClick={handleProfileClick}
                className="truncate text-[11px] sm:text-sm font-bold text-white leading-tight cursor-pointer hover:text-orange-400 transition-colors"
              >
                {streamerName}
              </h3>
              <p className="truncate text-[8px] sm:text-[10px] font-medium text-gray-300">
                {followersCount} Followers
              </p>
            </div>
          </div>

          {category && (
            <div className="shrink-0 max-w-[38%] sm:max-w-[45%]">
              <div className="truncate rounded-full bg-white/20 sm:bg-white/30 px-1.5 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] font-semibold text-white backdrop-blur-md border border-white/10 shadow-lg capitalize leading-none text-center">
                {category}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

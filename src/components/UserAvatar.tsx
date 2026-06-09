import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { UserCircle2 } from 'lucide-react';
import { openAuthModal } from '@/hooks/useGuestGuard';

interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  className?: string;
  isLive?: boolean;
  callId?: string | null;
  username?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  clickable?: boolean;
  showBadge?: boolean;
  /** When true, profile navigation is blocked and opens the auth modal instead. Live-join clicks are still allowed. */
  guestMode?: boolean;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-32 h-32',
  custom: '',
};

export const UserAvatar = ({
  src,
  alt = '',
  className = '',
  isLive = false,
  callId,
  username,
  size = 'md',
  clickable = true,
  showBadge = false,
  guestMode = false,
}: UserAvatarProps) => {
  const navigate = useNavigate();
  const [broken, setBroken] = React.useState(false);

  React.useEffect(() => {
    setBroken(false);
  }, [src]);

  const handleClick = (e: React.MouseEvent) => {
    if (!clickable) return;
    e.stopPropagation();

    if (isLive && callId) {
      // Live-join is always allowed, even for guests
      navigate({ to: '/live/$id' as any, params: { id: callId } as any });
    } else if (username) {
      // Profile navigation requires authentication
      if (guestMode) {
        openAuthModal();
        return;
      }
      navigate({ to: '/profile/$username', params: { username } });
    }
  };

  const avatarSizeClass = sizeClasses[size];

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative shrink-0 flex items-center justify-center rounded-full',
        clickable && (username || (isLive && callId)) ? 'cursor-pointer' : '',
        avatarSizeClass,
        className
      )}
    >
      {/* Outer Glowing Ring (Live only) */}
      {isLive && (
        <div className="absolute inset-0 rounded-full animate-live-ring bg-linear-to-tr from-[#718FF2] via-[#2927C5] to-[#FF471A] opacity-75 blur-[2px]" />
      )}

      {/* Border Container */}
      <div
        className={cn(
          'relative w-full h-full rounded-full p-[3px] transition-all duration-300',
          isLive 
            ? 'bg-linear-to-tr from-[#718FF2] via-[#2927C5] to-[#FF471A]' 
            : 'bg-white/10 group-hover:bg-white/20'
        )}
      >
        {/* Inner Content Wrapper */}
        <div className="w-full h-full rounded-full bg-[#111213] overflow-hidden flex items-center justify-center border border-black/50">
          {!src || broken ? (
            <div className="w-full h-full flex items-center justify-center bg-neutral-800">
              <UserCircle2 className="w-[60%] h-[60%] text-white/20" />
            </div>
          ) : (
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
              onError={() => setBroken(true)}
            />
          )}
        </div>
      </div>

      {isLive && showBadge && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#FF0000] text-white text-[8px] sm:text-[10px] font-bold tracking-widest px-2 sm:px-3 py-0.5 rounded-full shadow-[0_0_10px_rgba(255,0,0,0.5)] border border-[#111213] whitespace-nowrap z-10 scale-110">
          LIVE
        </div>
      )}
    </div>
  );
};

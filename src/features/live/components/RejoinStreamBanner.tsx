import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from '@tanstack/react-router';
import { Radio, Tv, X } from 'lucide-react';
import { useGoLiveStore } from '../stores/goLiveStore';
import { useViewerRejoinStore } from '../stores/viewerRejoinStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { liveService } from '../services/live.service';
import { userService } from '../services/user.service';
import { Button } from '@/components/ui/button';

type RejoinMode = 'host' | 'viewer';

interface BannerState {
  visible: boolean;
  mode: RejoinMode | null;
  callId: string | null;
  streamerName: string | null;
  streamerImage?: string | null;
  fullStreamInfo?: any;
}

const INITIAL: BannerState = {
  visible: false,
  mode: null,
  callId: null,
  streamerName: null,
  streamerImage: null,
};

export function RejoinStreamBanner() {
  const navigate = useNavigate();
  const { user, isHydrated } = useAuthStore();
  const { setStreamData, openRejoinSetup } = useGoLiveStore();
  const { rejoinData, clearRejoinData } = useViewerRejoinStore();
  const { pathname } = useLocation();
  const [banner, setBanner] = useState<BannerState>(INITIAL);

  const dismiss = useCallback(
    async (mode: RejoinMode, callId?: string | null) => {
      setBanner(INITIAL);
      if (mode === 'host') {
        if (callId) {
          try {
            await liveService.endLiveStream(callId);
          } catch (err) {
            console.error('Failed to end stream on dismissal:', err);
          }
        }
        setStreamData(null);
      } else {
        clearRejoinData();
      }
    },
    [setStreamData, clearRejoinData]
  );

  const rejoin = useCallback(
    async (callId: string, mode: RejoinMode, fullStreamInfo?: any) => {
      setBanner(INITIAL);
      if (mode === 'host') {
        openRejoinSetup(fullStreamInfo || {
          callId,
          title: user?.fullName || fullStreamInfo?.title || 'Your Stream',
          category: 'Others'
        });
      } else {
        clearRejoinData();
        navigate({ to: '/live/$id', params: { id: callId } });
      }
    },
    [navigate, clearRejoinData, openRejoinSetup, user?.fullName]
  );

  // HOST REJOIN
  useEffect(() => {
    if (!isHydrated || !user) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pulse_host_is_currently_live' && e.newValue === 'true') {
        setBanner((prev) => (prev.mode === 'host' ? INITIAL : prev));
      }
    };
    window.addEventListener('storage', handleStorage);

    if (pathname.startsWith('/live')) {
      if (banner.visible && banner.mode === 'host') {
        setBanner(INITIAL);
      }
      return;
    }

    let cancelled = false;

    const checkHostStream = async () => {
      try {
        const result = await userService.getUserStream();
        if (cancelled) return;

        const isLiveOnOtherTab = localStorage.getItem('pulse_host_is_currently_live') === 'true';
        const isSameDeviceInterruption = !!localStorage.getItem('pulse_host_left_at');

        if (result.isLive && result.callId && !isLiveOnOtherTab && (!result.hasActiveHost || isSameDeviceInterruption)) {
          setBanner({
            visible: true,
            mode: 'host',
            callId: result.callId,
            streamerName: user.fullName || user.username || 'Your stream',
            streamerImage: user.profileImage ?? null,
            fullStreamInfo: result,
          });
        } else {
          if (banner.visible && banner.mode === 'host') {
            setBanner(INITIAL);
          }
        }
      } catch (err: any) {
        console.error('Failed to check host stream status:', err);

        setBanner((prev) => (prev.mode === 'host' ? INITIAL : prev));

        const status = err.response?.status || err.status;
        if (status === 404 || status === 401) {
          setStreamData(null);
          localStorage.removeItem('pulse_host_left_at');
        }
      }
    };

    const timer = setTimeout(checkHostStream, 1500);
    const interval = setInterval(checkHostStream, 10_000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [user?.id, isHydrated, pathname]);

  // VIEWER REJOIN
  useEffect(() => {
    if (!isHydrated || !user) return;
    if (pathname.startsWith('/live')) return;

    const viewerCallId = rejoinData?.callId ?? null;
    if (!viewerCallId) return;

    let cancelled = false;

    const checkViewerStream = async () => {
      try {
        const feed = await liveService.getStreamFeed(undefined, 100);
        if (cancelled) return;

        const match = feed.data.find((s) => s.callId === viewerCallId && s.isLive);
        if (match) {
          setBanner({
            visible: true,
            mode: 'viewer',
            callId: viewerCallId,
            streamerName: rejoinData!.streamerName,
            streamerImage: match.profileImage,
          });
        } else {
          clearRejoinData();
          if (banner.visible && banner.mode === 'viewer') {
            setBanner(INITIAL);
          }
        }
      } catch {
        // Silently fail
      }
    };

    const timer = setTimeout(checkViewerStream, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user?.id, isHydrated, rejoinData?.callId, pathname]);

  // RENDER GUARD 
  const { isRejoinBannerDismissed } = useGoLiveStore();

  if (
    pathname.startsWith('/live') ||
    isRejoinBannerDismissed ||
    !banner.visible ||
    !banner.mode ||
    !banner.callId
  ) return null;

  const isHost = banner.mode === 'host';

  return (
    <div className="fixed bottom-20 inset-x-0 z-[200] flex justify-center px-4 pointer-events-none">
      <div
        className="
          pointer-events-auto
          flex flex-col gap-3
          w-full max-w-sm
          rounded-2xl
          border border-white/10
          bg-[#1a1d27]/95
          backdrop-blur-md
          shadow-2xl shadow-black/60
          p-4
          animate-in slide-in-from-bottom-4 fade-in
          duration-300
        "
      >
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="relative shrink-0">
            {banner.streamerImage ? (
              <img
                src={banner.streamerImage}
                alt={banner.streamerName ?? ''}
                className="w-11 h-11 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-[#FF8800]/20 flex items-center justify-center">
                {isHost ? (
                  <Radio className="w-5 h-5 text-[#FF8800]" />
                ) : (
                  <Tv className="w-5 h-5 text-[#FF8800]" />
                )}
              </div>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-[#1a1d27] animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold leading-tight truncate">
              {isHost ? 'Your stream is still live!' : `${banner.streamerName ?? 'A stream'} is still live`}
            </p>
            <p className="text-white/50 text-xs mt-0.5 leading-snug">
              {isHost
                ? 'You were interrupted. Tap to rejoin.'
                : 'You left mid-stream. Tap to jump back in.'}
            </p>
          </div>

          <button
            onClick={() => dismiss(banner.mode!, banner.callId)}
            className="shrink-0 text-white/40 hover:text-white/80 transition-colors"
            aria-label="Dismiss rejoin banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => dismiss(banner.mode!, banner.callId)}
            className="flex-1 text-white/60 border-white/10 hover:bg-white/5 hover:text-white bg-transparent text-xs h-8"
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            onClick={() => rejoin(banner.callId!, banner.mode!, banner.fullStreamInfo)}
            className="flex-1 bg-[#FF8800] hover:bg-[#e07700] text-white text-xs h-8 font-semibold"
          >
            {isHost ? (
              <div className="flex items-center justify-center gap-1.5">
                <span>🎙️ Rejoin as Host</span>
              </div>
            ) : (
              '📺 Rejoin Stream'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
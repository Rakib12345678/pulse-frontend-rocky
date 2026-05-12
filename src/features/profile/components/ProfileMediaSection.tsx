import { useEffect, useRef, useCallback } from 'react';
import { Grid3X3, LayoutDashboard, Video, Loader2 } from 'lucide-react';
import {
  useMoments,
  useGlobalPastLiveStreams,
} from '@/features/profile/services/profile.service';
import { EmptyState } from './EmptyState';
import { StreamCard } from '@/components/StreamCard';

interface ProfileMediaSectionProps {
  userId: number;
  activeTab: 'moments' | 'pastLive';
  onTabChange: (tab: 'moments' | 'pastLive') => void;
  isOwnProfile: boolean;
  userName?: string;
  onGoLive?: () => void;
}

export const ProfileMediaSection = ({
  userId,
  activeTab,
  onTabChange,
  isOwnProfile,
  userName = 'This user',
  onGoLive,
}: ProfileMediaSectionProps) => {
  const momentsQuery = useMoments(userId);
  const {
    data: globalPastLivesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isRecordingsLoading
  } = useGlobalPastLiveStreams(userId);

  const isMoments = activeTab === 'moments';
  const isLoading = isMoments ? momentsQuery.isLoading : isRecordingsLoading;

  const loader = useRef(null);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const option = {
      root: null,
      rootMargin: "20px",
      threshold: 0
    };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loader.current) observer.observe(loader.current);
    return () => observer.disconnect();
  }, [handleObserver, activeTab]);

  const displayData = isMoments 
    ? (momentsQuery.data || []) 
    : (globalPastLivesData?.pages.flatMap(page => page.data) || []);

  return (
    <div className="w-full bg-[#0a0a0a]">
      <div className="w-full border-b border-zinc-800/60 bg-transparent mb-4 md:mb-6 lg:mb-10">
        <div className="flex w-full">
          <div
            onClick={() => onTabChange('moments')}
            className="flex-1 flex justify-center items-center py-4 md:py-5 cursor-pointer relative"
          >
            <div
              className={`flex items-center gap-2 md:gap-3 transition-colors ${isMoments ? 'text-[#FF7700]' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              <LayoutDashboard className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-base md:text-lg font-medium">Moments</span>
            </div>
            {isMoments && (
              <div className="absolute bottom-0 left-4 md:left-10 right-4 md:right-10 h-0.5 bg-[#FF7700] shadow-[0_0_10px_rgba(249,115,22,0.3)]" />
            )}
          </div>

          <div
            onClick={() => onTabChange('pastLive')}
            className="flex-1 flex justify-center items-center py-4 md:py-5 cursor-pointer relative"
          >
            <div
              className={`flex items-center gap-2 md:gap-3 transition-colors ${!isMoments ? 'text-[#FF7700]' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            >
              <Video className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-base md:text-lg font-medium">Past Live</span>
            </div>
            {!isMoments && (
              <div className="absolute bottom-0 left-4 md:left-10 right-4 md:right-10 h-0.5 bg-[#FF7700] shadow-[0_0_10px_rgba(249,115,22,0.3)]" />
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pb-20">
        {/* LOADING STATE */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4.5] bg-zinc-900 rounded-xl md:rounded-3xl animate-pulse" />
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && (!displayData || displayData.length === 0) && (
          <div className="py-10 h-70">
            <EmptyState
              icon={isMoments ? Grid3X3 : Video}
              title={isMoments ? 'No Post' : 'No previous live'}
              description={
                isMoments
                  ? isOwnProfile
                    ? "You haven't shared any moments yet. Start posting to share your story."
                    : `${userName} hasn't shared any moments yet.`
                  : isOwnProfile
                    ? "You haven't gone live yet. Start your first live and connect with your audience."
                    : `${userName} hasn't gone live yet.`
              }
              actionLabel={
                isMoments
                  ? 'Add Moments'
                  : isOwnProfile
                    ? 'Go Live'
                    : undefined
              }
              onAction={
                isMoments
                  ? () => { window.location.href = '/for-you'; }
                  : isOwnProfile
                    ? onGoLive
                    : undefined
              }
            />
          </div>
        )}

        {!isLoading && displayData && displayData.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-5">
              {displayData.map((item: any) => (
                <div key={item.id || item.callId} className="rounded-xl md:rounded-3xl overflow-hidden">
                  {isMoments ? (
                    <StreamCard
                      variant="standard"
                      callId={item.id}
                      thumbnailUrl={item.thumbnail}
                      avatarUrl={item.avatar}
                      streamerName={item.username}
                      viewerCount={item.views}
                      followersCount=""
                      category=""
                      title={item.displayName}
                      isLive={false}
                      isDefaultImage={item.isDefaultImage}
                    />
                  ) : (
                    <StreamCard
                      variant="explore"
                      callId={item.callId || item.id}
                      thumbnailUrl={item.thumbnailUrl || item.thumbnail || item.profileImage || item.avatar}
                      avatarUrl={item.profileImage || item.avatar}
                      streamerName={item.username}
                      viewerCount={item.participantCount || item.views || 0}
                      followersCount={String(item.followerCount || 0)}
                      category={item.category}
                      title={item.title || item.displayName}
                      isLive={item.isLive ?? false}
                      cohosts={item.cohosts}
                      createdByUserId={item.createdByUserId}
                      mobileVideoUrl={item.mobileVideoUrl}
                      isDefaultImage={item.isDefaultImage}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Pagination Loader */}
            {!isMoments && (
              <div ref={loader} className="w-full flex justify-center py-10">
                {isFetchingNextPage && <Loader2 className="w-8 h-8 animate-spin text-[#FF7700]" />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
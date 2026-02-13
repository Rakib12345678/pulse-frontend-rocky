import { Grid3X3, LayoutDashboard, Video } from 'lucide-react';
import {
  useMoments,
  usePastLiveStreams,
} from '@/features/profile/services/profile.service';
import { EmptyState } from './EmptyState';
import { LiveCard } from '@/features/live/components/LiveCard';
import type { LiveStream } from '@/features/profile/services/profile.types';

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
  const livesQuery = usePastLiveStreams(userId);

  const isMoments = activeTab === 'moments';
  const data = isMoments ? momentsQuery.data : livesQuery.data;
  const isLoading = isMoments ? momentsQuery.isLoading : livesQuery.isLoading;

  return (
    <div className="w-full bg-[#0a0a0a]">
      <div className="w-full border-b border-zinc-800/60 bg-transparent mb-10">
        <div className="flex w-full">
          <div
            onClick={() => onTabChange('moments')}
            className="flex-1 flex justify-center items-center py-5 cursor-pointer relative"
          >
            <div
              className={`flex items-center gap-3 transition-colors ${
                isMoments ? 'text-[#FF7700]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="text-lg font-medium">Moments</span>
            </div>
            {isMoments && (
              <div className="absolute bottom-0 left-10 right-10 h-0.5 bg-[#FF7700] shadow-[0_0_10px_rgba(249,115,22,0.3)]" />
            )}
          </div>

          <div
            onClick={() => onTabChange('pastLive')}
            className="flex-1 flex justify-center items-center py-5 cursor-pointer relative"
          >
            <div
              className={`flex items-center gap-3 transition-colors ${
                !isMoments ? 'text-[#FF7700]' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Video className="w-5 h-5" />
              <span className="text-lg font-medium">Past Live</span>
            </div>
            {!isMoments && (
              <div className="absolute bottom-0 left-10 right-10 h-0.5 bg-[#FF7700] shadow-[0_0_10px_rgba(249,115,22,0.3)]" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-20">
        {/* LOADING STATE */}
        {isLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4.5] bg-zinc-900 rounded-3xl animate-pulse" />
            ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && (!data || data.length === 0) && (
          <div className="py-10 h-70">
            <EmptyState
              icon={isMoments ? Grid3X3 : Video}
              title={isMoments ? 'No Post' : 'No previous live'}
              description={
                isMoments
                  ? `${userName} hasn't shared any moments yet.`
                  : `${userName} hasn't gone live yet.`
              }
              actionLabel={
                isMoments
                  ? 'Explore Live Stream'
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

        {!isLoading && data && data.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {data.map((item: LiveStream) => (
              <LiveCard
                key={item.id}
                callId={item.id}
                thumbnailUrl={item.thumbnail}
                avatarUrl={item.avatar}
                streamerName={item.username}
                viewerCount={item.views}
                followersCount=""
                category=""
                title={item.displayName}
                isLive={isMoments ? false : (item.isLive ?? false)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
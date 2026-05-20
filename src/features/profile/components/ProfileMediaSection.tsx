import { useEffect, useRef, useCallback, useState } from 'react';
import { Grid3X3, LayoutDashboard, Video, Loader2, Trash2 } from 'lucide-react';
import {
  useMoments,
  useGlobalPastLiveStreams,
  useDeleteRecordings,
} from '@/features/profile/services/profile.service';
import { EmptyState } from './EmptyState';
import { StreamCard } from '@/components/StreamCard';
import { ConfirmModal } from '@/components/internal/ConfirmModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  const [recordingToDelete, setRecordingToDelete] = useState<any | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const deleteMutation = useDeleteRecordings();

  // Clear selection when exiting selection mode or changing tabs
  useEffect(() => {
    setSelectedIds(new Set());
  }, [isSelectionMode, activeTab]);

  const handleSelectToggle = useCallback((callId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(callId)) {
        next.delete(callId);
      } else {
        next.add(callId);
      }
      return next;
    });
  }, []);

  const handleLongPress = useCallback((callId: string) => {
    if (!isOwnProfile) return;
    setIsSelectionMode(true);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.add(callId);
      return next;
    });
  }, [isOwnProfile]);

  const handleDeleteConfirm = () => {
    if (!recordingToDelete) return;
    const callId = recordingToDelete.callId || recordingToDelete.id;
    deleteMutation.mutate([callId], {
      onSuccess: () => {
        toast.success('Recording deleted successfully');
        setRecordingToDelete(null);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to delete recording');
      }
    });
  };

  const handleBulkDeleteConfirm = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    deleteMutation.mutate(ids, {
      onSuccess: () => {
        toast.success(`${ids.length} recording(s) deleted successfully`);
        setSelectedIds(new Set());
        setIsSelectionMode(false);
        setConfirmBulkDelete(false);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to delete recordings');
      }
    });
  };

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
        {/* Manage Bar for Past Lives */}
        {isOwnProfile && !isMoments && displayData.length > 0 && (
          <div className="flex justify-end items-center mb-6">
            <button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={cn(
                "w-full md:w-auto justify-center px-5 py-3 md:py-2.5 rounded-full text-xs font-bold transition-all active:scale-95 flex items-center gap-2 border shadow-lg cursor-pointer",
                isSelectionMode
                  ? "bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
                  : "bg-[#FF7700] hover:bg-orange-600 text-black border-transparent shadow-[0_4px_12px_rgba(255,119,0,0.25)]"
              )}
            >
              {isSelectionMode ? (
                <>
                  <span className="hidden md:inline">Cancel Select</span>
                  <span className="inline md:hidden">Cancel</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Manage Recordings
                </>
              )}
            </button>
          </div>
        )}

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
                      onLongPress={isOwnProfile ? () => handleLongPress(item.id) : undefined}
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
                      onDelete={isOwnProfile ? () => setRecordingToDelete(item) : undefined}
                      selectable={isSelectionMode}
                      selected={selectedIds.has(item.callId || item.id)}
                      onSelect={() => handleSelectToggle(item.callId || item.id)}
                      onLongPress={isOwnProfile ? () => handleLongPress(item.callId || item.id) : undefined}
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

      <ConfirmModal
        isOpen={!!recordingToDelete}
        title="Delete Recording?"
        description="Are you sure you want to permanently delete this past live recording? This action cannot be undone."
        confirmLabel="Delete"
        confirmIcon={<Trash2 className="w-5 h-5" />}
        confirmClassName="bg-red-600 text-white hover:bg-red-700"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setRecordingToDelete(null)}
        useDrawer={true}
        headerIcon={<Trash2 className="w-12 h-12 text-red-500 mx-auto stroke-[1.5px]" />}
      />

      <ConfirmModal
        isOpen={confirmBulkDelete}
        title={`Delete ${selectedIds.size} Recording(s)?`}
        description={`Are you sure you want to permanently delete these ${selectedIds.size} selected past live recording(s)? This action cannot be undone.`}
        confirmLabel="Delete All"
        confirmIcon={<Trash2 className="w-5 h-5" />}
        confirmClassName="bg-red-600 text-white hover:bg-red-700"
        isLoading={deleteMutation.isPending}
        onConfirm={handleBulkDeleteConfirm}
        onCancel={() => setConfirmBulkDelete(false)}
        useDrawer={true}
        headerIcon={<Trash2 className="w-12 h-12 text-red-500 mx-auto stroke-[1.5px]" />}
      />

      {/* Floating Action Bar */}
      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1D1F20]/80 backdrop-blur-xl border border-zinc-800/80 rounded-full px-6 py-3 flex items-center gap-6 shadow-[0_10px_50px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-sm font-bold text-white whitespace-nowrap">
            {selectedIds.size} Selected
          </span>
          <div className="h-4 w-px bg-zinc-800" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="hidden md:inline">Clear Selected</span>
            <span className="inline md:hidden">Clear</span>
          </button>
          <button
            onClick={() => setConfirmBulkDelete(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-full text-xs transition-all active:scale-95 shadow-[0_4px_12px_rgba(220,38,38,0.3)] cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Delete Selected</span>
            <span className="inline md:hidden">Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};
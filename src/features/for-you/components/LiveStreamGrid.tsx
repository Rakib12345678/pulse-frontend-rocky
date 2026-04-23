import React from 'react';
import { Video, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StreamCard } from '@/components/StreamCard';
import { FeedStreamItem } from '@/features/live/services/live.service';
import { formatViewerCount } from '@/features/for-you/hooks/useStreamFeed';
import bunnyTeacher from '@/assets/bunnyTeacher.png';

interface LiveStreamGridProps {
    streams: FeedStreamItem[];
    isLoading: boolean;
    isLoadingMore: boolean;
    error: string | null;
    hasMore: boolean;
    hasPaginated: boolean;
    loadMoreRef: React.RefObject<HTMLDivElement | null>;
    onRetry: () => void;
}

export const LiveStreamGrid: React.FC<LiveStreamGridProps> = ({
    streams,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    hasPaginated,
    loadMoreRef,
    onRetry,
}) => {
    if (isLoading && streams.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-[#FF8800]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <Button onClick={onRetry} variant="outline" className='text-black'>
                    Try Again
                </Button>
            </div>
        );
    }

    if (streams.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Video className="h-16 w-16 text-gray-500 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">No Live Streams</h2>
                <p className="text-gray-400 mb-6">Be the first to go live!</p>
            </div>
        );
    }

    return (
        <>
            <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {streams.map((stream) => (
                    <div key={stream.callId} className="flex w-full">
                        <StreamCard
                            variant="explore"
                            callId={stream.callId}
                            thumbnailUrl={stream.profileImage || bunnyTeacher}
                            avatarUrl={stream.profileImage || `https://i.pravatar.cc/150?u=${stream.createdByUserId + 20}`}
                            streamerName={stream.username || `User ${stream.createdByUserId}`}
                            viewerCount={formatViewerCount(stream.participantCount)}
                            followersCount={formatViewerCount(stream.followerCount)}
                            category={stream.category || 'Live'}
                            title={stream.title}
                            isLive={stream.isLive}
                            cohosts={stream.cohosts}
                            createdByUserId={stream.createdByUserId}
                        />
                    </div>
                ))}
            </div>

            {/* Sentinel element for infinite scroll */}
            <div ref={loadMoreRef} className="flex justify-center py-8">
                {isLoadingMore && (
                    <Loader2 className="h-6 w-6 animate-spin text-[#FF8800]" />
                )}
                {!hasMore && streams.length > 0 && hasPaginated && (
                    <p className="text-gray-500 text-sm">You've seen all streams</p>
                )}
            </div>
        </>
    );
};

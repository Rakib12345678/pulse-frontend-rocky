import { useState, useRef, useEffect, useCallback } from 'react';
import { liveService, FeedStreamItem } from '@/features/live/services/live.service';
import { useAuthStore } from '@/features/auth/stores/authStore';

export function useStreamFeed() {
    const { user } = useAuthStore();
    const [streams, setStreams] = useState<FeedStreamItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);

    const [hasPaginated, setHasPaginated] = useState(false);

    const loadMoreRef = useRef<HTMLDivElement>(null);

    const fetchStreams = async (retryState: boolean | unknown = false) => {
        // Handle event object from click handlers by checking for boolean true
        const isRetry = retryState === true;

        if (!isRetry) {
            setIsLoading(true);
            setHasPaginated(false);
        }
        setError(null);
        try {
            const response = await liveService.getStreamFeed();
            const newStreams = Array.isArray(response.data) ? response.data : [];
            const filteredStreams = newStreams.filter(stream => stream.createdByUserId !== String(user?.id));

            setStreams(filteredStreams);
            setNextCursor(response.nextCursor);
            setHasMore(response.hasMore);
        } catch (err) {
            console.error('Failed to fetch streams:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMoreStreams = useCallback(async () => {
        if (isLoadingMore || !hasMore || !nextCursor) return;

        setIsLoadingMore(true);
        try {
            const response = await liveService.getStreamFeed(nextCursor);
            const moreStreams = Array.isArray(response.data) ? response.data : [];
            const filteredMore = moreStreams.filter(stream => stream.createdByUserId !== String(user?.id));
            setStreams(prev => [...prev, ...filteredMore]);
            setNextCursor(response.nextCursor);
            setHasMore(response.hasMore);
            setHasPaginated(true);
        } catch (err) {
            console.error('Failed to load more streams:', err);
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, nextCursor]);

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        const sentinel = loadMoreRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadMoreStreams();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, loadMoreStreams]);

    useEffect(() => {
        fetchStreams();
    }, []);

    return {
        streams,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        hasPaginated,
        loadMoreRef,
        fetchStreams,
    };
}

export function formatViewerCount(count: number): string {
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k`;
    }
    return String(count);
}

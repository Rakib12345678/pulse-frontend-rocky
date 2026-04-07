import { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { exploreService } from '../services/explore.service';
import { ExploreData, ExploreSearchResponse } from '../types/explore.types';
import { getStreamClient } from '@/features/chat/stream/streamClient';
import { toAbsoluteUrl } from '@/features/chat/utils/chat';
import { getDisplayName, capitalizeName } from '@/features/chat/utils/ChatUtils';

export const useExplore = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategories, setActiveCategories] = useState<string[]>(['All Category']);

    // Fetch categories from API
    const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const results = await exploreService.getCategories();
            // Comprehensive case-insensitive filtering of duplicate "All" options
            return results.filter(c => {
                const name = c.name.toLowerCase().trim();
                return name !== 'all' && name !== 'all category' && name !== 'all categories';
            });
        },
        staleTime: 1000 * 60 * 30,
    });

    const { data: exploreData, isLoading, error, refetch } = useQuery<ExploreData>({
        queryKey: ['exploreData', activeCategories],
        queryFn: async () => {
            return exploreService.getExploreData(activeCategories);
        },
        placeholderData: keepPreviousData,
        retry: 3,
        retryDelay: 1000,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Search Query
    const { data: searchResults = null, isFetching: isSearching } = useQuery<ExploreSearchResponse | null>({
        queryKey: ['exploreSearch', searchQuery.trim()],
        queryFn: async () => {
            const query = searchQuery.trim();
            if (!query) return null;

            // We still use Stream Client for user search as it's more efficient for autocomplete
            let creators: any[] = [];
            try {
                const client = getStreamClient();
                const resp = await client.queryUsers(
                    { name: { $autocomplete: query } },
                    {},
                    { limit: 30 }
                );

                creators = resp.users
                    .filter(u => u.id !== client.userID)
                    .map(u => ({
                        id: parseInt(u.id, 10) || 0,
                        username: (u as any).username || (u as any).name || u.id,
                        fullName: capitalizeName(getDisplayName({ id: u.id, name: u.name })),
                        profileImage: toAbsoluteUrl((u as any).image ?? ''),
                        followerCount: (u as any).followerCount || 0,
                        isFollower: (u as any).isFollower || (u as any).followedByMe || false,
                        followedByMe: (u as any).followedByMe || (u as any).isFollower || false,
                        isLive: false,
                        participantCount: 0,
                        cohostCount: 0,
                        cohosts: []
                    }));
            } catch {
                creators = [];
            }

            const results = await exploreService.searchExplore(query);

            return {
                creators: creators.length > 0 ? creators : (results.creators as any),
                streams: results.streams as any
            };
        },
        enabled: searchQuery.trim().length > 0,
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const handleSearch = () => {
        // Query will refetch automatically on searchQuery change
    };

    const toggleCategory = (category: string) => {
        setActiveCategories(prev => {
            if (category === 'All Category') {
                return ['All Category'];
            }

            const isAlreadySelected = prev.includes(category);
            let next: string[];

            if (isAlreadySelected) {
                next = prev.filter(c => c !== category);
            } else {
                next = [...prev.filter(c => c !== 'All Category'), category];
            }

            // If nothing is selected, default to All
            return next.length === 0 ? ['All Category'] : next;
        });
    };

    const handleExploreMore = () => {
        setSearchQuery('');
        setActiveCategories(['All Category']);
    };

    const refreshData = async () => {
        await refetch();
    };

    return {
        exploreData,
        isLoading: isLoading || isLoadingCategories,
        error,
        searchQuery,
        setSearchQuery,
        categories,
        activeCategories,
        toggleCategory,
        handleSearch,
        isSearching,
        searchResults,
        handleExploreMore,
        refreshData
    };
};

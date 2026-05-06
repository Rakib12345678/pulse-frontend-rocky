import { useState } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { exploreService } from '../services/explore.service';
import { ExploreData, ExploreSearchResponse } from '../types/explore.types';

export const useExplore = () => {
    const queryClient = useQueryClient();
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
            const data = await exploreService.getExploreData(activeCategories);
            const mapItem = (u: any) => ({
                id: u.id || u.userId || u.userID || u.user_id || u.pk || u._id || u.user?.id || u.user?.userId || 0,
                username: u.username || u.user?.username || 'user',
                fullName: u.fullname || u.fullName || u.displayName || u.user?.fullname || u.user?.fullName || u.username || 'Unknown',
                profileImage: u.profileImage || u.avatar || u.user?.profileImage || '',
                followerCount: u.followerCount || u.followersCount || u.followers_count || u.followers || u.user?.followerCount || 0,
                isFollower: u.isFollower || false,
                followedByMe: u.followedByMe || u.isFollowing || u.isFollowed || u.isFollower || u.user?.isFollowed || false,
                isLive: u.isLive || u.user?.isLive || false,
                callId: u.callId || u.user?.callId || null,
                participantCount: u.participantCount || u.participants_count || 0,
                cohostCount: u.cohostCount || 0,
                cohosts: u.cohosts || []
            });

            return {
                trendingStreams: (data.trendingStreams || []).map(mapItem),
                newCreators: (data.newCreators || []).map(mapItem),
                recommendedStreams: (data.recommendedStreams || []).map(mapItem),
                popularStreams: (data.popularStreams || []).map(mapItem),
            };
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

            const results = await exploreService.searchExplore(query);
            
            // Handle case where results.creators might be an object containing the array
            const creatorList = Array.isArray(results.creators) 
                ? results.creators 
                : (results.creators as any)?.data || (results.creators as any)?.users || [];

            return {
                creators: creatorList.map((u: any) => {
                    // Try to extract ID from various common field names or nested objects
                    const id = u.id || u.userId || u.userID || u.user_id || u.pk || u._id || u.user?.id || u.user?.userId || 0;
                    
                    return {
                        id,
                        username: u.username || u.user?.username || 'user',
                        fullName: u.fullname || u.fullName || u.displayName || u.user?.fullname || u.user?.fullName || u.username || 'Unknown',
                        profileImage: u.profileImage || u.avatar || u.user?.profileImage || '',
                        followerCount: u.followerCount || u.followersCount || u.followers_count || u.followers || u.user?.followerCount || 0,
                        isFollower: u.isFollower || false,
                        followedByMe: u.followedByMe || u.isFollowing || u.isFollowed || u.isFollower || u.user?.isFollowed || false,
                        isLive: u.isLive || u.user?.isLive || false,
                        callId: u.callId || u.user?.callId || null,
                        participantCount: u.participantCount || 0,
                        cohostCount: u.cohostCount || 0,
                        cohosts: u.cohosts || []
                    };
                }),
                streams: (Array.isArray(results.streams) ? results.streams : (results.streams as any)?.data || []).map((s: any) => ({
                    ...s,
                    id: s.id || 0
                }))
            };
        },
        enabled: searchQuery.trim().length > 0,
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    const handleSearch = () => {
        if (searchQuery.trim()) {
            queryClient.invalidateQueries({ queryKey: ['exploreSearch', searchQuery.trim()] });
        }
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

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { exploreService } from '../services/explore.service';
import { ExploreData, ExploreSearchResponse, Creator } from '../types/explore.types';
import { toast } from 'sonner';
import { getStreamClient } from '@/features/chat/stream/streamClient';
import { toAbsoluteUrl } from '@/features/chat/utils/chat';
import { getDisplayName, capitalizeName } from '@/features/chat/utils/ChatUtils';

export const useExplore = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Category');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<ExploreSearchResponse | null>(null);
    const [searchSuggestions, setSearchSuggestions] = useState<Creator[]>([]);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const { data: exploreData, isLoading, error } = useQuery<ExploreData>({
        queryKey: ['exploreData'],
        queryFn: async () => {
            // TODO: Uncomment the code below to use Stream API for Explore data instead of mock data
            /*
            let client;
            try {
                client = getStreamClient();
            } catch (e) {
                throw new Error('Stream client not ready yet');
            }

            // 1. Fetch New Creators
            const usersResp = await client.queryUsers({}, { created_at: -1 }, { limit: 12 });
            const newCreators: Creator[] = usersResp.users
                .filter(u => u.id !== client.userID)
                .map(u => ({
                    id: parseInt(u.id, 10) || 0,
                    username: (u as any).username || (u as any).name || u.id,
                    displayName: capitalizeName(getDisplayName({ id: u.id, name: u.name })),
                    profileImage: toAbsoluteUrl((u as any).image ?? ''),
                    followerCount: (u as any).followerCount || 0,
                    followedByMe: false
                }));

            // 2. Fetch Streams (Trending, Popular, Recommended)
            const channelsResp = await client.queryChannels(
                { type: 'livestream' },
                { member_count: -1 },
                { limit: 25 }
            );

            const fetchedStreams = channelsResp.map(channel => {
                const data = channel.data as Record<string, any>;
                return {
                    callId: channel.id!,
                    callType: 'livestream',
                    title: (data?.name as string) || (data?.title as string) || `Stream ${channel.id?.substring(0, 4)}`,
                    category: (data?.category as string) || 'Just Chatting',
                    profileImage: toAbsoluteUrl((data?.image as string) ?? (data?.created_by?.image as string) ?? ''),
                    createdByUserId: data?.created_by?.id || '',
                    participantCount: data?.member_count || 1,
                    followerCount: 0,
                    createdAt: (data?.created_at as string) || new Date().toISOString(),
                    isLive: true,
                    username: data?.created_by?.username || data?.created_by?.name || data?.created_by?.id || 'Unknown',
                };
            });

            // Distribute into the sections as requested
            return {
                trendingStreams: fetchedStreams.slice(0, 8),
                newCreators,
                recommendedStreams: fetchedStreams.slice(8, 16),
                popularStreams: fetchedStreams.slice(16, 24),
            } as ExploreData;
            */

            // Currently loading mock data (which handles the fallback dynamically based on USE_MOCK_DATA)
            return exploreService.getExploreData();
        },
        retry: 3,
        retryDelay: 1000,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!searchQuery.trim()) {
            setSearchSuggestions([]);
            return;
        }

        let stale = false;
        debounceRef.current = setTimeout(async () => {
            setIsSuggesting(true);
            try {
                const client = getStreamClient();
                const resp = await client.queryUsers(
                    { name: { $autocomplete: searchQuery.trim() } },
                    {},
                    { limit: 5 }
                );

                if (!stale) {
                    setSearchSuggestions(
                        resp.users
                            .filter(u => u.id !== client.userID)
                            .map(u => ({
                                id: parseInt(u.id, 10) || 0,
                                username: (u as any).username || (u as any).name || u.id,
                                displayName: capitalizeName(getDisplayName({ id: u.id, name: u.name })),
                                profileImage: toAbsoluteUrl((u as any).image ?? ''),
                                followerCount: (u as any).followerCount || 0,
                                followedByMe: false
                            }))
                    );
                }
            } catch {
                if (!stale) setSearchSuggestions([]);
            } finally {
                if (!stale) setIsSuggesting(false);
            }
        }, 300);

        return () => {
            stale = true;
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [searchQuery]);

    const handleSearch = async (queryOverride?: string) => {
        const query = queryOverride || searchQuery;
        if (!query.trim()) {
            setIsSearching(false);
            setSearchResults(null);
            return;
        }

        setIsSearching(true);
        setSearchSuggestions([]);
        
        try {
            let creators: Creator[] = [];
            
            try {
                const client = getStreamClient();
                const resp = await client.queryUsers(
                    { name: { $autocomplete: query.trim() } },
                    {},
                    { limit: 30 }
                );

                creators = resp.users
                    .filter(u => u.id !== client.userID)
                    .map(u => ({
                        id: parseInt(u.id, 10) || 0,
                        username: (u as any).username || (u as any).name || u.id,
                        displayName: capitalizeName(getDisplayName({ id: u.id, name: u.name })),
                        profileImage: toAbsoluteUrl((u as any).image ?? ''),
                        followerCount: (u as any).followerCount || 0,
                        followedByMe: false
                    }));
            } catch {
                creators = [];
            }
            
            const results = await exploreService.searchExplore(query);
            
            setSearchResults({
                creators: creators.length > 0 ? creators : results.creators,
                streams: results.streams
            });
        } catch (err) {
            toast.error('Search failed. Please try again.');
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleExploreMore = () => {
        setSearchQuery('');
        setSearchResults(null);
        setIsSearching(false);
        setActiveCategory('All Category');
    };

    return {
        exploreData,
        isLoading,
        error,
        searchQuery,
        setSearchQuery,
        activeCategory,
        setActiveCategory,
        handleSearch,
        isSearching,
        searchResults,
        searchSuggestions,
        isSuggesting,
        handleExploreMore
    };
};

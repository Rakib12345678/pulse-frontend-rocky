import api from '@/lib/api';
import { ExploreData, ExploreSearchResponse, Category, ExploreItem } from '../types/explore.types';

export const exploreService = {
    getCategories: async (): Promise<Category[]> => {
        try {
            const response = await api.get('/categories');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch categories:', error);
            return [];
        }
    },

    getWeeklyPopular: async (categories?: string[]): Promise<ExploreItem[]> => {
        try {
            const response = await api.get('/explore/weekly-popular', {
                params: { categories: categories?.join(',') }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch weekly popular:', error);
            return [];
        }
    },

    getTrending: async (categories?: string[]): Promise<ExploreItem[]> => {
        try {
            const response = await api.get('/explore/trending', {
                params: { categories: categories?.join(',') }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch trending:', error);
            return [];
        }
    },

    getNewest: async (categories?: string[]): Promise<ExploreItem[]> => {
        try {
            const response = await api.get('/explore/newest', {
                params: { categories: categories?.join(',') }
            });
            return response.data;
        } catch (error) {
            console.error('Failed to fetch newest:', error);
            return [];
        }
    },

    getInterests: async (): Promise<ExploreItem[]> => {
        try {
            const response = await api.get('/explore/interests');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch interests:', error);
            return [];
        }
    },

    getExploreData: async (categories?: string[]): Promise<ExploreData> => {
        try {
            // Apply category filter only to Popular, Trending, and New
            // For "All", we might pass undefined or empty array
            const filter = categories && categories.length > 0 && !categories.includes('All Category') ? categories : undefined;

            const [trending, newest, interests, popular] = await Promise.all([
                exploreService.getTrending(filter),
                exploreService.getNewest(),
                exploreService.getInterests(),
                exploreService.getWeeklyPopular(filter)
            ]);

            return {
                trendingStreams: trending,
                newCreators: newest,
                recommendedStreams: interests,
                popularStreams: popular
            };
        } catch (error) {
            console.error('Failed to fetch explore data:', error);
            throw error;
        }
    },

    searchExplore: async (query: string): Promise<ExploreSearchResponse> => {
        try {
            const [creators, streams] = await Promise.all([
                api.get('/users/search', { params: { query } }),
                api.get('/stream/feed', { params: { query } }) // Fallback or search in feed
            ]);

            return {
                creators: creators.data || [],
                streams: streams.data.data || []
            };
        } catch (error) {
            console.error('Search failed:', error);
            return { creators: [], streams: [] };
        }
    }
};

import api from '@/lib/api';
import { ExploreData, ExploreSearchResponse } from '../types/explore.types';
import { MOCK_EXPLORE_DATA, MOCK_SEARCH_RESULTS } from './explore.mock';

// Toggle this to switch between API and Mock data
const USE_MOCK_DATA = true;

export const exploreService = {
    getExploreData: async (): Promise<ExploreData> => {
        if (USE_MOCK_DATA) {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 800));
            return MOCK_EXPLORE_DATA;
        }

        try {
            const [trending, newCreators, recommended, popular] = await Promise.all([
                api.get('/stream/feed', { params: { limit: 10 } }),
                api.get('/users/search', { params: { query: '', limit: 10 } }).catch(() => ({ data: [] })), // Fallback for new creators
                api.get('/stream/feed', { params: { limit: 10, offset: 10 } }),
                api.get('/stream/feed', { params: { limit: 10, offset: 20 } })
            ]);

            return {
                trendingStreams: trending.data.data,
                newCreators: newCreators.data || [],
                recommendedStreams: recommended.data.data,
                popularStreams: popular.data.data
            };
        } catch (error) {
            console.error('Failed to fetch explore data:', error);
            throw error;
        }
    },

    searchExplore: async (query: string): Promise<ExploreSearchResponse> => {
        if (USE_MOCK_DATA) {
            await new Promise(resolve => setTimeout(resolve, 500));
            return MOCK_SEARCH_RESULTS;
        }

        const [creators, streams] = await Promise.all([
            api.get('/users/search', { params: { query } }),
            api.get('/stream/feed', { params: { query } }) // Assuming feed supports search
        ]);

        return {
            creators: creators.data || [],
            streams: streams.data.data || []
        };
    }
};

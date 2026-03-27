import { ExploreData, Creator } from '../types/explore.types';
import { FeedStreamItem } from '@/features/live/services/live.service';

const MOCK_AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Morty',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Summer',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Rick',
];

const MOCK_THUMBNAILS = [
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=2130&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop',
];

const createMockStream = (id: number): FeedStreamItem => ({
    callId: `call_${id}`,
    callType: 'default',
    title: `Amazing Live Stream #${id}`,
    category: ['Gaming', 'Music', 'Chatting', 'Tech'][id % 4],
    username: `Streamer_${id}`,
    profileImage: MOCK_THUMBNAILS[id % MOCK_THUMBNAILS.length], // Use thumbnails here
    createdByUserId: `user_${id}`,
    participantCount: Math.floor(Math.random() * 5000),
    followerCount: Math.floor(Math.random() * 10000),
    createdAt: new Date().toISOString(),
    isLive: true,
});

const createMockCreator = (id: number): Creator => ({
    id,
    username: `creator_${id}`,
    displayName: `Creator ${id}`,
    profileImage: MOCK_AVATARS[id % MOCK_AVATARS.length],
    followerCount: Math.floor(Math.random() * 50000),
    followedByMe: false,
});

export const MOCK_EXPLORE_DATA: ExploreData = {
    trendingStreams: Array.from({ length: 7 }, (_, i) => createMockStream(i + 1)),
    newCreators: Array.from({ length: 8 }, (_, i) => createMockCreator(i + 100)),
    recommendedStreams: Array.from({ length: 7 }, (_, i) => createMockStream(i + 20)),
    popularStreams: Array.from({ length: 7 }, (_, i) => createMockStream(i + 40)),
};

export const MOCK_SEARCH_RESULTS = {
    creators: Array.from({ length: 4 }, (_, i) => createMockCreator(i + 200)),
    streams: Array.from({ length: 4 }, (_, i) => createMockStream(i + 300)),
};

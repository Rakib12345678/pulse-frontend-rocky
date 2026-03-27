import { FeedStreamItem } from '@/features/live/services/live.service';

export interface Creator {
    id: number;
    username: string;
    displayName: string;
    profileImage: string | null;
    followerCount: number;
    followedByMe: boolean;
}

export interface ExploreData {
    trendingStreams: FeedStreamItem[];
    newCreators: Creator[];
    recommendedStreams: FeedStreamItem[];
    popularStreams: FeedStreamItem[];
}

export interface ExploreSearchResponse {
    creators: Creator[];
    streams: FeedStreamItem[];
}

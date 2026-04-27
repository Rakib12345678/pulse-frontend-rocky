export interface Category {
    id: number;
    name: string;
}

export interface ExploreItem {
    id: number;
    fullName: string;
    username: string;
    profileImage: string;
    followerCount: number;
    isFollower: boolean;
    followedByMe?: boolean;
    isLive: boolean;
    callId?: string | null;
    participantCount: number;
    cohostCount: number;
    cohosts: {
        username: string;
        profileImage: string;
    }[];
    category?: string;
}

export interface Creator {
    id: number;
    username: string;
    displayName: string;
    profileImage: string | null;
    followerCount: number;
    followedByMe: boolean;
    isFollower: boolean;
    isLive: boolean;
    callId?: string | null;
    category?: string;
    cohosts?: { username: string; profileImage: string; }[];
}

export interface ExploreData {
    trendingStreams: ExploreItem[];
    newCreators: ExploreItem[];
    recommendedStreams: ExploreItem[];
    popularStreams: ExploreItem[];
}

export interface ExploreSearchResponse {
    creators: ExploreItem[];
    streams: ExploreItem[];
}

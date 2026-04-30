export interface User {
  id: number;
  email: string;
  phone?: string;
  googleId?: string;
  status: string;
  emailVerified: boolean;
  eighteenPlus: boolean;
  username?: string;
  displayName?: string;
  fullName?: string;
  bio?: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  location?: string;
  profileImage?: string;
  isDefaultImage?: boolean;
  coins?: number;
  isFollowing?: boolean;
  isFollower?: boolean;
  followedByMe?: boolean;
  blockedByMe?: boolean;
  isLive?: boolean;
  callId?: string | null;
}

export interface LiveStream {
  id: string;
  thumbnail: string;
  username: string;
  displayName: string;
  views: string;
  avatar: string;
  isLive?: boolean;
  userId: number;
  createdAt?: string;
}

export interface LiveStatus {
  isLive: boolean;
  callId: string | null;
  username: string;
}

export interface UserStats {
  postCount: number;
  followerCount: number;
  followingCount: number;
}

export interface Moment extends LiveStream {
  type: 'moment';
  duration?: number;
}

export interface ProfileRouteParams {
  username?: string;
}
export interface BlockedUser {
  id: number;
  username: string;
  fullName: string;
  profileImage: string;
}
export interface FollowUser {
  userId: number;
  username: string;
  fullName: string;
  profileImage?: string;
  isFollowing?: boolean;
  isFollower?: boolean;
  isLive?: boolean;
  callId?: string | null;
}

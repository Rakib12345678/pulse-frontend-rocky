import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User, LiveStream, LiveStatus } from '@/features/profile/services/profile.types';
import { useAuthStore } from '@/features/auth/stores/authStore';
import api from '@/lib/api';

// Current logged-in user
const fetchCurrentUser = async (): Promise<User> => {
  const { data } = await api.get('/users/me');
  return data;
};

// Any user by ID
const fetchUserProfile = async (userId: number): Promise<User> => {
  const { data } = await api.get(`/users/${userId}`);
  return data;
};

// User by username
const fetchUserByUsername = async (username: string): Promise<User> => {
  const { data } = await api.get(`/users/${username}`);
  return data;
};

// Past live streams
const fetchPastLiveStreams = async (userId: number): Promise<LiveStream[]> => {
  const { data } = await api.get(`/users/${userId}/live-streams`);
  return data;
};

// Moments
const fetchMoments = async (userId: number): Promise<LiveStream[]> => {
  const { data } = await api.get(`/users/${userId}/moments`);
  return data;
};

// Live status by username
const fetchUserLiveStatus = async (username: string): Promise<LiveStatus> => {
  const { data } = await api.get(`/stream/${username}/live-status`);
  return data;
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
};

// Any profile by ID
export const useUserProfile = (userId?: number) => {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

// Profile by username
export const useUserByUsername = (username?: string) => {
  return useQuery({
    queryKey: ['userByUsername', username],
    queryFn: () => fetchUserByUsername(username!),
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
};

export const usePastLiveStreams = (userId?: number) => {
  return useQuery({
    queryKey: ['pastLiveStreams', userId],
    queryFn: () => fetchPastLiveStreams(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useMoments = (userId?: number) => {
  return useQuery({
    queryKey: ['moments', userId],
    queryFn: () => fetchMoments(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
};

export const useUserLiveStatus = (username?: string, enabled = true) => {
  return useQuery({
    queryKey: ['userLiveStatus', username],
    queryFn: () => fetchUserLiveStatus(username!),
    enabled: !!username && enabled,
    refetchInterval: 30 * 1000,
    staleTime: 20 * 1000,
  });
};

export const useToggleFollow = () => {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation<
    User,
    unknown,
    { targetUserId: number; followedByMe: boolean },
    {
      previousUserProfile: User | undefined;
      previousUserByUsernameQueries: [readonly unknown[], User | undefined][];
    }
  >({
    mutationFn: async ({ targetUserId, followedByMe }) => {
      const endpoint = followedByMe ? '/users/unfollow' : '/users/follow';
      const { data } = await api.post<User>(endpoint, {
        targetUserId,
        follow: !followedByMe,
      });
      return data;
    },

    onMutate: async ({ targetUserId, followedByMe }) => {
      await queryClient.cancelQueries({ queryKey: ['userProfile', targetUserId] });
      await queryClient.cancelQueries({ queryKey: ['userByUsername'] });

      const previousUserProfile = queryClient.getQueryData<User>(['userProfile', targetUserId]);
      const previousUserByUsernameQueries = queryClient
        .getQueriesData({ queryKey: ['userByUsername'] })
        .filter(([key]) => key[0] === 'userByUsername') as [readonly unknown[], User | undefined][];

      // Optimistic update for userProfile
      queryClient.setQueryData<User>(['userProfile', targetUserId], (old) => {
        if (!old) return old;
        return {
          ...old,
          followedByMe: !followedByMe,
          followerCount: followedByMe
            ? Math.max(0, (old.followerCount ?? 0) - 1)
            : (old.followerCount ?? 0) + 1,
        };
      });

      // Optimistic update for userByUsername queries
      previousUserByUsernameQueries.forEach(([key, old]) => {
        queryClient.setQueryData<User>(key, (oldData) => {
          if (!oldData || oldData.id !== targetUserId) return oldData;
          return {
            ...oldData,
            followedByMe: !followedByMe,
            followerCount: followedByMe
              ? Math.max(0, (oldData.followerCount ?? 0) - 1)
              : (oldData.followerCount ?? 0) + 1,
          };
        });
      });

      // Update Zustand store if the current user is affected
      if (updateUser) {
        const currentUser = queryClient.getQueryData<User>(['currentUser']);
        if (currentUser?.id === targetUserId) {
          updateUser({
            followedByMe: !followedByMe,
            followerCount: followedByMe
              ? Math.max(0, (currentUser.followerCount ?? 0) - 1)
              : (currentUser.followerCount ?? 0) + 1,
          });
        }
      }

      return { previousUserProfile, previousUserByUsernameQueries };
    },

    onError: (err, variables, context) => {
      if (context?.previousUserProfile) {
        queryClient.setQueryData(['userProfile', variables.targetUserId], context.previousUserProfile);
      }
      if (context?.previousUserByUsernameQueries) {
        context.previousUserByUsernameQueries.forEach(([key, data]) => {
          queryClient.setQueryData<User>(key, data);
        });
      }
      console.error('Follow/Unfollow failed:', err);
    },

    onSuccess: (data, variables) => {
      queryClient.setQueryData<User>(['userProfile', variables.targetUserId], data);

      // Update Zustand if current user is affected
      const currentUser = queryClient.getQueryData<User>(['currentUser']);
      if (currentUser?.id === variables.targetUserId) {
        updateUser(data);
      }

      const queries = queryClient
        .getQueriesData({ queryKey: ['userByUsername'] })
        .filter(([key]) => key[0] === 'userByUsername') as [readonly unknown[], User | undefined][];

      queries.forEach(([key]) => {
        queryClient.setQueryData<User>(key, (oldData) => {
          if (!oldData || oldData.id !== variables.targetUserId) return oldData;
          return { ...oldData, ...data };
        });
      });
    },

    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['userByUsername'] });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: number;
      data: Partial<User>;
    }) => {
      const response = await api.patch(`/users/${userId}`, data);
      return response.data;
    },

    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['userByUsername'] });
    },
  });
};
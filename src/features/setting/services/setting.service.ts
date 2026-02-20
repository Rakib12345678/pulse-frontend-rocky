import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BlockedUser } from '@/features/setting/services/setting.types';
import api from '@/lib/api';

// Fetch blocked users 
const fetchBlockedUsers = async (): Promise<BlockedUser[]> => {
  const { data } = await api.get('/users/blocked');
  return data;
};

export const useBlockedUsers = () => {
  return useQuery({
    queryKey: ['blockedUsers'],
    queryFn: fetchBlockedUsers,
    staleTime: 2 * 60 * 1000,
  });
};

// ----- Unblock a user -----
export const useUnblockUser = () => {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, { targetUserId: number }>({
    mutationFn: async ({ targetUserId }) => {
      await api.post('/users/unblock', { targetUserId, block: false });
    },

    // Optimistic: remove from list immediately
    onMutate: async ({ targetUserId }) => {
      await queryClient.cancelQueries({ queryKey: ['blockedUsers'] });
      const previous = queryClient.getQueryData<BlockedUser[]>(['blockedUsers']);
      queryClient.setQueryData<BlockedUser[]>(['blockedUsers'], (old) =>
        old ? old.filter((u) => u.id !== targetUserId) : old
      );
      return { previous };
    },

    onError: (_err, _vars, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(['blockedUsers'], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
    },
  });
};

// Report a user
interface ReportUserPayload {
  targetUserId: number;
  reasonId: string;
  otherText?: string;
}

export const useReportUser = () => {
  return useMutation<void, unknown, ReportUserPayload>({
    mutationFn: async ({ targetUserId, reasonId, otherText }) => {
      await api.post('/users/report', {
        targetUserId,
        reason: reasonId,
        ...(otherText ? { description: otherText } : {}),
      });
    },
  });
};

// Delete account
interface DeletePayload {
  reasonId: string;
  otherText?: string;
}

export const useDeleteAccount = () => {
  return useMutation<void, unknown, DeletePayload>({
    mutationFn: async ({ reasonId, otherText }) => {
      await api.delete('/users/me', {
        data: {
          reason: reasonId,
          ...(otherText ? { description: otherText } : {}),
        },
      });
    },
  });
};
import { useEffect } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService, WalletHistoryFilter, EarningHistoryFilter, WithdrawalRequest, OnboardingLinkRequest } from '@/features/coins/services/payment.service';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { getStreamClient, isStreamConnected } from '@/features/chat/stream/streamClient';

export const useWalletBalance = () => {
  const queryClient = useQueryClient();
  const { updateWallet, isAuthenticated } = useAuthStore();
  const query = useQuery({
    queryKey: ['walletBalance'],
    queryFn: () => paymentService.getWalletBalance(),
    staleTime: 0,
    enabled: isAuthenticated,
  });

  // Event-driven real-time updates (Instantly refresh when a gift arrives)
  useEffect(() => {
    let client: any;
    
    // We poll the connection status every few seconds to ensure we attach as soon as it's ready
    const connInterval = setInterval(() => {
        try {
            if (isStreamConnected()) {
                client = getStreamClient();
                clearInterval(connInterval);
                attachListeners();
            }
        } catch (e) {
            // Wait for next tick
        }
    }, 2000);

    const handleEvent = (event: any) => {
      // Refresh wallet balance whenever a gift is detected, user is updated, or message arrives
      const isGift = event.message?.text?.includes('[GIFT:');
      const isUserUpdate = event.type === 'user.updated' && event.user?.id === client?.userID;
      
      if (isGift || isUserUpdate || event.type === 'notification.message_new') {
        queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
        queryClient.invalidateQueries({ queryKey: ['earningHistory'] });
      }
    };

    const handleConnectionRecovered = () => {
        queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
    };

    const attachListeners = () => {
        if (!client) return;
        client.on('message.new', handleEvent);
        client.on('notification.message_new', handleEvent);
        client.on('user.updated', handleEvent);
        client.on('connection.recovered', handleConnectionRecovered);
    };

    return () => {
      clearInterval(connInterval);
      if (client) {
          client.off('message.new', handleEvent);
          client.off('notification.message_new', handleEvent);
          client.off('user.updated', handleEvent);
          client.off('connection.recovered', handleConnectionRecovered);
      }
    };
  }, [queryClient]); 

  useEffect(() => {
    if (query.data) {
      updateWallet(query.data);
    }
  }, [query.data, updateWallet]);

  return query;
};

export const useWalletHistory = (filter: WalletHistoryFilter, size = 20) => {
  return useInfiniteQuery({
    queryKey: ['walletHistory', filter],
    queryFn: ({ pageParam = 0 }) =>
      paymentService.getWalletHistory(filter, pageParam as number, size),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 0,
    staleTime: 5 * 1000,
  });
};

export const useWithdrawThreshold = () => {
  return useQuery({
    queryKey: ['withdrawThreshold'],
    queryFn: () => paymentService.getWithdrawThreshold(),
    staleTime: 24 * 60 * 60 * 1000,
  });
};

export const useEarningHistory = (filter: EarningHistoryFilter, size = 20) => {
  return useInfiniteQuery({
    queryKey: ['earningHistory', filter],
    queryFn: ({ pageParam = 0 }) =>
      paymentService.getEarningHistory(filter, pageParam as number, size),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 0,
    staleTime: 60 * 1000,
  });
};

/*
export const usePayoutAccount = () => {
    return useQuery({
        queryKey: ['payoutAccount'],
        queryFn: () => paymentService.getPayoutAccount(),
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateOnboardingLink = () => {
    return useMutation({
        mutationFn: (data: OnboardingLinkRequest) => paymentService.createOnboardingLink(data),
    });
};

export const useRequestWithdrawal = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: WithdrawalRequest) => paymentService.requestWithdrawal(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['walletBalance'] });
            queryClient.invalidateQueries({ queryKey: ['earningHistory'] });
        },
    });
};
*/

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { paymentService, WalletHistoryFilter, EarningHistoryFilter } from '@/features/coins/services/payment.service';

export const useWalletBalance = () => {
  return useQuery({
    queryKey: ['walletBalance'],
    queryFn: () => paymentService.getWalletBalance(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useWalletHistory = (filter: WalletHistoryFilter, size = 20) => {
  return useInfiniteQuery({
    queryKey: ['walletHistory', filter],
    queryFn: ({ pageParam = 0 }) =>
      paymentService.getWalletHistory(filter, pageParam as number, size),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 0,
    staleTime: 60 * 1000,
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

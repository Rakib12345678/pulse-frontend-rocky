import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Gem, Loader2 } from 'lucide-react';
import { useWalletBalance, useEarningHistory, useWithdrawThreshold } from '@/features/coins/hooks/useWallet';
import { toast } from 'sonner';
import { EarningHistoryFilter, EarningHistoryItem, EarningHistoryPage } from '@/features/coins/services/payment.service';
import GrowthIcon from "@/assets/Growth.svg";
import DownfallIcon from "@/assets/Downfall.svg";
import CoinIcon from "@/assets/coin.svg";

const TABS: { label: string; filter: EarningHistoryFilter }[] = [
    { label: 'All', filter: 'all' },
    { label: 'Received', filter: 'diamond_received' },
    { label: 'Withdrawal', filter: 'diamond_withdrawn' },
];

export const GetMoney = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState<EarningHistoryFilter>('all');
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    const { data: balanceData, isLoading: isLoadingBalance, error: balanceError } = useWalletBalance();
    const { data: thresholdData } = useWithdrawThreshold();
    const {
        data: historyPages,
        isLoading: isLoadingHistory,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
        error: historyError,
    } = useEarningHistory(activeFilter);

    useEffect(() => {
        if (balanceError) toast.error('Failed to load wallet balance');
        if (historyError) toast.error('Failed to load history');
    }, [balanceError, historyError]);

    const diamonds = balanceData?.diamondBalance ?? 0;
    const threshold = thresholdData?.threshold ?? 500;
    const isWithdrawalEnabled = diamonds >= threshold;

    // Flatten infinite pages
    const transactions = historyPages?.pages.flatMap((p: EarningHistoryPage) => p.items) ?? [];

    // Infinite scroll sentinel
    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage]
    );

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(handleObserver, { threshold: 0.5 });
        observer.observe(el);
        return () => observer.disconnect();
    }, [handleObserver]);


    return (
        <div className="min-h-[calc(100vh-80px)] w-full bg-transparent flex items-start justify-center md:px-8 py-6 md:py-10">
            <div
                className="relative w-full overflow-hidden flex flex-col"
                style={{
                    maxWidth: 1136,
                    height: 'calc(100vh - 160px)',
                    borderRadius: 20,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: '#161616',
                    boxShadow: '0 8px 64px 0 rgba(0,0,0,0.6)',
                }}
            >
                <div
                    className="pointer-events-none absolute rounded-full"
                    style={{
                        width: 169,
                        height: 220,
                        top: -108,
                        right: -92,
                        background: '#FF7700',
                        filter: 'blur(180px)',
                        mixBlendMode: 'color-dodge',
                    }}
                />
                <div
                    className="pointer-events-none absolute rounded-full"
                    style={{
                        width: 220,
                        height: 220,
                        bottom: -110,
                        left: -110,
                        background: '#3E2AB5',
                        filter: 'blur(354px)',
                        mixBlendMode: 'color-dodge',
                    }}
                />

                <div className="relative z-10 w-full mx-auto px-5 pt-6 md:px-10 md:pt-10 text-white shrink-0">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate({ to: "/profile/setting" })}
                        className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-[#1D1F20] flex items-center justify-center hover:bg-[#252830] transition-colors cursor-pointer shrink-0"
                    >
                        <ChevronLeft className="w-6 h-6 md:w-5 md:h-5 text-white" strokeWidth={2.5} />
                    </button>
                    <h1 className="text-xl md:text-2xl font-bold text-white">Get Money</h1>
                    <div className="ml-auto">
                        <button className="bg-[#FF7700] hover:bg-[#ff8800] text-black font-semibold rounded-full px-5 py-2 text-sm transition-colors cursor-pointer">
                            Add Withdrawal Method
                        </button>
                    </div>
                </div>
                <div className="h-px bg-white/5 w-full mb-8 shrink-0" />

                {/* Balance Card */}
                <div className="bg-[#1a1c24] rounded-2xl p-6 border border-white/5 mb-4 flex justify-between items-center">
                    <span className="text-white font-medium text-lg">My Diamonds</span>
                    <div className="flex items-center gap-2">
                        {isLoadingBalance ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <div className="w-6 h-6 flex items-center justify-center relative">
                                    <Gem className="w-5 h-5 text-[#FF7700]" fill="#FF7700" strokeWidth={1.5} />
                                </div>
                                <span className="text-white font-bold text-xl">{diamonds}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* <div className="text-center text-sm mb-6 flex justify-center items-center gap-2">
                    <span className="text-gray-400">Note: 1</span>
                    <Gem className="w-4 h-4 text-[#FF7700] mx-0.5 inline-block -translate-y-[1px]" fill="#FF7700" strokeWidth={1.5} />
                    <span className="text-gray-400">Diamonds = ₹ 1</span>
                </div> */}

                <div className="bg-[#fff3e6] rounded-[24px] p-6 md:p-8 mb-10 border border-[#ffe0cc]">
                    {!isWithdrawalEnabled ? (
                        <div className="flex flex-col items-center">
                            <div className="text-black text-base md:text-sm mb-6 flex items-center justify-center gap-2">
                                NOTE: You should at least have {threshold} diamonds to redeem in your account
                            </div>
                            <div className="w-full bg-[#fae3cd] rounded-full h-2 overflow-hidden">
                                <div 
                                    className="bg-[#FF7700] h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${Math.min(100, (diamonds / threshold) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-4 mx-auto items-center">
                            <input 
                                type="text"
                                placeholder="Enter Withdrawal Amount Here..."
                                className="w-full md:flex-1 bg-[#ffe3ca] border border-[#f5d0b0] rounded-full px-6 py-3.5 text-black placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF7700]/50"
                            />
                            <button className="w-full md:w-auto bg-[#FF7700] hover:bg-[#ff8800] text-black font-bold rounded-full px-8 py-3.5 transition-colors shadow-sm">
                                Withdrawal Amount
                            </button>
                        </div>
                    )}
                </div>
                <div className="h-px bg-white/5 w-full mb-8 relative z-10 shrink-0" />

                {/* History Section */}
                <div className="mb-6">
                    <h2 className="text-white font-bold text-xl mb-6">History</h2>
                    <div className="flex gap-3 flex-wrap">
                        {TABS.map((tab) => (
                            <button
                                key={tab.filter}
                                onClick={() => setActiveFilter(tab.filter)}
                                className={`px-8 py-2.5 rounded-full font-medium text-sm transition-colors cursor-pointer ${
                                    activeFilter === tab.filter
                                        ? 'bg-gray-400 text-black border-transparent'
                                        : 'bg-transparent border border-white/20 text-gray-400 hover:text-white'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="h-px bg-white/5 w-full mt-8" />
                </div>
            </div>

            {/* History List - Scrollable */}
            <div className="flex-1 overflow-y-auto mt-2 px-5 md:px-10 custom-scrollbar">
                <div className="pb-20">
                    {isLoadingHistory ? (
                        <div className="py-10 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-[#FF7700]" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <p className="text-gray-500 text-sm">No transaction history</p>
                        </div>
                    ) : (
                        transactions.map((tx: EarningHistoryItem, idx: number) => {
                            const diamondAmount = tx.noOfCoin ?? (tx as any).noOfDiamond ?? (tx as any).diamonds ?? 0;
                            // If the API provides the original coin amount, we show it. 
                            // Otherwise we just show the diamond amount as fallback.
                            const coinAmount = (tx as any).coinAmount; 

                            return (
                                <div key={`${tx.createdAt}-${idx}`} className="flex justify-between items-center py-4">
                                    <div className="flex gap-4 items-center min-w-0">
                                        <div className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center bg-[#1a1c24] shrink-0 overflow-hidden">
                                            {tx.isSent ? (
                                                <img src={DownfallIcon} alt="Withdrawal" className="w-6 h-6 object-contain" />
                                            ) : (
                                                <img src={GrowthIcon} alt="Received" className="w-6 h-6 object-contain" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs text-gray-500 mb-0.5 truncate">
                                                {tx.isSent ? 'Withdrawal' : 'Received by'}
                                            </div>
                                            <div className="text-white font-semibold truncate leading-tight">
                                                {tx.isSent ? 'Withdrawal Money' : (tx.fullname || tx.username || 'Unknown')}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-4">
                                        <div className="flex items-center gap-2 justify-end">
                                            {!tx.isSent && coinAmount && (
                                                <>
                                                    <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                                                        <img src={CoinIcon} className="w-3.5 h-3.5" alt="Coins" />
                                                        <span className="text-yellow-500 font-bold text-sm">{coinAmount.toLocaleString()}</span>
                                                    </div>
                                                    <span className="text-gray-600 font-medium">=</span>
                                                </>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <Gem className="w-4 h-4 text-[#FF7700]" fill="#FF7700" />
                                                <span className="text-white font-bold text-base">{diamondAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Infinite scroll sentinel */}
                    <div ref={sentinelRef} className="h-4" />

                    {isFetchingNextPage && (
                        <div className="py-4 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-[#FF7700]" />
                        </div>
                    )}

                    {!hasNextPage && transactions.length > 0 && (
                        <p className="text-center text-xs text-gray-600 pb-2">You've reached the end</p>
                    )}
                </div>
            </div>
        </div>
    </div>
);
};

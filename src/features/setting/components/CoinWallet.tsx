import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { useWalletBalance, useWalletHistory } from '@/features/coins/hooks/useWallet';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useCoinsStore } from '@/features/coins/hooks/useCoinsStore';
import { toast } from 'sonner';
import { WalletHistoryFilter } from '@/features/coins/services/payment.service';
import GrowthIcon from "@/assets/Growth.svg";
import DownfallIcon from "@/assets/Downfall.svg";

const TABS: { label: string; filter: WalletHistoryFilter }[] = [
    { label: 'All', filter: 'all' },
    { label: 'Send', filter: 'debit' },
    { label: 'Added', filter: 'credit' },
];

export const CoinWallet = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState<WalletHistoryFilter>('all');
    const { openModal } = useCoinsStore();
    const { wallet } = useAuthStore();
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Balance
    const { data: walletData, isLoading: isLoadingBalance, error: balanceError } =
        useWalletBalance();

    // History (infinite)
    const {
        data: historyPages,
        isLoading: isLoadingHistory,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
        error: historyError,
    } = useWalletHistory(activeFilter);

    useEffect(() => {
        if (balanceError) toast.error('Failed to load wallet balance');
        if (historyError) toast.error('Failed to load transaction history');
    }, [balanceError, historyError]);

    // Infinite scroll via IntersectionObserver
    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
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

    // Flatten pages into a single list
    const transactions = historyPages?.pages.flatMap((p) => p.items) ?? [];

    // Coin balance: prefer live API response, fall back to auth store
    const coinBalance = walletData?.coinBalance ?? wallet?.coinBalance ?? 0;

    const currentUsername = (useAuthStore.getState() as any)?.user?.username ?? '';

    return (
        <div className="min-h-[calc(100vh-80px)] bg-transparent flex items-start justify-center md:px-8 py-6 md:py-10">
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
                {/* Ambient blobs */}
                <div
                    className="pointer-events-none absolute rounded-full"
                    style={{ width: 169, height: 220, top: -108, right: -92, background: '#FF7700', filter: 'blur(180px)', mixBlendMode: 'color-dodge' }}
                />
                <div
                    className="pointer-events-none absolute rounded-full"
                    style={{ width: 220, height: 220, bottom: -110, left: -110, background: '#3E2AB5', filter: 'blur(354px)', mixBlendMode: 'color-dodge' }}
                />

                <div className="relative z-10 w-full mx-auto px-5 pt-6 md:px-10 md:pt-10 text-white shrink-0">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => navigate({ to: '/profile/setting' })}
                            className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-[#1D1F20] flex items-center justify-center hover:bg-[#252830] transition-colors cursor-pointer shrink-0"
                        >
                            <ChevronLeft className="w-6 h-6 md:w-5 md:h-5 text-white" strokeWidth={2.5} />
                        </button>
                        <h1 className="text-xl md:text-2xl font-bold text-white">Coins</h1>
                        <div className="ml-auto">
                            <button
                                onClick={() => openModal()}
                                className="bg-[#FF7700] hover:bg-[#ff8800] text-black font-semibold rounded-full px-5 py-2 text-sm transition-colors cursor-pointer"
                            >
                                Add More Coins
                            </button>
                        </div>
                    </div>
                    <div className="h-px bg-white/5 w-full mb-8" />

                    {/* Balance Card */}
                    <div className="mb-8">
                        {/* Coins */}
                        <div className="bg-[#1a1c24] rounded-2xl p-6 border border-white/5 flex justify-between items-center w-full">
                            <span className="text-white font-medium text-lg">My Coins</span>
                            <div className="flex items-center gap-2">
                                {isLoadingBalance ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <div className="w-5 h-5 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" />
                                        <span className="text-white font-bold text-xl">{coinBalance.toLocaleString()}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="h-px bg-white/5 w-full mb-8 relative z-10" />

                {/* History Section */}
                <div className="mb-6 shrink-0 relative z-10">
                    <h2 className="text-white font-bold text-xl mb-6 px-5 md:px-10">History</h2>
                    <div className="flex gap-3 flex-wrap px-5 md:px-10">
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

                {/* History List */}
                <div className="flex-1 overflow-y-auto mt-2 px-5 md:px-10 custom-scrollbar relative z-10">
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
                            transactions.map((tx, idx) => {
                                 // Determine if this is a self top-up (username is empty or matches own username)
                                 const isAddedMoney = !tx.username || tx.username === currentUsername;
                                 const displayName = isAddedMoney ? 'Add Money' : tx.sentOn || tx.fullname || tx.username;
                                 const label = isAddedMoney ? '' : 'Sent on';

                                 return (
                                     <div key={`${tx.createdAt}-${idx}`} className="flex justify-between items-center px-1 py-4">
                                         <div className="flex gap-4 items-center min-w-0">
                                             <div className="w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center bg-[#1a1c24] shrink-0 overflow-hidden">
                                                 {isAddedMoney ? (
                                                     <img src={GrowthIcon} alt="Added" className="w-6 h-6 object-contain" />
                                                 ) : tx.isSent ? (
                                                     <img src={DownfallIcon} alt="Sent" className="w-6 h-6 object-contain" />
                                                 ) : (
                                                     <img src={GrowthIcon} alt="Received" className="w-6 h-6 object-contain" />
                                                 )}
                                             </div>
                                             <div className="min-w-0">
                                                 {label && (
                                                     <div className="text-xs text-gray-500 mb-0.5 truncate">{label}</div>
                                                 )}
                                                 <div className="text-white font-semibold truncate leading-tight">{displayName}</div>
                                             </div>
                                         </div>
                                         <div className="text-right shrink-0 ml-4">
                                             <div className="flex items-center gap-1.5 justify-end mb-1">
                                                 <div className="w-3.5 h-3.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                                                 <span className={`font-bold text-base ${tx.isSent && !isAddedMoney ? 'text-gray-300' : 'text-white'}`}>
                                                     {tx.isSent && !isAddedMoney ? '-' : '+'}{(tx.noOfCoin ?? 0).toLocaleString()}
                                                 </span>
                                             </div>
                                             <div className="text-[10px] text-gray-500">
                                                 {new Date(tx.createdAt).toLocaleDateString('en-GB', {
                                                     day: 'numeric',
                                                     month: 'short',
                                                 })}
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

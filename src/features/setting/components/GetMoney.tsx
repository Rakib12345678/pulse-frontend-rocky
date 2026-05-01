import { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, Gem, Loader2 } from 'lucide-react';
import { 
    useWalletBalance, 
    useEarningHistory, 
    useWithdrawThreshold,
    // usePayoutAccount,
    // useCreateOnboardingLink,
    // useRequestWithdrawal
} from '@/features/coins/hooks/useWallet';
import { toast } from 'sonner';
import { EarningHistoryFilter, EarningHistoryItem, EarningHistoryPage } from '@/features/coins/services/payment.service';
import GrowthIcon from "@/assets/Growth.svg";
import DownfallIcon from "@/assets/Downfall.svg";
import CoinIcon from "@/assets/coin.svg";

// Modals imported but logic will be bypassed for "UI only"
import {
    WithdrawFundsModal,
    ConfirmWithdrawalModal,
    WithdrawalSuccessModal,
    WithdrawalFailedModal,
    UpdateWithdrawalMethodModal,
    SelectCountryModal
} from './WithdrawalModals';

const TABS: { label: string; filter: EarningHistoryFilter }[] = [
    { label: 'All', filter: 'all' },
    { label: 'Received', filter: 'diamond_received' },
    { label: 'Withdrawal', filter: 'diamond_withdrawn' },
];

export const GetMoney = () => {
    const navigate = useNavigate();
    const [activeFilter, setActiveFilter] = useState<EarningHistoryFilter>('all');
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Modal States (Kept active to prevent TS errors, but modals are commented below)
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

    // Queries & Mutations
    const { data: balanceData, isLoading: isLoadingBalance, error: balanceError } = useWalletBalance();
    const { data: thresholdData } = useWithdrawThreshold();
    
    // FUNCTIONALITY - Commented out but variables defined as mocks below to prevent errors
    /* 
    const { data: payoutAccount, isLoading: isLoadingPayout, refetch: refetchPayout } = usePayoutAccount();
    const { mutate: createOnboardingLink, isPending: isOnboarding } = useCreateOnboardingLink();
    const { mutate: requestWithdrawal, isPending: isWithdrawing } = useRequestWithdrawal();
    */

    // MOCKS FOR UI (Prevents "Cannot find name" errors)
    const kycStatus = 'NOT_STARTED' as any; // Set to 'PAYOUTS_ENABLED' to see the withdrawal amount input
    const canWithdraw = kycStatus === 'PAYOUTS_ENABLED';
    const isOnboarding = false;
    const isLoadingPayout = false;
    const isWithdrawing = false;
    
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

    // UI configuration based on status
    const statusButtonConfig = { label: 'Add Withdrawal Method', disabled: false };

    // Function preserved in comments but logic mocked below
    /* 
    const handleOriginalOnboardingClick = () => {
        createOnboardingLink({
            return_url: window.location.href,
            refresh_url: window.location.href,
        }, {
            onSuccess: (data) => {
                if (data.url) window.location.href = data.url;
            },
            onError: () => toast.error('Failed to create onboarding link')
        });
    };
    */
    const handleOnboardingClick = () => {
        console.log('Onboarding clicked (Functional code is commented out)');
    };

    const handleWithdrawClick = () => {
        setIsWithdrawModalOpen(true);
    };

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
        <div className="h-[calc(100dvh-80px)] md:min-h-[calc(100vh-80px)] md:h-auto w-full bg-transparent flex items-start justify-center md:px-8 py-4 md:py-10">
            <div
                className="relative w-full h-full md:h-[calc(100vh-160px)] md:min-h-[70vh] overflow-hidden flex flex-col rounded-[20px] border border-white/10 bg-[#161616] shadow-[0_8px_64px_0_rgba(0,0,0,0.6)]"
                style={{
                    maxWidth: 1136,
                }}
            >
                {/* Background Decorations */}
                <div className="pointer-events-none absolute rounded-full top-[-108px] right-[-92px] w-[169px] h-[220px] bg-[#FF7700] blur-[180px] mix-blend-color-dodge" />
                <div className="pointer-events-none absolute rounded-full bottom-[-110px] left-[-110px] w-[220px] h-[220px] bg-[#3E2AB5] blur-[354px] mix-blend-color-dodge" />

                {/* Fixed Top Section */}
                <div className="relative z-10 w-full mx-auto text-white shrink-0 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6 px-5 pt-6 md:px-10 md:pt-10 pb-0">
                        <button
                            onClick={() => navigate({ to: "/profile/setting" })}
                            className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-[#1D1F20] flex items-center justify-center hover:bg-[#252830] transition-colors cursor-pointer shrink-0"
                        >
                            <ChevronLeft className="w-6 h-6 md:w-5 md:h-5 text-white" strokeWidth={2.5} />
                        </button>
                        <h1 className="text-lg md:text-2xl font-bold text-white whitespace-nowrap">Get Money</h1>
                        <div className="ml-auto flex shrink-0">
                            <button 
                                onClick={handleOnboardingClick}
                                disabled={statusButtonConfig.disabled || isOnboarding || isLoadingPayout}
                                className={`font-semibold rounded-full px-3 py-1.5 md:px-5 md:py-2 text-[11px] md:text-sm transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                                    statusButtonConfig.disabled 
                                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                    : 'bg-[#FF7700] hover:bg-[#ff8800] text-black'
                                }`}
                            >
                                {statusButtonConfig.label}
                            </button>
                        </div>
                    </div>
                    <div className="h-px bg-white/5 w-full shrink-0" />
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 w-full text-white pt-2">
                    <div className="px-5 md:px-10 pt-4 md:pt-6 shrink-0">
                        {/* Balance Card */}
                        <div className="bg-[#1a1c24] rounded-2xl p-5 md:p-6 border border-white/5 mb-4 flex justify-between items-center">
                            <span className="text-white font-medium text-base md:text-lg">My Diamonds</span>
                            <div className="flex items-center gap-2">
                                {isLoadingBalance ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <div className="w-6 h-6 flex items-center justify-center relative">
                                            <Gem className="w-5 h-5 text-[#FF7700]" fill="#FF7700" strokeWidth={1.5} />
                                        </div>
                                        <span className="text-white font-bold text-lg md:text-xl">{diamonds}</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Withdrawal Section */}
                        <div className="bg-[#fff3e6] rounded-[24px] p-6 md:p-10 mb-6 md:mb-10 border border-[#ffe0cc]">
                            {!isWithdrawalEnabled ? (
                                <div className="flex flex-col items-center text-center">
                                    <div className="text-black text-sm mb-6 flex items-center justify-center gap-2 font-bold">
                                        NOTE: You should at least have {threshold} diamonds to redeem in your account
                                    </div>
                                    <div className="w-full bg-[#fae3cd] rounded-full h-3 overflow-hidden shadow-inner">
                                        <div
                                            className="bg-[#FF7700] h-full rounded-full transition-all duration-700 ease-out"
                                            style={{ width: `${Math.min(100, (diamonds / threshold) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ) : canWithdraw ? (
                                <div className="flex flex-col md:flex-row gap-4 mx-auto items-center w-full">
                                    <div className="w-full md:flex-1 bg-[#ffe3ca] border border-[#f5d0b0] rounded-full px-6 py-3.5 flex items-center text-black/40 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                                        Enter Withdrawal Amount Here...
                                    </div>
                                    <button 
                                        onClick={handleWithdrawClick}
                                        className="w-full md:w-auto bg-[#FF7700] hover:bg-[#ff8800] text-black font-bold rounded-full px-6 md:px-8 py-3 md:py-3.5 transition-colors shadow-sm cursor-pointer whitespace-nowrap text-sm"
                                    >
                                        Withdrawal Amount
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-2">
                                    <p className="text-black text-sm mb-4 font-medium text-center">Please complete your verification to enable withdrawals</p>
                                    <button 
                                        onClick={handleOnboardingClick}
                                        className="bg-[#FF7700] hover:bg-[#ff8800] text-black font-bold rounded-full px-8 py-3 transition-colors shadow-sm"
                                    >
                                        {statusButtonConfig.label}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-white/5 w-full mb-4 md:mb-8 relative z-10 shrink-0" />

                    {/* History Section Tabs */}
                    <div className="mb-4 md:mb-6 shrink-0 relative z-10">
                        <h2 className="text-white font-bold text-lg md:text-xl mb-4 md:mb-6 px-5 md:px-10">History</h2>
                        <div className="flex gap-2 md:gap-3 flex-nowrap overflow-x-auto custom-scrollbar pb-2 px-5 md:px-10">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.filter}
                                    onClick={() => setActiveFilter(tab.filter)}
                                    className={`px-5 md:px-8 py-2 md:py-2.5 rounded-full font-medium text-xs md:text-sm transition-colors cursor-pointer shrink-0 whitespace-nowrap ${activeFilter === tab.filter
                                        ? 'bg-gray-400 text-black border-transparent'
                                        : 'bg-transparent border border-white/20 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="h-px bg-white/5 w-full mt-4 md:mt-8" />
                    </div>
                    {/* History List */}
                    <div className="mt-2 px-5 md:px-10 pb-20">
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
                                const coinAmount = (tx as any).coinAmount;

                                const formatDate = (dateStr: string) => {
                                    const date = new Date(dateStr);
                                    const day = date.getDate();
                                    const month = date.toLocaleDateString('en-GB', { month: 'long' });
                                    const getOrdinal = (n: number) => {
                                        const s = ["th", "st", "nd", "rd"];
                                        const v = n % 100;
                                        return s[(v - 20) % 10] || s[v] || s[0];
                                    };
                                    return `${day}${getOrdinal(day)} ${month}`;
                                };

                                return (
                                    <div key={`${tx.createdAt}-${idx}`} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
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
                                                    {tx.isSent ? 'Withdrawal Money' : 'Received on'}
                                                </div>
                                                <div className="text-white font-semibold truncate leading-tight">
                                                    {tx.isSent ? 'Withdrawal Money' : formatDate(tx.createdAt)}
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
                        <div ref={sentinelRef} className="h-4" />
                        {isFetchingNextPage && (
                            <div className="py-4 flex items-center justify-center">
                                <Loader2 className="w-5 h-5 animate-spin text-[#FF7700]" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals commented out but fully preserved */}
            {/* 
            <WithdrawFundsModal
                isOpen={isWithdrawModalOpen}
                onClose={() => setIsWithdrawModalOpen(false)}
                balance={diamonds}
                onSubmit={(amount) => {
                    console.log('Withdrawal amount submitted:', amount);
                    setIsWithdrawModalOpen(false);
                    setIsConfirmModalOpen(true);
                }}
            />

            <ConfirmWithdrawalModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                amount={0} 
                isPending={isWithdrawing}
                onConfirm={() => {
                    console.log('Confirmation confirmed');
                    setIsConfirmModalOpen(false);
                }}
            />

            <WithdrawalSuccessModal
                isOpen={isSuccessModalOpen}
                onClose={() => setIsSuccessModalOpen(false)}
            />

            <WithdrawalFailedModal
                isOpen={isFailedModalOpen}
                onClose={() => setIsFailedModalOpen(false)}
                error="Failed to process withdrawal"
            />

            <UpdateWithdrawalMethodModal
                isOpen={isUpdateModalOpen}
                onClose={() => setIsUpdateModalOpen(false)}
                onUpdate={handleOnboardingClick}
            />

            <SelectCountryModal
                isOpen={isCountryModalOpen}
                onClose={() => setIsCountryModalOpen(false)}
            />
            */}
        </div>
    );
};

import { useCoinsStore } from '../hooks/useCoinsStore';
import { useWalletBalance } from '../hooks/useWallet';
import coinIcon from '@/assets/coin.svg';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const AmountDisplay = ({ coins }: { coins: number }) => (
    <div className="bg-[#1A1C1E] border border-white/5 rounded-2xl px-8 py-3.5 flex items-center gap-3.5 shadow-xl">
        <img src={coinIcon} alt="coin" className="w-7 h-7 drop-shadow-md" />
        <span className="text-white font-bold text-2xl">{coins.toLocaleString()}</span>
    </div>
);

export const ResultView = () => {
    const { resultStatus, selectedPackage, sessionData, closeModal, reset, setStep } = useCoinsStore();
    const { refetch } = useWalletBalance();

    const coinsToDisplay = selectedPackage?.coins || sessionData?.coins || 0;

    useEffect(() => {
        if (resultStatus === 'success' || resultStatus === 'failure') {
            refetch();
        }
    }, [resultStatus, refetch]);

    const handleRetry = () => {
        if (selectedPackage) {
            setStep('checkout');
        } else {
            reset();
        }
    };

    if (resultStatus === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-5 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-[#FF8800]" />
                <div className="space-y-1">
                    <h2 className="text-white text-xl font-bold">Verifying Payment...</h2>
                    <p className="text-white/40 text-sm">Please wait while we confirm your transaction</p>
                </div>
            </div>
        );
    }

    if (resultStatus === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-8 text-center animate-in fade-in zoom-in duration-300">
                <h2 className="text-white text-3xl font-black">Congratulations 🎉</h2>

                {coinsToDisplay > 0 && <AmountDisplay coins={coinsToDisplay} />}

                <p className="text-white text-base font-medium">{coinsToDisplay.toLocaleString()} coins has been added to your wallet successfully</p>

                <Button
                    onClick={closeModal}
                    className="w-full max-w-[240px] mt-4 py-6 rounded-full bg-[#FF8800] text-black font-black text-lg hover:bg-[#FF8800]/90 transition-all shadow-lg active:scale-[0.98]"
                >
                    Explore Stream
                </Button>
            </div>
        );
    }

    if (resultStatus === 'expired') {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
                <h2 className="text-white text-3xl font-black">Session Expired</h2>
                <p className="text-white/50 text-[15px] max-w-[280px] leading-relaxed">
                    Your checkout session has expired. Please try purchasing again to continue.
                </p>
                <Button
                    onClick={handleRetry}
                    className="w-full max-w-[240px] mt-2 py-6 rounded-full bg-[#FF8800] text-black font-black text-lg hover:bg-[#FF8800]/90 transition-all shadow-lg active:scale-[0.98]"
                >
                    Try Again
                </Button>
            </div>
        );
    }

    // Failure state
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-7 text-center">
            <h2 className="text-white text-[28px] font-black leading-tight">Oops! Operation Failed</h2>

            {coinsToDisplay > 0 && <AmountDisplay coins={coinsToDisplay} />}

            <div className="space-y-5">
                <p className="text-white/50 text-[15px] max-w-[300px] leading-relaxed px-4">
                    Your payment could not be processed. Please try again or contact support if the issue persists.
                </p>

                <a
                    href="mailto:support@pulselive.com"
                    className="block text-white/30 text-[15px] hover:text-white transition-colors"
                >
                    support@pulselive.com
                </a>
            </div>

            <Button
                onClick={handleRetry}
                className="w-full max-w-[240px] mt-2 py-6 rounded-full bg-[#FF8800] text-black font-black text-lg hover:bg-[#FF8800]/90 transition-all shadow-lg active:scale-[0.98]"
            >
                Add Coins Again
            </Button>
        </div>
    );
};

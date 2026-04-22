import { useCoinsStore } from '../hooks/useCoinsStore';
import coinIcon from '@/assets/coin.svg';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export const ResultView = () => {
    const { resultStatus, selectedPackage, sessionData, closeModal, reset, setStep } = useCoinsStore();

    const coinsToDisplay = selectedPackage?.coins || sessionData?.coins || 0;

    const handleRetry = () => {
        if (selectedPackage) {
            setStep('checkout');
        } else {
            reset(); // fallback to selection grid if somehow package was lost
        }
    };

    if (resultStatus === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#FF8800]" />
                <h2 className="text-white text-xl font-bold">Verifying Payment...</h2>
                <p className="text-gray-400 text-sm">Please wait while we confirm your payment.</p>
            </div>
        );
    }

    if (resultStatus === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-6 text-center">
                <h2 className="text-white text-3xl font-bold italic">Congratulations</h2>

                {/* Coin Badge */}
                {coinsToDisplay > 0 && (
                    <div className="bg-[#2D2D2D] rounded-xl px-5 py-3 flex items-center gap-2.5">
                        <img src={coinIcon} alt="coin" className="w-6 h-6" />
                        <span className="text-white font-bold text-xl">{coinsToDisplay.toLocaleString()}</span>
                    </div>
                )}

                <p className="text-gray-300 text-base">Added Coins Successfully</p>

                {/* Explore Stream Button */}
                <Button
                    variant="outline"
                    onClick={closeModal}
                    className="mt-4 px-10 py-3.5 h-auto rounded-full border-2 border-[#FF8800] text-[#FF8800] font-bold text-base hover:bg-[#FF8800]/10 hover:text-[#FF8800] transition-all cursor-pointer"
                >
                    Explore Stream
                </Button>
            </div>
        );
    }

    if (resultStatus === 'expired') {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-5 text-center">
                <h2 className="text-white text-3xl font-bold italic">Session Expired</h2>
                <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                    Your checkout session has expired. Please try purchasing again.
                </p>
                <Button
                    variant="outline"
                    onClick={handleRetry}
                    className="mt-2 px-10 py-3.5 h-auto rounded-full border-2 border-[#FF8800] text-[#FF8800] font-bold text-base hover:bg-[#FF8800]/10 transition-all cursor-pointer"
                >
                    Add Coins Again
                </Button>
            </div>
        );
    }

    // Failure state
    return (
        <div className="flex flex-col items-center justify-center py-8 gap-5 text-center">
            <h2 className="text-white text-3xl font-bold italic">Oops! Operation Failed</h2>

            {/* Coin Badge */}
            {coinsToDisplay > 0 && (
                <div className="bg-[#1F1F1F] rounded-xl px-6 py-2.5 flex items-center gap-3">
                    <img src={coinIcon} alt="coin" className="w-6 h-6" />
                    <span className="text-white font-bold text-xl">{coinsToDisplay.toLocaleString()}</span>
                </div>
            )}

            <p className="text-[#888888] text-[15px] max-w-[340px] leading-relaxed mt-2">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris massa mauris, for further information connect
            </p>

            <a href="mailto:support@pulselive.com" className="text-[#555555] text-[15px] hover:text-white transition-colors mb-2">
                support@pulselive.com
            </a>

            {/* Add Coins Again Button */}
            <Button
                onClick={handleRetry}
                className="px-8 py-6 h-auto rounded-full bg-[#FF8800] border-none text-black font-semibold text-lg hover:bg-[#FF8800]/90 transition-all cursor-pointer"
            >
                Add Coins Again
            </Button>
        </div>
    );
};

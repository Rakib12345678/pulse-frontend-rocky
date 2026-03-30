import { useCoinsStore } from '../hooks/useCoinsStore';
import coinIcon from '@/assets/coin.svg';
import { Button } from '@/components/ui/button';

export const ResultView = () => {
    const { resultStatus, selectedPackage, closeModal, reset } = useCoinsStore();

    if (!selectedPackage) return null;

    if (resultStatus === 'success') {
        return (
            <div className="flex flex-col items-center justify-center py-8 gap-6 text-center">
                <h2 className="text-white text-3xl font-bold italic">Congratulations</h2>

                {/* Coin Badge */}
                <div className="bg-[#2D2D2D] rounded-xl px-5 py-3 flex items-center gap-2.5">
                    <img src={coinIcon} alt="coin" className="w-6 h-6" />
                    <span className="text-white font-bold text-xl">{selectedPackage.coins.toLocaleString()}</span>
                </div>

                <p className="text-gray-300 text-base">Added Coins Successfully</p>

                {/* Explore Stream Button */}
                <Button
                    variant="ghost"
                    onClick={closeModal}
                    className="mt-4 px-10 py-3.5 h-auto rounded-full border-2 border-[#FF8800] text-[#FF8800] font-bold text-base hover:bg-[#FF8800]/10 hover:text-[#FF8800] hover:text-[#FF8800]transition-all cursor-pointer"
                >
                    Explore Stream
                </Button>
            </div>
        );
    }

    // Failure state
    return (
        <div className="flex flex-col items-center justify-center py-8 gap-5 text-center">
            <h2 className="text-white text-3xl font-bold italic">Oops! Operation Failed</h2>

            {/* Coin Badge */}
            <div className="bg-[#2D2D2D] rounded-xl px-5 py-3 flex items-center gap-2.5">
                <img src={coinIcon} alt="coin" className="w-6 h-6" />
                <span className="text-white font-bold text-xl">{selectedPackage.coins.toLocaleString()}</span>
            </div>

            <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris massa mauris, for further information connect
            </p>

            <a href="mailto:support@pulselive.com" className="text-gray-400 text-sm hover:text-white transition-colors">
                support@pulselive.com
            </a>

            {/* Add Coins Again Button */}
            <Button
                variant="ghost"
                onClick={reset}
                className="mt-2 px-10 py-3.5 h-auto rounded-full border-2 border-[#FF8800] text-[#FF8800] font-bold text-base hover:bg-[#FF8800]/10 hover:text-[#FF8800] transition-all cursor-pointer"
            >
                Add Coins Again
            </Button>
        </div>
    );
};

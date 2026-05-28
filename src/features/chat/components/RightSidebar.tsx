import React from 'react';
import { useGoLive } from '@/features/profile/hooks/useGoLive';
import LiveIcon from '@/assets/Live.svg';
import CoinIcon from '@/assets/Coin.svg';
import { cn } from '@/lib/utils';
import { useCoinsStore } from '@/features/coins/hooks/useCoinsStore';

interface RightSidebarProps {
    className?: string;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ className }) => {
    const handleGoLiveClick = useGoLive();
    const { openModal } = useCoinsStore();

    return (
        <>
            <div className={cn("flex flex-col h-full bg-[#111213] w-20 lg:w-28 xl:w-36 items-center py-6 justify-end pb-24 gap-8", className)}>
                {/* Add More Icon (Coins) */}
                <button
                    onClick={openModal}
                    className="w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center p-3 rounded-2xl bg-transparent border-none lg:bg-white/5 lg:border lg:border-white/5 lg:hover:bg-[#FF7700]/10 lg:hover:border-[#FF7700]/30 transition-all duration-300 group cursor-pointer"
                    title="Add Coins"
                >
                    <img 
                        src={CoinIcon} 
                        alt="Add Coins" 
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                </button>

                {/* Go Live Icon at the bottom */}
                <div
                    onClick={handleGoLiveClick}
                    className="cursor-pointer group relative"
                >
                    <div className="absolute inset-0 bg-orange-500/20 blur-2xl group-hover:bg-orange-500/40 transition-all rounded-full" />
                    <img
                        src={LiveIcon}
                        alt="Go Live"
                        className="w-16 h-16 lg:w-18 lg:h-18 rounded-full transition-transform active:scale-95 relative z-10"
                    />
                </div>
            </div>
        </>
    );
};

import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface ExploreNoDataStateProps {
    onRetry: () => void;
}

export const ExploreNoDataState: React.FC<ExploreNoDataStateProps> = ({ onRetry }) => {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center max-w-2xl mx-auto animate-in fade-in zoom-in duration-700">
            <div className="mb-8 p-4 rounded-full bg-white/5 border border-white/10 shadow-2xl relative">
                <div className="absolute inset-0 bg-[#FF8800]/10 blur-[40px] rounded-full" />
                <RefreshCw className="w-10 h-10 text-[#FF8800] relative z-10 animate-pulse" />
            </div>
            
            <h2 className="text-white font-black text-4xl mb-6 tracking-tight">
                No Streams Yet
            </h2>
            
            <p className="text-gray-400 text-xm mb-12 leading-relaxed max-w-lg mx-auto font-medium">
                Oops! It looks like there's no data available for the selected categories. <br className="hidden sm:block" />
                Check back later or try selecting different categories!
            </p>

            <Button
                onClick={onRetry}
                className="bg-[#FF8800] hover:bg-[#ff9922] text-black font-black rounded-full px-12 h-13 text-xl transition-all shadow-[0_0_30px_rgba(255,136,0,0.4)] hover:scale-105 active:scale-95 cursor-pointer border-none flex items-center gap-3"
            >
                <RefreshCw className="w-6 h-6" />
                Refresh Data
            </Button>
        </div>
    );
};

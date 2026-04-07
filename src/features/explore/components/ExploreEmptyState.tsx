import React from 'react';
import { Button } from '@/components/ui/button';
import emptyIcon from '@/assets/Empty.svg';
import { useNavigate } from '@tanstack/react-router';

interface ExploreEmptyStateProps {
    onExploreMore: () => void;
}

export const ExploreEmptyState: React.FC<ExploreEmptyStateProps> = ({ onExploreMore }) => {
    const navigate = useNavigate();

    const handleExploreMore = () => {
        onExploreMore();
        navigate({ to: '/' });
    };

    return (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center max-w-2xl mx-auto animate-in fade-in zoom-in duration-700">
            <div className="mb-10 relative">
                <div className="absolute inset-0 bg-[#FF8800]/20 blur-[60px] rounded-full" />
                <img 
                    src={emptyIcon} 
                    alt="No results" 
                    className="w-20 h-20 relative z-10 drop-shadow-[0_0_15px_rgba(255,136,0,0.4)]" 
                />
            </div>
            
            <h2 className="text-white font-black text-3xl mb-6 tracking-tight">
                Oops! No User Found
            </h2>
            
            <p className="text-gray-400 text-xm mb-12 leading-relaxed max-w-lg mx-auto font-medium">
                We couldn't find anyone matching your search. <br className="hidden sm:block" />
                Try a different name or explore what's trending!
            </p>

            <Button
                onClick={handleExploreMore}
                className="bg-[#FF8800] hover:bg-[#ff9922] text-black font-black rounded-full px-12 h-13 text-xl transition-all shadow-[0_0_30px_rgba(255,136,0,0.4)] hover:scale-105 active:scale-95 cursor-pointer border-none"
            >
                Explore More
            </Button>
        </div>
    );
};

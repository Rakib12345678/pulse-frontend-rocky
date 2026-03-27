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
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-2xl mx-auto">
            <div className="mb-8">
                <img src={emptyIcon} alt="No results" className="w-32 h-32 opacity-50" />
            </div>
            
            <h2 className="text-white font-bold text-4xl mb-4">Oops! No User Found</h2>
            
            <p className="text-gray-400 text-lg mb-10 leading-relaxed">
                We couldn't find anyone matching your search. Try a different name or explore what's trending!
            </p>

            <Button
                onClick={handleExploreMore}
                className="bg-[#FF8800] hover:bg-[#ff9922] text-black font-extrabold rounded-full px-12 h-14 text-lg transition-all shadow-[0_0_20px_rgba(255,136,0,0.3)] cursor-pointer"
            >
                Explore More
            </Button>
        </div>
    );
};

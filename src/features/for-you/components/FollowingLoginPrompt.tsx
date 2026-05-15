import React from 'react';
import { Button } from '@/components/ui/button';

interface FollowingLoginPromptProps {
    onLoginClick?: () => void;
}

export const FollowingLoginPrompt: React.FC<FollowingLoginPromptProps> = ({ onLoginClick }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center w-full">
            <h2 className="text-xl font-semibold text-white mb-2">
                Log in to follow creators
            </h2>
            <p className="text-xl font-semibold text-white mb-2">and view your following list.</p>
        </div>
    );
};

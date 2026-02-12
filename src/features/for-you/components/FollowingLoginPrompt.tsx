import React from 'react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FollowingLoginPromptProps {
    onLoginClick: () => void;
}

export const FollowingLoginPrompt: React.FC<FollowingLoginPromptProps> = ({ onLoginClick }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6">
                <LogIn className="h-16 w-16 text-white/70 mx-auto" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
                Please Login First to see your
            </h2>
            <p className="text-2xl font-bold text-white mb-8">following details</p>
            <Button
                onClick={onLoginClick}
                className="px-10 py-3 rounded-full bg-[#FF8800] text-black text-base font-semibold hover:bg-[#ff9922] transition-all border-none"
            >
                Login
            </Button>
        </div>
    );
};

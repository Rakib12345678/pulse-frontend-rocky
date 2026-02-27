import React from 'react';
import { cn } from '@/lib/utils';

export type TabType = 'live' | 'following';

interface TabSwitcherProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
    className?: string;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
    activeTab,
    onTabChange,
    className,
}) => {
    return (
        <div
            className={cn(
                'flex items-center rounded-full border border-white/15 bg-[#1D1F20] overflow-hidden min-w-60',
                className
            )}
        >
            <button
                onClick={() => onTabChange('live')}
                className={cn(
                    'flex-1 py-2.5 text-md font-semibold transition-all duration-200',
                    activeTab === 'live'
                        ? 'text-white bg-[#2C2F30]'
                        : 'text-white/40'
                )}
            >
                Live
            </button>

            {/* Vertical divider */}
            <div className="w-px h-11 bg-white/15 shrink-0" />

            <button
                onClick={() => onTabChange('following')}
                className={cn(
                    'flex-1 py-2.5 text-md font-semibold transition-all duration-200',
                    activeTab === 'following'
                        ? 'text-white bg-[#2C2F30]'
                        : 'text-white/40'
                )}
            >
                Following
            </button>
        </div>
    );
};
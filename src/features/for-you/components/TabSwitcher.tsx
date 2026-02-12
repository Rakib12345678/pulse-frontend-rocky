import React from 'react';

export type TabType = 'live' | 'following';

interface TabSwitcherProps {
    activeTab: TabType;
    onTabChange: (tab: TabType) => void;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="flex rounded-full bg-gray-800 w-[200px] h-[44px] overflow-hidden select-none border border-gray-700">
            <button
                onClick={() => onTabChange('live')}
                className={`flex-1 flex items-center justify-center font-medium text-white text-sm cursor-pointer ${activeTab === 'live' ? 'bg-black' : 'bg-gray-700 hover:text-white'
                    }`}
            >
                Live
            </button>
            <button
                onClick={() => onTabChange('following')}
                className={`flex-1 flex items-center justify-center font-medium text-white text-sm cursor-pointer ${activeTab === 'following' ? 'bg-black' : 'bg-gray-700 hover:text-white'
                    }`}
            >
                Following
            </button>
        </div>
    );
};

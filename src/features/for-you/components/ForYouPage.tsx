import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { useStreamFeed } from '@/features/for-you/hooks/useStreamFeed';
import { TabSwitcher, TabType } from '@/features/for-you/components/TabSwitcher';
import { FollowingLoginPrompt } from '@/features/for-you/components/FollowingLoginPrompt';
import { FollowingEmpty } from '@/features/for-you/components/FollowingEmpty';
import { LiveStreamGrid } from '@/features/for-you/components/LiveStreamGrid';
import { GoLiveButton } from '@/features/for-you/components/GoLiveButton';


export const ForYouPage: React.FC = () => {
    const { isAuthenticated } = useAuthStore();
    const { openModal: openSignUpModal, setStep, setMode } = useSignUpStore();
    const [activeTab, setActiveTab] = useState<TabType>('live');

    const {
        streams,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        hasPaginated,
        loadMoreRef,
        fetchStreams,
    } = useStreamFeed();

    const handleLoginClick = () => {
        setMode('login');
        setStep('welcome');
        openSignUpModal();
    };



    return (
        <div className="w-full mt-8 overflow-x-hidden pb-12 sm:px-12 md:px-24">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
                <div className="hidden md:flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">Creators</h1>
                    <div className="flex items-center">
                        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
                    </div>
                </div>

                <div className="md:hidden mb-4">
                    <TabSwitcher
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        className="w-full"
                    />
                </div>

                {activeTab === 'following' && !isAuthenticated ? (
                    <div className="flex items-center justify-center min-h-[calc(100vh-360px)] w-full">
                        <FollowingLoginPrompt onLoginClick={handleLoginClick} />
                    </div>
                ) : activeTab === 'following' && isAuthenticated ? (
                    <div className="flex items-center justify-center min-h-[calc(100vh-360px)] w-full">
                        <FollowingEmpty />
                    </div>
                ) : (
                    <LiveStreamGrid
                        streams={streams}
                        isLoading={isLoading}
                        isLoadingMore={isLoadingMore}
                        error={error}
                        hasMore={hasMore}
                        hasPaginated={hasPaginated}
                        loadMoreRef={loadMoreRef}
                        onRetry={fetchStreams}
                    />
                )}
            </div>
            <GoLiveButton />
        </div>
    );
};

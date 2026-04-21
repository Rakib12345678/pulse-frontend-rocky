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
        <div className="w-full mt-8 overflow-x-hidden pb-12">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
                <div className="hidden md:flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold text-white">Creators</h1>
                    <div className="flex items-center gap-2">
                        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />
                        {activeTab === 'live' ? (
                            <Button
                                onClick={fetchStreams}
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10"
                                disabled={isLoading}
                            />
                        ) : (
                            // placeholder in following tab clicked case
                            <div className="w-10" />
                        )}
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
                    <FollowingLoginPrompt onLoginClick={handleLoginClick} />
                ) : activeTab === 'following' && isAuthenticated ? (
                    <FollowingEmpty />
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

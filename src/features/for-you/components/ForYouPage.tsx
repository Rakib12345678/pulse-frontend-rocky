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
        loadMoreRef,
        fetchStreams,
    } = useStreamFeed();

    const handleLoginClick = () => {
        setMode('login');
        setStep('welcome');
        openSignUpModal();
    };

    return (
        <div className="p-6 pb-24">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">Creators</h1>
                <div className="flex items-center gap-2">
                    <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

                    {/* Show refresh button with icon only when activeTab is 'live' */}
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
                    loadMoreRef={loadMoreRef}
                    onRetry={fetchStreams}
                />
            )}

            <GoLiveButton />
        </div>
    );
};

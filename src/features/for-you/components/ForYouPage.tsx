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

let isInitialPageLoad = true;
setTimeout(() => {
    isInitialPageLoad = false;
}, 1000);

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

    // Add cleanup for lingering media tracks when landing on the ForYou page
    React.useEffect(() => {
        const stopMediaTracks = async () => {
            // The browser automatically stops all tracks on a full page reload.
            // We only need to run this hack during client-side navigation.
            if (isInitialPageLoad) return;

            try {
                // First check if permissions are already granted to avoid unnecessary prompts
                const camPermission = await navigator.permissions.query({ name: 'camera' as PermissionName }).catch(() => null);
                const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName }).catch(() => null);

                const canAccessCamera = camPermission?.state === 'granted';
                const canAccessMic = micPermission?.state === 'granted';

                if (canAccessCamera || canAccessMic) {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: canAccessCamera,
                        audio: canAccessMic
                    });
                    stream.getTracks().forEach(track => track.stop());
                }
            } catch (err) {
                // Ignore errors
            }
        };

        stopMediaTracks();
    }, []);

    return (
        <div className="w-full mt-8 overflow-x-hidden pb-12 sm:px-12 md:px-24">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 lg:px-10">
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

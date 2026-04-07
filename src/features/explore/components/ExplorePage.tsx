import React from 'react';
import { ExploreSearch } from './ExploreSearch';
import { ExploreSection } from './ExploreSection';
import { CreatorCard } from './CreatorCard';
import { ExploreLiveCard } from './ExploreLiveCard';
import { ExploreEmptyState } from './ExploreEmptyState';
import { ExploreNoDataState } from './ExploreNoDataState';
import { GoLiveButton } from '@/features/for-you/components/GoLiveButton';
import { useExplore } from '../hooks/useExplore';
import { Loader2 } from 'lucide-react';
import { formatViewerCount } from '@/features/for-you/hooks/useStreamFeed';
import bunnyTeacher from '@/assets/bunnyTeacher.png';
import { useStreamInit } from '@/features/chat/stream/useStreamInit';

export const ExplorePage: React.FC = () => {
    // Initialize stream client so we can search users
    useStreamInit();

    const {
        exploreData,
        isLoading,
        error,
        searchQuery,
        setSearchQuery,
        categories,
        activeCategories,
        toggleCategory,
        handleSearch,
        isSearching,
        searchResults,
        handleExploreMore,
        refreshData
    } = useExplore();

    if (isLoading && !exploreData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 animate-spin text-[#FF8800]" />
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Failed to load explore data. Please try again.</div>;
    }

    const hasSearchResults = searchResults && (searchResults.creators.length > 0 || searchResults.streams.length > 0);
    const hasExploreData = exploreData && (
        exploreData.trendingStreams.length > 0 ||
        exploreData.newCreators.length > 0 ||
        exploreData.recommendedStreams.length > 0 ||
        exploreData.popularStreams.length > 0
    );

    const showSearchEmptyState = searchQuery.trim() !== '' && searchResults && !hasSearchResults && !isSearching;
    const showDataEmptyState = !isLoading && exploreData && !hasExploreData && (!searchResults || searchQuery.trim() === '');
    const hasActiveSearch = !!searchResults && searchQuery.trim() !== '';

    // Track visible sections to alternate backgrounds
    let sectionCounter = 0;

    return (
        <div className="w-full mt-8 overflow-x-hidden pb-12">
            {/* Search and Categories - Contained */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
                <ExploreSearch
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    categories={categories}
                    activeCategories={activeCategories}
                    toggleCategory={toggleCategory}
                    onSearch={handleSearch}
                    hideFilters={hasActiveSearch}
                />
            </div>

            {isSearching ? (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-300">
                    <Loader2 className="h-12 w-12 animate-spin text-[#FF8800] mb-4" />
                    <p className="text-gray-400 font-medium">Searching for creators...</p>
                </div>
            ) : showSearchEmptyState ? (
                <div className="max-w-[1240px] mx-auto px-4 lg:px-8 animate-in fade-in zoom-in duration-500">
                    <ExploreEmptyState onExploreMore={handleExploreMore} />
                </div>
            ) : showDataEmptyState ? (
                <div className="max-w-[1240px] mx-auto px-4 lg:px-8 animate-in fade-in zoom-in duration-500">
                    <ExploreNoDataState onRetry={refreshData} />
                </div>
            ) : (searchResults && searchQuery.trim() !== '') ? (
                /* Search Results View */
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {searchResults.creators.length > 0 && (
                        <ExploreSection
                            title="Found Users"
                            hasBackground={false}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {searchResults.creators.map((item) => (
                                    <CreatorCard 
                                        key={item.id} 
                                        creator={{
                                            id: item.id,
                                            username: item.username,
                                            displayName: item.fullName,
                                            profileImage: item.profileImage,
                                            followerCount: item.followerCount,
                                            isFollower: item.isFollower,
                                            followedByMe: item.followedByMe || item.isFollower || false,
                                            isLive: item.isLive,
                                            category: item.category,
                                            cohosts: item.cohosts
                                        }} 
                                    />
                                ))}
                            </div>
                        </ExploreSection>
                    )}
                </div>
            ) : (
                /* Default Explore View */
                <>
                    {/* Trending Section */}
                    {exploreData?.trendingStreams && exploreData.trendingStreams.length > 0 && (
                        <ExploreSection
                            title="Trending Creators Streams"
                            hasBackground={sectionCounter++ % 2 === 1}
                        >
                            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar items-stretch px-2">
                                {exploreData.trendingStreams.map((item) => (
                                    <div key={item.id} className="w-[175px] sm:w-[215px] md:w-[240px] xl:w-[266px] flex-shrink-0 flex">
                                        <ExploreLiveCard
                                            callId={item.id.toString()}
                                            thumbnailUrl={item.profileImage || bunnyTeacher}
                                            avatarUrl={item.profileImage || bunnyTeacher}
                                            streamerName={item.username || 'User'}
                                            viewerCount={formatViewerCount(item.participantCount)}
                                            followersCount={formatViewerCount(item.followerCount)}
                                            isLive={item.isLive}
                                            category={item.category}
                                            cohosts={item.cohosts.map(c => ({ ...c, status: 'active' }))}
                                        />
                                    </div>
                                ))}
                            </div>
                        </ExploreSection>
                    )}

                    {/* New Creators Section */}
                    {exploreData?.newCreators && exploreData.newCreators.length > 0 && (
                        <ExploreSection
                            title="New Creators"
                            hasBackground={sectionCounter++ % 2 === 1}
                        >
                            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar items-stretch px-2">
                                {exploreData.newCreators.map((item) => (
                                    <div key={item.id} className="w-[160px] sm:w-[180px] md:w-[200px] xl:w-[220px] flex-shrink-0 flex">
                                        <CreatorCard creator={{
                                            id: item.id,
                                            username: item.username,
                                            displayName: item.fullName,
                                            profileImage: item.profileImage,
                                            followerCount: item.followerCount,
                                            isFollower: item.isFollower,
                                            followedByMe: item.followedByMe || item.isFollower || false,
                                            isLive: item.isLive,
                                            category: item.category,
                                            cohosts: item.cohosts
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </ExploreSection>
                    )}

                    {/* Based on Interests */}
                    {exploreData?.recommendedStreams && exploreData.recommendedStreams.length > 0 && (
                        <ExploreSection
                            title="Based on your interests"
                            hasBackground={sectionCounter++ % 2 === 1}
                        >
                            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar items-stretch px-2">
                                {exploreData.recommendedStreams.map((item) => (
                                    <div key={item.id} className="w-[175px] sm:w-[215px] md:w-[240px] xl:w-[266px] flex-shrink-0 flex">
                                        <ExploreLiveCard
                                            callId={item.id.toString()}
                                            thumbnailUrl={item.profileImage || bunnyTeacher}
                                            avatarUrl={item.profileImage || bunnyTeacher}
                                            streamerName={item.username || 'User'}
                                            viewerCount={formatViewerCount(item.participantCount)}
                                            followersCount={formatViewerCount(item.followerCount)}
                                            isLive={item.isLive}
                                            category={item.category}
                                            cohosts={item.cohosts.map(c => ({ ...c, status: 'active' }))}
                                        />
                                    </div>
                                ))}
                            </div>
                        </ExploreSection>
                    )}

                    {/* Popular Weekly */}
                    {exploreData?.popularStreams && exploreData.popularStreams.length > 0 && (
                        <ExploreSection
                            title="Popular of this week"
                            hasBackground={sectionCounter++ % 2 === 1}
                        >
                            <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar items-stretch px-2">
                                {exploreData.popularStreams.map((item) => (
                                    <div key={item.id} className="w-[175px] sm:w-[215px] md:w-[240px] xl:w-[266px] flex-shrink-0 flex">
                                        <ExploreLiveCard
                                            callId={item.id.toString()}
                                            thumbnailUrl={item.profileImage || bunnyTeacher}
                                            avatarUrl={item.profileImage || bunnyTeacher}
                                            streamerName={item.username || 'User'}
                                            viewerCount={formatViewerCount(item.participantCount)}
                                            followersCount={formatViewerCount(item.followerCount)}
                                            isLive={item.isLive}
                                            category={item.category}
                                            cohosts={item.cohosts.map(c => ({ ...c, status: 'active' }))}
                                        />
                                    </div>
                                ))}
                            </div>
                        </ExploreSection>
                    )}
                </>
            )}

            {/* Floating Go Live Button */}
            {!showSearchEmptyState && !showDataEmptyState && <GoLiveButton />}
        </div>
    );
};

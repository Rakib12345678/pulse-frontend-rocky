import React from 'react';
import { ExploreSearch } from './ExploreSearch';
import { ExploreSection } from './ExploreSection';
import { CreatorCard } from './CreatorCard';
import { ExploreEmptyState } from './ExploreEmptyState';
import { LiveCard } from '@/features/live/components/LiveCard';
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
        activeCategory,
        setActiveCategory,
        handleSearch,
        searchResults,
        searchSuggestions,
        isSuggesting,
        handleExploreMore
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

    const showEmptyState = (searchQuery.trim() !== '' && searchResults && !hasSearchResults) || (!isLoading && exploreData && !hasExploreData);

    // Track visible sections to alternate backgrounds
    let sectionCounter = 0;

    return (
        <div className="w-full mt-8 overflow-x-hidden">
            {/* Search and Categories - Contained */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
                <ExploreSearch
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    onSearch={handleSearch}
                    suggestions={searchSuggestions}
                    isSuggesting={isSuggesting}
                />
            </div>

            {showEmptyState ? (
                <div className="max-w-[1240px] mx-auto px-4 lg:px-8">
                    <ExploreEmptyState onExploreMore={handleExploreMore} />
                </div>
            ) : searchResults ? (
                /* Search Results View */
                <>
                    {searchResults.streams.length > 0 && (
                        <ExploreSection
                            title="Found Streams"
                            hasBackground={sectionCounter++ % 2 === 1}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-5">
                                {searchResults.streams.map((stream) => (
                                    <LiveCard
                                        key={stream.callId}
                                        {...stream}
                                        thumbnailUrl={stream.profileImage || bunnyTeacher}
                                        avatarUrl={stream.profileImage || bunnyTeacher}
                                        streamerName={stream.username || 'User'}
                                        viewerCount={formatViewerCount(stream.participantCount)}
                                        followersCount={formatViewerCount(stream.followerCount)}
                                    />
                                ))}
                            </div>
                        </ExploreSection>
                    )}
                    {searchResults.creators.length > 0 && (
                        <ExploreSection
                            title="Found Creators"
                            hasBackground={sectionCounter++ % 2 === 1}
                        >
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-5">
                                {searchResults.creators.map((creator) => (
                                    <CreatorCard key={creator.id} creator={creator} />
                                ))}
                            </div>
                        </ExploreSection>
                    )}
                </>
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
                                {exploreData.trendingStreams.map((stream) => (
                                    <div key={stream.callId} className="min-w-[160px] sm:min-w-[180px] md:min-w-[200px] xl:min-w-[220px] flex">
                                        <LiveCard
                                            {...stream}
                                            thumbnailUrl={stream.profileImage || bunnyTeacher}
                                            avatarUrl={stream.profileImage || bunnyTeacher}
                                            streamerName={stream.username || 'User'}
                                            viewerCount={formatViewerCount(stream.participantCount)}
                                            followersCount={formatViewerCount(stream.followerCount)}
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
                                {exploreData.newCreators.map((creator) => (
                                    <div key={creator.id} className="min-w-[160px] sm:min-w-[180px] md:min-w-[200px] xl:min-w-[220px] flex">
                                        <CreatorCard creator={creator} />
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
                                {exploreData.recommendedStreams.map((stream) => (
                                    <div key={stream.callId} className="min-w-[160px] sm:min-w-[180px] md:min-w-[200px] xl:min-w-[220px] flex">
                                        <LiveCard
                                            {...stream}
                                            thumbnailUrl={stream.profileImage || bunnyTeacher}
                                            avatarUrl={stream.profileImage || bunnyTeacher}
                                            streamerName={stream.username || 'User'}
                                            viewerCount={formatViewerCount(stream.participantCount)}
                                            followersCount={formatViewerCount(stream.followerCount)}
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
                                {exploreData.popularStreams.map((stream) => (
                                    <div key={stream.callId} className="min-w-[160px] sm:min-w-[180px] md:min-w-[200px] xl:min-w-[220px] flex">
                                        <LiveCard
                                            {...stream}
                                            thumbnailUrl={stream.profileImage || bunnyTeacher}
                                            avatarUrl={stream.profileImage || bunnyTeacher}
                                            streamerName={stream.username || 'User'}
                                            viewerCount={formatViewerCount(stream.participantCount)}
                                            followersCount={formatViewerCount(stream.followerCount)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </ExploreSection>
                    )}
                </>
            )}

            {/* Floating Go Live Button */}
            {!showEmptyState && <GoLiveButton />}
        </div>
    );
};

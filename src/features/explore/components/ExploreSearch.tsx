import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Creator } from '../types/explore.types';
import { Avatar } from '@/features/chat/components/Avatar';
import { useNavigate } from '@tanstack/react-router';

interface ExploreSearchProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    activeCategory: string;
    setActiveCategory: (category: string) => void;
    onSearch: (queryOverride?: string) => void;
    suggestions?: Creator[];
    isSuggesting?: boolean;
}

const CATEGORIES = [
    'All Category', 'Lifestyle', 'Blogging', 'Coding', 'Dancing', 'Cooking', 'Speaking', 'Science & Tech', 'Gaming', 'Others'
];

export const ExploreSearch: React.FC<ExploreSearchProps> = ({
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    onSearch,
    suggestions = [],
    isSuggesting = false
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSuggestionClick = (creator: Creator) => {
        setSearchQuery(creator.displayName);
        setShowSuggestions(false);
        navigate({ to: `/profile/${creator.username}` as any });
    };

    return (
        <div className="w-full bg-[#1A1C1E] rounded-[32px] p-6 mb-8 border border-white/5 shadow-2xl">
            {/* Search Bar & Button */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                <div 
                    ref={containerRef}
                    className="flex-1 relative w-full"
                >
                    <div className="flex items-center bg-[#0F1113] rounded-full px-5 h-12 border border-white/5 focus-within:border-white/20 transition-all w-full">
                        <Search className="w-4 h-4 text-gray-500 mr-3" />
                        <input
                            type="text"
                            placeholder="Search Your Favorite Creator"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onSearch();
                                    setShowSuggestions(false);
                                }
                            }}
                            className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-gray-600"
                        />
                        {isSuggesting && <Loader2 className="w-4 h-4 text-gray-500 animate-spin ml-2" />}
                    </div>

                    {/* Autocomplete Dropdown */}
                    {showSuggestions && (suggestions.length > 0 || (!isSuggesting && searchQuery.trim())) && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1C1E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                            {suggestions.length > 0 ? (
                                <>
                                    <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5">
                                        Suggested Creators
                                    </div>
                                    <div className="max-h-64 overflow-y-auto no-scrollbar">
                                        {suggestions.map((creator) => (
                                            <button
                                                key={creator.id}
                                                onClick={() => handleSuggestionClick(creator)}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-none group"
                                            >
                                                <Avatar 
                                                    src={creator.profileImage || ''} 
                                                    alt={creator.displayName} 
                                                    className="w-10 h-10 border border-white/10 group-hover:border-[#FF8800]/50 transition-colors" 
                                                />
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-white text-sm font-semibold truncate group-hover:text-[#FF8800] transition-colors">
                                                        {creator.displayName}
                                                    </span>
                                                </div>
                                                <div className="ml-auto text-[10px] font-bold text-gray-600 group-hover:text-gray-400">
                                                    {creator.followerCount ? creator.followerCount.toLocaleString() : 0} followers
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                                    <span className="text-2xl mb-2">🔍</span>
                                    <p className="text-white font-semibold text-sm">No creators found</p>
                                    <p className="text-gray-500 text-xs mt-1">Try searching with a different name</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <Button
                    onClick={() => onSearch()}
                    className="w-full md:w-auto bg-[#FF8800] hover:bg-[#ff9922] text-black font-extrabold rounded-full px-8 h-12 text-sm transition-all cursor-pointer shadow-[0_0_15px_rgba(255,136,0,0.3)] hover:text-black flex items-center gap-2"
                >
                    <Search className="w-4 h-4" />
                    Search
                </Button>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
                {CATEGORIES.map((category) => (
                    <button
                        key={category}
                        onClick={() => setActiveCategory(category)}
                        className={cn(
                            "whitespace-nowrap px-6 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border",
                            activeCategory === category
                                ? "bg-white text-black border-white"
                                : "bg-[#25282B] text-gray-400 border-transparent hover:border-gray-600 hover:text-white"
                        )}
                    >
                        {category}
                    </button>
                ))}
            </div>
        </div>
    );
};

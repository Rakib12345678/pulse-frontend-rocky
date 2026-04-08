import React from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Category } from '../types/explore.types';

interface ExploreSearchProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    categories: Category[];
    activeCategories: string[];
    toggleCategory: (category: string) => void;
    onSearch: (queryOverride?: string) => void;
    hideFilters?: boolean;
}

export const ExploreSearch: React.FC<ExploreSearchProps> = ({
    searchQuery,
    setSearchQuery,
    categories,
    activeCategories,
    toggleCategory,
    onSearch,
    hideFilters = false
}) => {
    // Combine "All Category" with fetched categories only if we have categories to filter by
    const allCategories = categories.length > 0 ? ['All Category', ...categories.map(c => c.name)] : [];

    const clearSearch = () => {
        setSearchQuery('');
    };

    return (
        <div className="w-full bg-[#1A1C1E] rounded-2xl p-6 mb-8 border border-white/5 shadow-2xl">
            {/* Search Bar & Button */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
                <div 
                    className="flex-1 relative w-full"
                >
                    <div className="flex items-center bg-[#0F1113] rounded-full px-5 h-12 border border-white/5 focus-within:border-white/20 transition-all w-full shadow-inner">
                        <Search className="w-4 h-4 text-gray-500 mr-3" />
                        <input
                            type="text"
                            placeholder="Search Your Favorite Creator"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onSearch();
                                }
                            }}
                            className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-gray-600 font-medium"
                        />
                        {searchQuery.trim() !== '' && (
                            <button
                                onClick={clearSearch}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4 text-gray-500 hover:text-white" />
                            </button>
                        )}
                    </div>
                </div>
                <Button
                    onClick={() => onSearch()}
                    className="w-full md:w-auto bg-[#FF8800] hover:bg-[#ff9922] text-black font-black rounded-full px-10 h-12 text-sm transition-all cursor-pointer shadow-[0_0_20px_rgba(255,136,0,0.3)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border-none"
                >
                    <Search className="w-4 h-4" />
                    Search
                </Button>
            </div>

            {/* Categories */}
            {!hideFilters && allCategories.length > 0 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
                    {allCategories.map((category) => (
                        <button
                            key={category}
                            onClick={() => toggleCategory(category)}
                            className={cn(
                                "whitespace-nowrap px-6 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer border",
                                activeCategories.includes(category)
                                    ? "bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                                    : "bg-[#0F1113] text-gray-400 border-transparent hover:border-gray-600 hover:text-white"
                            )}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

import React from 'react';
import { Search, X } from 'lucide-react';
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
        <div className="w-full bg-[#1A1C1E] rounded-2xl p-6 mb-8 border border-white/5 shadow-2xl overflow-hidden">
            {/* Search Bar & Button */}
            <div className="flex flex-row items-center gap-3 mb-8">
                <div className="flex-1 relative min-w-0">
                    <div className="flex items-center bg-[#0F1113] rounded-full px-5 h-12 border border-white/5 focus-within:border-white/20 transition-all w-full shadow-inner">
                        <Search className="w-4 h-4 text-gray-500 mr-3 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search Your Favourite Creator"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    onSearch();
                                }
                            }}
                            className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-gray-600 font-medium min-w-0"
                        />
                        {searchQuery.trim() !== '' && (
                            <button
                                onClick={clearSearch}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors cursor-pointer shrink-0"
                            >
                                <X className="w-4 h-4 text-gray-500 hover:text-white" />
                            </button>
                        )}
                    </div>
                </div>
                {/* Circular search button — icon-only on mobile, text label on md+ */}
                <button
                    type="button"
                    onClick={() => onSearch()}
                    className="shrink-0 w-12 h-12 md:w-auto md:h-12 md:px-8 bg-[#FF8800] hover:bg-[#ff9922] text-black font-black rounded-full transition-all cursor-pointer shadow-[0_0_20px_rgba(255,136,0,0.3)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2 border-none"
                >
                    <Search className="w-4 h-4 shrink-0" />
                    <span className="hidden md:inline text-sm">Search</span>
                </button>
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

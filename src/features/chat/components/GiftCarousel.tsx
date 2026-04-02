import { useEffect, useState, useRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { chatService } from '../services/chat.service';
import type { GiftData } from '../types/chat.types';

interface GiftCarouselProps {
    onSelectGift: (gift: GiftData) => void;
}

export const GiftCarousel = ({ onSelectGift }: GiftCarouselProps) => {
    const [gifts, setGifts] = useState<GiftData[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatService.getGifts()
            .then(res => setGifts(res || []))
            .catch(() => console.error('Failed to fetch gifts'))
            .finally(() => setLoading(false));
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return;
        const amount = 200;
        scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    if (loading) return (
        <div className="h-24 flex items-center justify-center bg-[#111213]/50 border-t border-white/5">
            <Loader2 className="w-5 h-5 animate-spin text-[#FF7700]" />
        </div>
    );
    if (gifts.length === 0) return null;

    return (
        <div className="w-full shrink-0 px-2 sm:px-4 lg:px-8 py-2">
            <div className="relative group bg-[#111213]/95 backdrop-blur-xl border border-white/10 py-4 px-12 rounded-3xl shadow-2xl w-full overflow-hidden">
                {/* Glow Blobs */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF7700]/5 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#3E2AB5]/5 rounded-full blur-2xl pointer-events-none" />

                <button 
                    onClick={() => scroll('left')} 
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10"
                >
                    <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                
                <div ref={scrollRef} className="relative z-10 flex gap-8 overflow-x-auto scrollbar-hide snap-x no-scrollbar flex-1">
                    {gifts.map(gift => (
                        <button
                            key={gift.id}
                            onClick={() => onSelectGift(gift)}
                            className="flex flex-col items-center gap-2 shrink-0 snap-start group/item active:scale-95 transition-transform"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover/item:bg-white/10 flex items-center justify-center transition-colors overflow-hidden border border-white/5 group-hover/item:border-white/10">
                                <img src={gift.iconUrl} alt={gift.name} className="w-10 h-10 object-contain" />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                <span className="text-[12px] font-bold text-gray-300">{gift.noOfCoin}</span>
                            </div>
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => scroll('right')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors z-10"
                >
                    <ChevronRight className="w-4 h-4 text-white" />
                </button>
            </div>
        </div>
    );
};

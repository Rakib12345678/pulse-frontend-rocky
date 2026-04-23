import { useState, useEffect } from 'react';
import { useCoinsStore } from '../hooks/useCoinsStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { coinsService, type CoinEntity } from '../services/coins.service';
import coinIcon from '@/assets/coin.svg';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getPackageMeta = (coin: CoinEntity) => {
    // Prioritize backend fields
    if (coin.badge) {
        return {
            badge: {
                text: coin.badge,
                color: coin.badge.toLowerCase().includes('value') ? 'bg-[#FFD700]' : 'bg-[#00E676]'
            }
        };
    }

    // Fallback to hardcoded mapping for demo/completeness
    const coins = coin.noOfCoin;
    if (coins === 1250) return { badge: { text: 'Best Value', color: 'bg-[#FFD700]' } };
    if (coins === 2500) return { badge: { text: 'Popular', color: 'bg-[#00E676]' } };
    return { badge: null };
};

const PackageCard = ({ coin, currency, onBuy, isBuying }: { coin: CoinEntity, currency: string, onBuy: (coinId: number) => void, isBuying: boolean }) => {
    const pricePrefix = currency === 'INR' ? '₹' : '$';
    const displayPrice = currency === 'INR' ? coin.price.toLocaleString() : (coin.price / 83).toFixed(2);
    const { badge } = getPackageMeta(coin);

    return (
        <div className="relative pt-3">
            {badge && (
                <div className={`absolute top-0 right-1/2 translate-x-1/2 z-10 ${badge.color} text-black text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-sm`}>
                    {badge.text === 'Best Value' ? (
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                        </svg>
                    ) : (
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                            <path d="M12 9l4.5 9h-9l4.5 -9" />
                        </svg>
                    )}
                    {badge.text}
                </div>
            )}
            <div
                onClick={() => !isBuying && onBuy(coin.id)}
                className={`w-full h-full bg-[#1A1C1E] border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all cursor-pointer hover:border-white/20 active:scale-[0.98] ${isBuying ? 'opacity-60 pointer-events-none' : ''}`}
            >
                {/* Package Image */}
                <div className="w-full h-24 flex items-center justify-center relative mb-1">
                    {coin.bannerImage ? (
                        <img src={coin.bannerImage} alt={`${coin.noOfCoin} coins`} className="max-w-full max-h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" />
                    ) : (
                        <img src={coinIcon} alt="coin" className="w-12 h-12" />
                    )}
                </div>

                {/* Coin Amount */}
                <div className="flex items-center gap-2">
                    <img src={coinIcon} alt="coin" className="w-5 h-5" />
                    <span className="text-white font-bold text-lg">{coin.noOfCoin.toLocaleString()}</span>
                </div>

                {/* Price Button */}
                <div className="w-full bg-[#FF8800] rounded-xl py-2.5 text-center shadow-[0_4px_10px_rgba(255,136,0,0.2)]">
                    {isBuying ? (
                        <Loader2 className="w-5 h-5 animate-spin text-black mx-auto" />
                    ) : (
                        <span className="text-black font-black text-base">{pricePrefix} {displayPrice}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export const CoinPackageGrid = () => {
    const { selectPackage } = useCoinsStore();
    const { wallet } = useAuthStore();
    const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
    const [coins, setCoins] = useState<CoinEntity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCoins = async () => {
            try {
                const data = await coinsService.getCoins();
                setCoins([...data].sort((a, b) => a.noOfCoin - b.noOfCoin));
            } catch (error) {
                console.error('Failed to fetch coins:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCoins();
    }, []);

    const handleBuy = (coin: CoinEntity) => {
        selectPackage({
            id: String(coin.id),
            coins: coin.noOfCoin,
            price: coin.price,
            bonus: '',
            image: coin.bannerImage
        });
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-[800px] mx-auto">
            {/* Header */}
            <h2 className="text-white text-2xl font-bold">Add Coins</h2>

            {/* Balance Bar */}
            <div className="flex items-center justify-between bg-[#1A1C1E] border border-white/5 rounded-2xl px-4 py-3 shadow-md">
                <div className="flex items-center gap-3">
                    <span className="text-white/80 text-sm font-medium">My Coins</span>
                    <div className="flex items-center gap-1.5">
                        <img src={coinIcon} alt="coin" className="w-5 h-5" />
                        <span className="text-white font-bold text-base">{wallet?.coinBalance ?? 0}</span>
                    </div>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-9 px-3 bg-[#2D2D2D]/50 border border-white/5 rounded-2xl text-white text-[12px] font-bold flex items-center gap-2 hover:bg-[#3D3D3D] transition-all">
                            <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                            {currency === 'INR' ? '₹ INR' : '$ USD'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1A1C1E] border-white/10 text-white min-w-[120px] rounded-2xl p-1 shadow-2xl">
                        <DropdownMenuItem
                            onClick={() => setCurrency('INR')}
                            className="flex items-center gap-2 focus:bg-[#3D3D3D] focus:text-white cursor-pointer py-2 px-3 rounded-xl"
                        >
                            <span className="font-bold text-sm">₹ INR</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setCurrency('USD')}
                            className="flex items-center gap-2 focus:bg-[#3D3D3D] focus:text-white cursor-pointer py-2 px-3 rounded-xl"
                        >
                            <span className="font-bold text-sm">$ USD</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Packages Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FF8800]" />
                </div>
            ) : coins.length === 0 ? (
                <p className="text-gray-400 text-center py-10">No coin packages available</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pb-12">
                    {coins.map((coin) => (
                        <PackageCard
                            key={coin.id}
                            coin={coin}
                            currency={currency}
                            onBuy={() => handleBuy(coin)}
                            isBuying={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

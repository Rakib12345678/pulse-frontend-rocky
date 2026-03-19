import { useCoinsStore } from '../hooks/useCoinsStore';
import { coinsService, type CoinEntity } from '../services/coins.service';
import { useAuthStore } from '@/features/auth/stores/authStore';
import coinIcon from '@/assets/coin.svg';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from 'react';

const PackageCard = ({ coin, currency }: { coin: CoinEntity, currency: string }) => {
    const { selectPackage } = useCoinsStore();

    const pricePrefix = currency === 'INR' ? '₹' : '$';
    const displayPrice = currency === 'INR' ? coin.price.toLocaleString() : (coin.price / 83).toFixed(2);

    return (
        <div className="relative group">
            <Button
                variant="ghost"
                onClick={() => selectPackage({ id: String(coin.id), coins: coin.noOfCoin, price: coin.price, bonus: '', image: coin.bannerImage })}
                className="w-full h-auto bg-[#1A1C1E] border border-white/10 rounded-2xl p-4 pt-5 flex flex-col items-center gap-2 
          hover:border-[#FF8800]/50 hover:bg-[#1A1C1E]/80 transition-all cursor-pointer group-hover:shadow-[0_0_20px_rgba(255,136,0,0.1)]"
            >
                {/* Package Image */}
                <div className="w-24 h-20 flex items-center justify-center">
                    {coin.bannerImage ? (
                        <img src={coin.bannerImage} alt={`${coin.noOfCoin} coins`} className="max-w-full max-h-full object-contain" />
                    ) : (
                        <img src={coinIcon} alt="coin" className="w-12 h-12" />
                    )}
                </div>

                {/* Coin Amount */}
                <div className="flex items-center gap-1.5">
                    <img src={coinIcon} alt="coin" className="w-5 h-5" />
                    <span className="text-white font-bold text-lg">{coin.noOfCoin.toLocaleString()}</span>
                </div>

                {/* Price Button */}
                <div className="w-full bg-[#FF8800] rounded-lg py-2 px-4 text-center">
                    <span className="text-black font-bold text-sm">{pricePrefix} {displayPrice}</span>
                </div>
            </Button>
        </div>
    );
};

export const CoinPackageGrid = () => {
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

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <h2 className="text-white text-2xl font-bold italic">Add Coins</h2>

            {/* Balance Bar */}
            <div className="flex items-center justify-between bg-[#1A1C1E] border border-white/10 rounded-2xl px-5 py-4">
                <div className="flex items-center gap-2.5">
                    <span className="text-white text-base">My Coins</span>
                    <img src={coinIcon} alt="coin" className="w-5 h-5" />
                    <span className="text-white font-bold text-base">{wallet?.coinBalance ?? 0}</span>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 bg-[#2D2D2D] border border-white/10 rounded-full px-4 py-2 text-white text-sm cursor-pointer hover:bg-[#3D3D3D] hover:text-white transition-colors focus-visible:ring-0">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                            {currency === 'INR' ? '₹ INR' : '$ USD'}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#2D2D2D] border-white/10 text-white min-w-[120px] rounded-xl overflow-hidden p-1 shadow-2xl">
                        <DropdownMenuItem
                            onClick={() => setCurrency('INR')}
                            className="flex items-center gap-2 focus:bg-[#3D3D3D] focus:text-white cursor-pointer py-2 rounded-lg"
                        >
                            <span className="font-medium">₹ INR</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => setCurrency('USD')}
                            className="flex items-center gap-2 focus:bg-[#3D3D3D] focus:text-white cursor-pointer py-2 rounded-lg"
                        >
                            <span className="font-medium">$ USD</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Packages Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-[#FF8800]" />
                </div>
            ) : coins.length === 0 ? (
                <p className="text-gray-400 text-center py-5">No coin packages available</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-4 pb-8">
                    {coins.map((coin) => (
                        <PackageCard key={coin.id} coin={coin} currency={currency} />
                    ))}
                </div>
            )}
        </div>
    );
};

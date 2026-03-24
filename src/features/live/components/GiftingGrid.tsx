import React from 'react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { useCoinsStore } from '@/features/coins/hooks/useCoinsStore';
import { giftsService, GiftEntity } from '@/features/gifts/services/gifts.service';
import coinIcon from '@/assets/coin.svg';
import { useLiveStreamContext } from './LiveStreamLayout';
import { useChannelStateContext } from 'stream-chat-react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { toast } from 'sonner';
import { Plus, X, Loader2 } from 'lucide-react';

export const GiftingGrid: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const { user, wallet, updateWallet } = useAuthStore();
    const { openModal: openAuthModal, setMode } = useSignUpStore();
    const { openModal: openCoinsModal } = useCoinsStore();
    const { call } = useLiveStreamContext();
    const { channel } = useChannelStateContext();
    const { useCallCreatedBy } = useCallStateHooks();
    const createdBy = useCallCreatedBy();

    const [gifts, setGifts] = React.useState<GiftEntity[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchGifts = async () => {
            try {
                const data = await giftsService.getGifts();
                setGifts(data);
            } catch (error) {
                console.error('Failed to fetch gifts:', error);
                toast.error('Failed to load gifts');
            } finally {
                setIsLoading(false);
            }
        };
        fetchGifts();
    }, []);

    const handleSendGift = async (gift: GiftEntity) => {
        if (!user) {
            setMode('login');
            openAuthModal();
            return;
        }

        if ((wallet?.coinBalance ?? 0) < gift.noOfCoin) {
            toast.error('Insufficient balance');
            onClose?.();
            openCoinsModal();
            return;
        }

        if (!call) return;

        try {
            // 1. Call backend API to debit coins and credit diamonds
            const targetUserId = createdBy?.id;
            if (!targetUserId) {
                toast.error('Streamer information not found');
                return;
            }

            const response = await giftsService.sendGift({
                giftId: gift.id,
                callId: call.id,
                targetUserId: targetUserId
            });

            // 2. Update local wallet balance
            updateWallet({ coinBalance: response.viewerCoinBalance });

            // 3. Trigger floating reaction with image
            await call.sendReaction({
                type: 'live-reaction',
                custom: { iconUrl: gift.iconUrl }
            });

            // 4. Trigger chat event for guest compatibility
            if (channel) {
                await channel.sendEvent({
                    type: 'client-live-reaction',
                    iconUrl: gift.iconUrl
                } as any);
            }

            toast.success(`Sent ${gift.name}!`);
        } catch (error) {
            console.error('Failed to send gift:', error);
            toast.error('Failed to send gift');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0F1117] text-white">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400 text-sm">Gifts</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 bg-black/40 rounded-full px-3 py-1 border border-white/10">
                        <img src={coinIcon} alt="coins" className="w-4 h-4" />
                        <span className="text-sm font-bold">{wallet?.coinBalance ?? 0}</span>
                        <button
                            onClick={() => openCoinsModal()}
                            className="ml-1 p-0.5 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
                {isLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                        {gifts.map((gift) => (
                            <button
                                key={gift.id}
                                onClick={() => handleSendGift(gift)}
                                className="flex flex-col items-center gap-1 group transition-transform active:scale-95"
                            >
                                <div className="w-12 h-12 flex items-center justify-center group-hover:drop-shadow-[0_0_8px_rgba(255,136,0,0.5)] transition-all">
                                    <img src={gift.iconUrl} alt={gift.name} className="w-full h-full object-contain" />
                                </div>
                                <div className="flex items-center gap-1">
                                    <img src={coinIcon} alt="coins" className="w-3 h-3" />
                                    <span className="text-[10px] font-bold text-gray-300">{gift.noOfCoin}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

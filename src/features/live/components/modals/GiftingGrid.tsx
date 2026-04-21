import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { useCoinsStore } from '@/features/coins/hooks/useCoinsStore';
import { useWalletBalance } from '@/features/coins/hooks/useWallet';
import { giftsService, GiftEntity } from '@/features/gifts/services/gifts.service';
import coinIcon from '@/assets/coin.svg';
import { useLiveStreamContext } from '@/features/live/components/layout/LiveStreamLayout';
import { useChannelStateContext } from 'stream-chat-react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';

export const GiftingGrid: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const queryClient = useQueryClient();
    const { user, wallet, updateWallet } = useAuthStore();
    const { data: walletData } = useWalletBalance();
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

        const currentBalance = walletData?.coinBalance ?? wallet?.coinBalance ?? 0;
        if (currentBalance < gift.noOfCoin) {
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
                targetUserId: targetUserId,
                source: 'LIVE_STREAM'
            });

            // 2. Update local wallet balance
            updateWallet({ coinBalance: response.viewerCoinBalance });
            queryClient.invalidateQueries({ queryKey: ['walletBalance'] });

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

            // 5. Send a chat message so the gift shows in the chat stream
            if (channel) {
                try {
                    await channel.sendMessage({
                        text: `sent ${gift.name}`,
                        isGiftMessage: true,
                        giftIconUrl: gift.iconUrl,
                        giftName: gift.name,
                        duration: gift.duration,
                    } as any);
                } catch (chatErr) {
                    console.error('Failed to send gift chat message:', chatErr);
                }
            }

            toast.success(`Sent ${gift.name}!`);
        } catch (error) {
            console.error('Failed to send gift:', error);
            toast.error('Failed to send gift');
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#141519] text-white">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
                <button
                    onClick={() => openCoinsModal()}
                    className="flex items-center gap-2 rounded-[24px] border border-white/80 px-4 py-1.5 hover:bg-white/5 transition-colors"
                >
                    <img src={coinIcon} alt="coins" className="w-4 h-4" />
                    <span className="text-sm font-semibold">{(walletData?.coinBalance ?? wallet?.coinBalance ?? 0).toLocaleString()}</span>
                </button>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="w-6 h-6 bg-[#ff5a5a] hover:bg-[#ff3b3b] shadow-sm rounded-full flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-white" strokeWidth={3} />
                    </button>
                )}
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

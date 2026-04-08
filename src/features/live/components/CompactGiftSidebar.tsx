import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { useCoinsStore } from '@/features/coins/hooks/useCoinsStore';
import { useWalletBalance } from '@/features/coins/hooks/useWallet';
import { giftsService, GiftEntity } from '@/features/gifts/services/gifts.service';
import coinIcon from '@/assets/coin.svg';
import { useLiveStreamContext } from './LiveStreamLayout';
import { useChannelStateContext } from 'stream-chat-react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

export const CompactGiftSidebar: React.FC = () => {
    const queryClient = useQueryClient();
    const { user, wallet, updateWallet } = useAuthStore();
    const { data: walletData } = useWalletBalance();
    const { openModal: openAuthModal, setMode } = useSignUpStore();
    const { openModal: openCoinsModal } = useCoinsStore();
    const { call, isViewer, isGiftingOpen } = useLiveStreamContext();
    const { channel } = useChannelStateContext();
    const { useCallCreatedBy } = useCallStateHooks();
    const createdBy = useCallCreatedBy();
    const isMobile = useIsMobile();

    const [gifts, setGifts] = useState<GiftEntity[]>([]);

    useEffect(() => {
        if (!isViewer) return; // Only fetch for viewers
        const fetchGifts = async () => {
            try {
                const data = await giftsService.getGifts();
                setGifts(data);
            } catch (error) {
                console.error('Failed to fetch gifts:', error);
            }
        };
        fetchGifts();
    }, [isViewer]);

    const handleSendGift = async (gift: GiftEntity) => {
        if (!user) {
            setMode('login');
            openAuthModal();
            return;
        }

        const currentBalance = walletData?.coinBalance ?? wallet?.coinBalance ?? 0;
        if (currentBalance < gift.noOfCoin) {
            toast.error('Insufficient balance');
            openCoinsModal();
            return;
        }

        if (!call) return;

        try {
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

            updateWallet({ coinBalance: response.viewerCoinBalance });
            queryClient.invalidateQueries({ queryKey: ['walletBalance'] });

            await call.sendReaction({
                type: 'live-reaction',
                custom: { iconUrl: gift.iconUrl }
            });

            if (channel) {
                await channel.sendEvent({
                    type: 'client-live-reaction',
                    iconUrl: gift.iconUrl
                } as any);

                try {
                    await channel.sendMessage({
                        text: `sent ${gift.name} 🎁`,
                        isGiftMessage: true,
                        giftIconUrl: gift.iconUrl,
                        giftName: gift.name,
                        giftCost: gift.noOfCoin,
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

    // Hide if not viewer, no gifts, or if the full gifting grid/drawer is open
    if (!isViewer || gifts.length === 0 || isGiftingOpen) return null;

    return (
        <div
            className={`absolute z-30 flex flex-col items-center gap-5 overflow-y-auto scrollbar-hide mask-linear-fade
                ${isMobile ? 'right-2 bottom-32 top-32 w-14' : 'right-10 bottom-28 top-32 w-16'}
            `}
            style={{
                maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)'
            }}
        >
            <div className="flex flex-col gap-6 py-4 items-center">
                {gifts.map((gift) => (
                    <button
                        key={gift.id}
                        onClick={() => handleSendGift(gift)}
                        className="flex flex-col items-center gap-1 hover:scale-110 active:scale-95 transition-transform group"
                        title={gift.name}
                    >
                        <div className="relative">
                            <img
                                src={gift.iconUrl}
                                alt={gift.name}
                                className="w-10 h-10 object-contain drop-shadow-[0_0_6px_rgba(255,136,0,0.3)] group-hover:drop-shadow-[0_0_8px_rgba(255,136,0,0.6)] transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-white/10">
                            <img src={coinIcon} alt="coins" className="w-2.5 h-2.5" />
                            <span className="text-[10px] font-bold text-[#FFB800]">{gift.noOfCoin}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

import React, { useEffect, useState } from 'react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import { useJoinRequestStore } from '@/features/live/stores/joinRequestStore';
import { useNavigate } from '@tanstack/react-router';

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
    const navigate = useNavigate();

    // Join stream logic
    const { requestStatus, setRequestStatus } = useJoinRequestStore();
    const { openModal, setMode: setSignUpMode } = useSignUpStore();

    const [gifts, setGifts] = useState<GiftEntity[]>([]);

    useEffect(() => {
        if (!isViewer) return;
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

    const handleJoinRequest = async () => {
        if (!user) {
            setSignUpMode('login');
            openModal();
            return;
        }
        if (requestStatus !== 'idle' || !call) return;
        try {
            setRequestStatus('pending');
            await call.sendCustomEvent({
                type: 'join-request',
                userId: String(user.id),
                userName: user.username || user.fullName || String(user.id),
                userImage: user.profileImage,
            });
        } catch (err) {
            console.error('[JoinStream] Failed to send join request:', err);
            setRequestStatus('idle');
        }
    };

    // Listen for join-response & kick events on mobile bar too
    useEffect(() => {
        if (!call || !user) return;
        const unsubscribe = call.on('custom', (event: any) => {
            const customData = event?.custom;
            if (customData?.type === 'join-response' && customData?.userId === String(user.id)) {
                setRequestStatus(customData.accepted ? 'approved' : 'declined');
                if (customData.accepted) {
                    toast.success('Host accepted your join request!');
                } else {
                    toast.error('Host declined your join request');
                    setTimeout(() => setRequestStatus('idle'), 3000);
                }
            }
            if (customData?.type === 'kicked' && customData?.userId === String(user.id)) {
                toast.error('You have been removed from the stream');
                (async () => {
                    try {
                        await call.camera.disable();
                        await call.microphone.disable();
                    } catch { }
                    navigate({ to: '/for-you' });
                })();
                setRequestStatus('idle');
            }
        });
        return () => { unsubscribe(); };
    }, [call, user, setRequestStatus, navigate]);

    // Restore co-host status on refresh
    const { useParticipants } = useCallStateHooks();
    const viewerParticipants = useParticipants();
    useEffect(() => {
        if (!call || !user || requestStatus !== 'idle') return;
        const myParticipant = viewerParticipants.find((p: any) => p.userId === String(user.id));
        if (!myParticipant) return;
        const p = myParticipant as any;
        const isCohost = p.roles?.includes('co_host') || p.capabilities?.includes('send-audio') || p.capabilities?.includes('send-video');
        if (isCohost) setRequestStatus('approved');
    }, [call, user, viewerParticipants, requestStatus, setRequestStatus]);

    // Hide for non-viewers
    if (!isViewer) return null;

    /* ===== DESKTOP: vertical right sidebar (original behaviour) ===== */
    if (!isMobile) {
        if (gifts.length === 0 || isGiftingOpen) return null;
        return (
            <div
                className="absolute z-30 flex flex-col items-center gap-5 overflow-y-auto scrollbar-hide right-10 bottom-28 top-32 w-16"
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
    }

    /* ===== MOBILE: horizontal scrollable row + Join Stream ===== */
    const joinBtn = requestStatus === 'approved' ? (
        <span className="px-5 py-3 rounded-full text-sm font-bold text-green-400 bg-green-400/10 shrink-0">
            Joined
        </span>
    ) : (
        <button
            onClick={handleJoinRequest}
            disabled={requestStatus === 'pending'}
            className={`px-5 h-11 rounded-full text-sm font-bold transition-all shadow-md shrink-0 ${requestStatus === 'pending'
                ? 'bg-white/10 text-white/40 cursor-default'
                : 'bg-[#FF8800] text-black hover:bg-[#ff9922] active:scale-95'
                }`}
        >
            {requestStatus === 'pending' ? 'Requested' : 'Join Stream'}
        </button>
    );

    return (
        <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center gap-2 px-3 pb-4 pt-2">
            {/* Horizontally scrollable gift icons */}
            <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-4 pr-2">
                    {gifts.map((gift) => (
                        <button
                            key={gift.id}
                            onClick={() => handleSendGift(gift)}
                            className="flex flex-col items-center gap-1 shrink-0 hover:scale-110 active:scale-95 transition-transform"
                            title={gift.name}
                        >
                            <img
                                src={gift.iconUrl}
                                alt={gift.name}
                                className="w-10 h-10 object-contain drop-shadow-[0_0_6px_rgba(255,136,0,0.3)]"
                            />
                            <div className="flex items-center gap-0.5">
                                <img src={coinIcon} alt="coins" className="w-3 h-3" />
                                <span className="text-[10px] font-bold text-[#FFD700]">{gift.noOfCoin}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Join Stream button always visible on the right */}
            {joinBtn}
        </div>
    );
};

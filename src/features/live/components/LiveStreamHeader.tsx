import React from 'react';
import { Users, Eye, EyeOff, ArrowLeft, ChevronLeft, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoLiveStore } from '../stores/goLiveStore';
import { liveService } from '../services/live.service';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { useLiveStreamContext } from './LiveStreamLayout';
import { useIsMobile } from '@/hooks/use-mobile';

import { ParticipantsDialog } from './ParticipantsDialog';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerTitle,
    DrawerDescription
} from '@/components/ui/drawer';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const LiveStreamHeader: React.FC = () => {
    const { streamData, setEndingStream } = useGoLiveStore();
    const { isChatVisible, setChatVisible, call } = useLiveStreamContext();
    const navigate = useNavigate();
    const { useCallSession, useParticipantCount, useCallCreatedBy } = useCallStateHooks();
    const session = useCallSession();
    const participantCount = useParticipantCount();
    const createdBy = useCallCreatedBy();
    const isMobile = useIsMobile();

    // Timer state
    const [timeLeft, setTimeLeft] = React.useState<string>('');
    const [hasShownAlert, setHasShownAlert] = React.useState(false);
    const [isUrgent, setIsUrgent] = React.useState(false);

    // Auto-end stream ref
    const autoEndTriggered = React.useRef(false);

    React.useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sessionWithTimer = session as any;

        if (!sessionWithTimer?.timer_ends_at) {
            setTimeLeft('');
            return;
        }

        const checkTime = async () => {
            const endsAt = new Date(sessionWithTimer.timer_ends_at).getTime();
            const now = Date.now();
            const diff = endsAt - now;

            if (diff <= 750 && !autoEndTriggered.current && streamData) {
                autoEndTriggered.current = true;
                try {
                    await liveService.endLiveStream(streamData.callId);
                    if (call) {
                        await call.camera.disable();
                        await call.microphone.disable();
                        await call.endCall();
                    }
                    toast.success('Live stream ended automatically due to time limit');
                    setEndingStream(true);
                    navigate({ to: '/for-you' });
                } catch (error) {
                    console.error('Failed to auto-end live stream:', error);
                }
                return;
            }

            if (diff <= 0) {
                setTimeLeft('00:00');
                setIsUrgent(true);
                return;
            }

            if (diff <= 120000 && diff > 119000 && !hasShownAlert) {
                toast.warning('2 minutes remaining in session', {
                    duration: 5000,
                    className: "bg-yellow-500 text-black font-bold border-none"
                });
                setHasShownAlert(true);
            }

            if (diff <= 30000) {
                setIsUrgent(true);
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        checkTime();
        const interval = setInterval(checkTime, 1000);
        return () => clearInterval(interval);
    }, [session, hasShownAlert, streamData, navigate, setEndingStream]);

    const handleLeaveStream = async () => {
        try {
            if (call) {
                await call.camera.disable();
                await call.microphone.disable();
                await call.leave();
            }
            navigate({ to: '/for-you' });
        } catch (error) {
            console.error('Failed to leave stream:', error);
            navigate({ to: '/for-you' });
        }
    };

    const handleEndLive = async () => {
        if (!streamData) return;
        try {
            await liveService.endLiveStream(streamData.callId);
            if (call) {
                await call.camera.disable();
                await call.microphone.disable();
                await call.endCall();
            }
            setEndingStream(true);
            navigate({ to: '/for-you' });
        } catch (error) {
            console.error('Failed to end live stream:', error);
        }
    };

    const isHost = !!streamData;
    const hostName = createdBy?.name || createdBy?.id || 'Host';

    /* ========== MOBILE HEADER ========== */
    if (isMobile) {
        return (
            <>
                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-5 pb-3 bg-linear-to-b from-black/60 to-transparent">
                    <div className="flex items-center gap-2">
                        {isHost ? (
                            /* Host: red End Live with back icon */
                            <button
                                onClick={handleEndLive}
                                className="flex items-center gap-1 text-red-500 font-bold text-base"
                            >
                                <ChevronLeft className="w-6 h-6" />
                                <span>End Live</span>
                            </button>
                        ) : (
                            /* Viewer: back + host username */
                            <>
                                <button
                                    onClick={handleLeaveStream}
                                    className="text-white"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <span className="text-white font-bold text-base truncate max-w-[200px]">
                                    {hostName}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Center: timer */}
                    {isHost && timeLeft && (
                        <div className="absolute left-1/2 -translate-x-1/2">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold tracking-wider backdrop-blur-md border transition-colors ${isUrgent
                                ? "bg-red-500/20 border-red-500 text-red-100 shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse"
                                : "bg-white/10 border-white/10 text-white"
                                }`}>
                                <span>{timeLeft}</span>
                            </div>
                        </div>
                    )}

                    {/* Right side: "..." menu for viewer */}
                    <div className="flex items-center gap-2">
                        {!isHost && (
                            <Drawer>
                                <DrawerTrigger asChild>
                                    <button className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all cursor-pointer">
                                        <MoreHorizontal className="w-5 h-5 text-white" />
                                    </button>
                                </DrawerTrigger>
                                <DrawerContent className="bg-[#1C1C1E] border-none text-white outline-none">
                                    <DrawerTitle className="sr-only">Stream Options</DrawerTitle>
                                    <DrawerDescription className="sr-only">Report or show interest in the stream</DrawerDescription>
                                    <div className="flex flex-col px-4 py-6 max-w-sm mx-auto w-full">
                                        <button className="text-left px-4 py-4 text-xl font-medium hover:bg-white/10 rounded-t-xl transition-colors">
                                            Interested
                                        </button>
                                        <div className="h-px bg-white/10 w-full" />
                                        <button className="text-left px-4 py-4 text-xl font-medium hover:bg-white/10 rounded-b-xl transition-colors">
                                            Report Stream
                                        </button>
                                    </div>
                                </DrawerContent>
                            </Drawer>
                        )}
                    </div>
                </div>

                {/* Left side buttons (below header): eye + participants */}
                <div className="absolute top-24 left-4 z-20 flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => setChatVisible(!isChatVisible)}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                        title={isChatVisible ? "Hide Chat" : "Show Chat"}
                    >
                        {isChatVisible ? <Eye className="w-4 h-4 text-white/70" /> : <EyeOff className="w-4 h-4 text-white/70" />}
                    </button>

                    {isHost && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer">
                                    <Users className="w-4 h-4 text-white/70" />
                                </button>
                            </DialogTrigger>
                            <ParticipantsDialog />
                        </Dialog>
                    )}
                </div>
            </>
        );
    }

    /* ========== DESKTOP HEADER ========== */
    return (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 bg-linear-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-4">
                {isHost ? (
                    <Button
                        onClick={handleEndLive}
                        className="bg-[#FF8800] hover:bg-[#FF8800]/90 text-black font-bold px-6 py-2 rounded-full h-11 transition-all hover:scale-105 active:scale-95"
                    >
                        End Live
                    </Button>
                ) : (
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={handleLeaveStream}
                            className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all"
                            title="Leave Stream"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <div className="flex items-center gap-2 bg-[#FFD580] px-4 py-1.5 rounded-full text-black">
                            <Users className="w-4 h-4 text-black" />
                            <span className="text-sm font-bold">{participantCount >= 1000 ? `${(participantCount / 1000).toFixed(1)}k` : participantCount}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 pr-16">
                <div className="flex items-center gap-2 bg-[#FF0000] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Live
                </div>

                {isHost && timeLeft && (
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider backdrop-blur-md border transition-colors ${isUrgent
                        ? "bg-red-500/20 border-red-500 text-red-100 shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse"
                        : "bg-white/10 border-white/10 text-white"
                        }`}>
                        <span>{timeLeft}</span>
                    </div>
                )}

                {isHost && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 cursor-pointer hover:bg-white/20 transition-all">
                                <Users className="w-4 h-4 text-white/70" />
                                <span className="text-sm font-bold">{participantCount}</span>
                            </div>
                        </DialogTrigger>
                        <ParticipantsDialog />
                    </Dialog>
                )}
            </div>

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setChatVisible(!isChatVisible)}
                    className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all"
                    title={isChatVisible ? "Hide Chat" : "Show Chat"}
                >
                    {isChatVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>

                {!isHost && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all flex items-center justify-center"
                            >
                                <MoreHorizontal className="w-5 h-5 text-white/70" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end" className="bg-[#1C1C1E] border-none shadow-lg text-white min-w-[200px] p-2 rounded-xl">
                            <DropdownMenuItem className="cursor-pointer px-4 py-3 text-[16px] font-medium hover:bg-white/10 focus:bg-white/10 focus:text-white rounded-lg transition-colors">
                                Interested
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/10 my-1" />
                            <DropdownMenuItem className="cursor-pointer px-4 py-3 text-[16px] font-medium hover:bg-white/10 focus:bg-white/10 focus:text-white rounded-lg transition-colors">
                                Report Stream
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
};

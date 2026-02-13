import React from 'react';
import { Users, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoLiveStore } from '../stores/goLiveStore';
import { liveService } from '../services/live.service';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { useLiveStreamContext } from './LiveStreamLayout';

import { ParticipantsDialog } from './ParticipantsDialog';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';

export const LiveStreamHeader: React.FC = () => {
    const { streamData, setEndingStream } = useGoLiveStore();
    const { isChatVisible, setChatVisible, call } = useLiveStreamContext();
    const navigate = useNavigate();
    const { useCallSession, useParticipantCount } = useCallStateHooks();
    const session = useCallSession();
    const participantCount = useParticipantCount();

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

            if (diff <= 500 && !autoEndTriggered.current && streamData) {
                autoEndTriggered.current = true;
                try {
                    await liveService.endLiveStream(streamData.callId);
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

            // check for 2 minute warning (120000 ms)
            if (diff <= 120000 && diff > 119000 && !hasShownAlert) {
                toast.warning('2 minutes remaining in session', {
                    duration: 5000,
                    className: "bg-yellow-500 text-black font-bold border-none"
                });
                setHasShownAlert(true);
            }

            if (diff <= 30000) { // 30 seconds
                setIsUrgent(true);
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        checkTime(); // Initial check
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
            toast.success('Live stream ended');
            setEndingStream(true);
            navigate({ to: '/for-you' });
        } catch (error) {
            console.error('Failed to end live stream:', error);
            toast.error('Failed to end live stream');
        }
    };

    return (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 bg-linear-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-4">
                {streamData ? (
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

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#FF0000] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Live
                </div>

                {timeLeft && (
                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider backdrop-blur-md border transition-colors ${isUrgent
                        ? "bg-red-500/20 border-red-500 text-red-100 shadow-[0_0_10px_rgba(220,38,38,0.5)] animate-pulse"
                        : "bg-white/10 border-white/10 text-white"
                        }`}>
                        <span>{timeLeft}</span>
                    </div>
                )}

                {streamData && (
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
            </div>
        </div>
    );
};

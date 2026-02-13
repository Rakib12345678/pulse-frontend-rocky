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
    const { useParticipantCount } = useCallStateHooks();
    const participantCount = useParticipantCount();

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
            navigate({ to: '/' });
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

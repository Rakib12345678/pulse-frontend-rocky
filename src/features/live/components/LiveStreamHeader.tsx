import React from 'react';
import { Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoLiveStore } from '../stores/goLiveStore';
import { liveService } from '../services/live.service';
import { toast } from 'sonner';
import { useNavigate } from '@tanstack/react-router';
import { useCallStateHooks } from '@stream-io/video-react-sdk';

import { ParticipantsDialog } from './ParticipantsDialog';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';

export const LiveStreamHeader: React.FC = () => {
    const { streamData, reset, setEndingStream } = useGoLiveStore();
    const navigate = useNavigate();
    const { useParticipantCount } = useCallStateHooks();
    const participantCount = useParticipantCount();

    const handleEndLive = async () => {
        if (!streamData) return;

        try {
            await liveService.endLiveStream(streamData.callId);
            toast.success('Live stream ended');
            setEndingStream(true);
            reset();
            navigate({ to: '/' });
        } catch (error) {
            console.error('Failed to end live stream:', error);
            toast.error('Failed to end live stream');
            //how to handle this error need to discuss with team 
        }
    };

    return (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 bg-linear-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-4">
                <Button
                    onClick={handleEndLive}
                    className="bg-[#FF8800] hover:bg-[#FF8800]/90 text-black font-bold px-6 py-2 rounded-full h-11 transition-all hover:scale-105 active:scale-95"
                >
                    End Live
                </Button>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#FF0000] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Live
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 cursor-pointer hover:bg-white/20 transition-all">
                            <Users className="w-4 h-4 text-white/70" />
                            <span className="text-sm font-bold">{participantCount}</span>
                        </div>
                    </DialogTrigger>
                    <ParticipantsDialog />
                </Dialog>
            </div>

            <div className="flex items-center gap-3">
                <button className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all">
                    <Eye className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

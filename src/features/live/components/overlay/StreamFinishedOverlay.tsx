import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Home, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface StreamFinishedOverlayProps {
    streamerName: string;
    streamerImage?: string;
    participantCount?: number;
    className?: string;
}

export const StreamFinishedOverlay: React.FC<StreamFinishedOverlayProps> = ({
    streamerName,
    streamerImage,
    participantCount = 0,
    className
}) => {
    const navigate = useNavigate();

    return (
        <div className={cn(
            "absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/90 animate-in fade-in duration-500",
            className
        )}>
            {/* Background decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#FF8800]/20 rounded-full blur-[100px] pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center max-w-sm w-full bg-[#1C1C1E]/80 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-[#FF8800] rounded-full blur-xl opacity-20 animate-pulse" />
                    <Avatar className="h-24 w-24 border-4 border-[#FF8800]/20 relative z-10 shadow-xl">
                        <AvatarImage src={streamerImage} className="object-cover" />
                        <AvatarFallback className="bg-neutral-800 text-[#FF8800] text-3xl font-bold">
                            {streamerName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-[#FF8800] text-black text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border-2 border-[#1C1C1E]">
                        Finished
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Stream Ended</h2>
                <p className="text-white/60 text-center mb-8 leading-relaxed">
                    The session with <span className="text-white font-semibold">{streamerName}</span> has concluded. We hope you enjoyed the show!
                </p>

                {participantCount > 0 && (
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/5 mb-8">
                        <Users className="w-4 h-4 text-[#FF8800]" />
                        <span className="text-sm font-medium text-white/80">{participantCount} others watched</span>
                    </div>
                )}

                <div className="grid grid-cols-1 w-full gap-3">
                    <Button
                        onClick={() => navigate({ to: '/for-you' })}
                        className="w-full h-14 rounded-2xl bg-[#FF8800] text-black font-bold text-lg hover:bg-[#ff9d2e] active:scale-[0.98] transition-all shadow-lg shadow-[#FF8800]/10 flex items-center justify-center gap-2"
                    >
                        <Home className="w-5 h-5" />
                        Back to Explore
                    </Button>
                    
                    <Button
                        variant="ghost"
                        onClick={() => navigate({ to: '/for-you' })}
                        className="w-full h-12 rounded-2xl text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors"
                    >
                        Close
                    </Button>
                </div>
            </div>
            
            {/* Brand subtle indicator */}
            <div className="absolute bottom-10 flex items-center gap-2 opacity-20">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-white">PulseLive</span>
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
        </div>
    );
};

import React from 'react';
import { ChevronLeft, MoreHorizontal, Eye, EyeOff, Users } from 'lucide-react';
import { useRecordingContext } from './RecordingLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from '@tanstack/react-router';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const RecordedStreamHeader: React.FC = () => {
    const { isChatVisible, setChatVisible, recordingMetadata, currentTime } = useRecordingContext();
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const hostName = recordingMetadata?.username || 'Host';
    const participantCount = recordingMetadata?.participantCount || 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleLeaveStream = () => {
        navigate({ to: '/profile' });
    };

    if (isMobile) {
        return (
            <>
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-5 pb-3 bg-linear-to-b from-black/60 to-transparent">
                    <div className="flex items-center gap-2">
                        <button onClick={handleLeaveStream} className="text-[#FF8800] font-bold text-base flex items-center gap-1">
                            <ChevronLeft className="w-6 h-6" />
                            <span>Back</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-[#FF0000] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(255,0,0,0.3)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Recorded
                        </div>
                        
                        <Drawer>
                            <DrawerTrigger asChild>
                                <button className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/20 transition-all cursor-pointer">
                                    <MoreHorizontal className="w-5 h-5 text-white" />
                                </button>
                            </DrawerTrigger>
                            <DrawerContent className="bg-[#1C1C1E] border-none text-white outline-none">
                                <DrawerTitle className="sr-only">Recording Options</DrawerTitle>
                                <DrawerDescription className="sr-only">Recording options</DrawerDescription>
                                <div className="flex flex-col px-4 py-6 max-w-sm mx-auto w-full">
                                    <button className="text-left px-4 py-4 text-xl font-medium hover:bg-white/10 rounded-t-xl transition-colors">
                                        Report Recording
                                    </button>
                                </div>
                            </DrawerContent>
                        </Drawer>
                    </div>
                </div>

                <div className="absolute top-24 left-4 z-20 flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => setChatVisible(!isChatVisible)}
                        className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                    >
                        {isChatVisible ? <Eye className="w-4 h-4 text-white/70" /> : <EyeOff className="w-4 h-4 text-white/70" />}
                    </button>
                </div>
            </>
        );
    }

    return (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between pt-8 pb-6 px-10 bg-linear-to-b from-black/60 to-transparent">
            {/* Left: Back button (matching "End Live" style) */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleLeaveStream}
                    className="bg-[#FF8800] hover:bg-[#FF8800]/90 text-black font-bold px-6 py-2 rounded-full h-11 transition-all hover:scale-105 active:scale-95"
                >
                    Back
                </button>
            </div>

            {/* Center: Pills (matches live layout) */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#FF0000] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Recorded
                </div>

                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider backdrop-blur-md border border-white/10 bg-white/10 text-white">
                    <span>{formatTime(currentTime)}</span>
                </div>

                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
                    <Users className="w-4 h-4 text-white/70" />
                    <span className="text-sm font-bold">{participantCount}</span>
                </div>
            </div>

            {/* Right: Visibility & Menu */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => setChatVisible(!isChatVisible)}
                    className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all"
                >
                    {isChatVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all flex items-center justify-center">
                            <MoreHorizontal className="w-5 h-5 text-white/70" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end" className="bg-[#1C1C1E] border-none shadow-lg text-white min-w-[200px] p-2 rounded-xl">
                        <DropdownMenuItem className="cursor-pointer px-4 py-3 text-[16px] font-medium hover:bg-white/10 focus:bg-white/10 focus:text-white rounded-lg transition-colors">
                            Report Recording
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

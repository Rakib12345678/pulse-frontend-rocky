import React from 'react';
import { ChevronLeft, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
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
    const { isChatVisible, setChatVisible, recordingMetadata } = useRecordingContext();
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const hostName = recordingMetadata?.username || 'Host';

    const handleLeaveStream = () => {
        navigate({ to: '/profile' });
    };

    if (isMobile) {
        return (
            <>
                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-5 pb-3 bg-linear-to-b from-black/60 to-transparent">
                    <div className="flex items-center gap-2">
                        <button onClick={handleLeaveStream} className="text-white">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <span className="text-white font-bold text-base truncate max-w-[200px]">
                            {hostName}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10 text-white/90">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
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
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 bg-linear-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-4">
                <button
                    onClick={handleLeaveStream}
                    className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all"
                >
                    <ChevronLeft className="w-6 h-6 text-white" />
                </button>
            </div>

            <div className="flex items-center gap-3 pr-16">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-white/10 text-white/90 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-white/40" />
                    Recorded
                </div>
            </div>

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

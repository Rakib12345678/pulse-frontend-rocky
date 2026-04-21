import React, { useState } from 'react';
import { ChevronLeft, Users } from 'lucide-react';
import { useRecordingContext } from './RecordingLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerTitle,
    DrawerDescription
} from '@/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, User } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

export const RecordedStreamHeader: React.FC = () => {
    const { recordingMetadata, currentTime, duration } = useRecordingContext();
    const remainingTime = Math.max(0, duration - currentTime);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
    const isMobile = useIsMobile();
    const navigate = useNavigate();

    const hostName = recordingMetadata?.username || null;
    const cohostsCount = recordingMetadata?.cohosts?.length || 0;
    const totalStreamers = (hostName ? 1 : 0) + cohostsCount;
    
    // Display total streamers (Host + Cohosts) instead of viewer count
    const displayParticipantCount = totalStreamers;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleLeaveStream = () => {
        window.history.back();
    };

    const displayTime = isNaN(remainingTime) || !isFinite(remainingTime) ? 0 : remainingTime;

    if (isMobile) {
        return (
            <>
                <div className="fixed top-[72px] left-0 right-0 z-[999] flex items-center justify-between px-4 pt-5 pb-3 bg-transparent border-none shadow-none outline-none">
                    <div className="flex items-center gap-2">
                        <button onClick={handleLeaveStream} className="text-[#FF8800] font-bold text-base flex items-center gap-1 cursor-pointer">
                            <ChevronLeft className="w-6 h-6" />
                            <span>Back</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-[#FF0000] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(255,0,0,0.3)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Recorded
                        </div>

                        <button
                            onClick={() => setIsParticipantsOpen(true)}
                            className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10"
                        >
                            <User className="w-3.5 h-3.5 text-white/70" />
                            <span className="text-[10px] font-bold text-white">{displayParticipantCount}</span>
                        </button>
                        
                    </div>

                    <ParticipantsView 
                        isOpen={isParticipantsOpen} 
                        onClose={setIsParticipantsOpen} 
                        recordingMetadata={recordingMetadata} 
                        onNavigate={(username) => navigate({ to: `/profile/${username}` })}
                        isMobile={isMobile}
                    />
                </div>

                <div className="fixed top-[135px] left-4 z-20 flex flex-col gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border border-white/10 bg-white/5 text-white w-fit">
                        <span>{formatTime(displayTime)}</span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <div className="fixed top-[72px] left-0 right-0 z-[999] flex items-center justify-between pt-6 pb-6 px-10 bg-transparent border-none shadow-none outline-none">
            {/* Left: Back button (matching "End Live" style) */}
            <div className="flex items-center gap-4">
                <button
                    onClick={handleLeaveStream}
                    className="flex items-center gap-1 bg-[#FF8800] hover:bg-[#FF8800]/90 text-black font-bold px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="pr-1">Back</span>
                </button>
            </div>

            {/* Center: Pills (matches live layout) */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#FF0000] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Recorded
                </div>

                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold tracking-wider border border-white/10 bg-white/5 text-white">
                    <span>{formatTime(displayTime)}</span>
                </div>

                <button
                    onClick={() => setIsParticipantsOpen(true)}
                    className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 hover:bg-white/20 transition-all cursor-pointer"
                >
                    <User className="w-4 h-4 text-white/70" />
                    <span className="text-sm font-bold text-white">{displayParticipantCount}</span>
                </button>
            </div>

            <ParticipantsView 
                isOpen={isParticipantsOpen} 
                onClose={setIsParticipantsOpen} 
                recordingMetadata={recordingMetadata} 
                onNavigate={(username) => navigate({ to: `/profile/${username}` })}
                isMobile={isMobile}
            />

            {/* Right: Visibility & Menu */}
            <div className="flex items-center gap-3 w-[100px] justify-end" />
        </div>
    );
};

const ParticipantsList: React.FC<{
    recordingMetadata: any;
    onNavigate: (username: string) => void;
    onClose: () => void;
}> = ({ recordingMetadata, onNavigate, onClose }) => {
    const { user } = useAuthStore();
    const currentUsername = user?.username;
    const host = recordingMetadata?.username;
    const cohosts = recordingMetadata?.cohosts || [];

    if (!host && cohosts.length === 0) {
        return (
            <div className="py-14 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-white/20" />
                </div>
                <p className="text-white font-medium">No participant information available</p>
                <p className="text-white/60 text-sm mt-1 px-10">Historical data for this recording might be limited.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 custom-scrollbar">
            {/* Host */}
            {host && (
                <button
                    onClick={() => {
                        if (host === currentUsername) return;
                        onClose();
                        onNavigate(host);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                        host === currentUsername ? 'cursor-default' : 'hover:bg-white/5 cursor-pointer'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Avatar className={`w-12 h-12 border-2 ${host === currentUsername ? 'border-[#FF8800]' : 'border-[#FF8800]/20'}`}>
                            <AvatarFallback className="bg-neutral-800 text-white">
                                {host[0]?.toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                            <p className={`font-bold text-white leading-tight ${host !== currentUsername && 'group-hover:text-[#FF8800]'} transition-colors`}>
                                @{host} {host === currentUsername && '(You)'}
                            </p>
                            <p className="text-xs text-[#FF8800] mt-0.5 font-medium uppercase tracking-wider">Host</p>
                        </div>
                    </div>
                </button>
            )}

            {/* Co-hosts */}
            {cohosts.map((cohost: any, index: number) => (
                <button
                    key={index}
                    onClick={() => {
                        if (cohost.username === currentUsername) return;
                        onClose();
                        onNavigate(cohost.username);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                        cohost.username === currentUsername ? 'cursor-default' : 'hover:bg-white/5 cursor-pointer'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        <Avatar className={`w-12 h-12 border-2 ${cohost.username === currentUsername ? 'border-[#FF8800]/60' : 'border-white/10'}`}>
                            {cohost.profileImage ? (
                                <AvatarImage src={cohost.profileImage} className="object-cover" />
                            ) : null}
                            <AvatarFallback className="bg-neutral-800 text-white">
                                {cohost.username?.[0]?.toUpperCase() || 'P'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="text-left">
                            <p className={`font-bold text-white leading-tight ${cohost.username !== currentUsername && 'group-hover:text-[#FF8800]'} transition-colors`}>
                                @{cohost.username} {cohost.username === currentUsername && '(You)'}
                            </p>
                            <p className="text-xs text-white/40 mt-0.5 font-medium uppercase tracking-wider">Co-host</p>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};

const ParticipantsView: React.FC<{
    isOpen: boolean;
    onClose: (open: boolean) => void;
    recordingMetadata: any;
    onNavigate: (username: string) => void;
    isMobile: boolean;
}> = ({ isOpen, onClose, recordingMetadata, onNavigate, isMobile }) => {
    
    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={onClose}>
                <DrawerContent className="bg-[#1C1C1E] border-none text-white outline-none max-h-[70vh] rounded-t-[32px]">
                    <div className="max-w-md mx-auto w-full flex flex-col h-full">
                        <div className="mx-auto w-12 h-1.5 bg-white/10 rounded-full mt-3 mb-2" />
                        <div className="flex items-center justify-between px-6 pt-2 pb-2">
                            <DrawerTitle className="text-xl font-bold text-white">Participants</DrawerTitle>
                            <button onClick={() => onClose(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                                <X className="w-5 h-5 text-white/70" />
                            </button>
                        </div>
                        <DrawerDescription className="sr-only">List of participants in this recording</DrawerDescription>
                        <ParticipantsList 
                            recordingMetadata={recordingMetadata} 
                            onNavigate={onNavigate} 
                            onClose={() => onClose(false)} 
                        />
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="bg-[#1C1C1E] border-white/10 text-white p-0 overflow-hidden sm:max-w-md rounded-[24px]">
                <div className="flex flex-col max-h-[80vh]">
                    <div className="flex items-center justify-between px-6 pt-6 pb-2">
                        <DialogTitle className="text-xl font-bold text-white">Participants</DialogTitle>
                        <button onClick={() => onClose(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                            <X className="w-5 h-5 text-white/70" />
                        </button>
                    </div>
                    <DialogDescription className="sr-only">List of participants in this recording</DialogDescription>
                    <ParticipantsList 
                        recordingMetadata={recordingMetadata} 
                        onNavigate={onNavigate} 
                        onClose={() => onClose(false)} 
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

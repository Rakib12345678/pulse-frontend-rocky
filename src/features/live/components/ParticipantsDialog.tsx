import React from 'react';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/stores/authStore';

export const ParticipantsDialog: React.FC = () => {
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const { user } = useAuthStore();

    return (
        <DialogContent className="sm:max-w-[425px] bg-[#0f1117] border-white/5 text-white">
            <DialogHeader>
                <DialogTitle className="text-xl font-bold">Participants ({participants.length})</DialogTitle>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-4">
                    {participants.map((participant) => {
                        const isMe = participant.isLocalParticipant;
                        const displayName = (isMe && user) ? user.username : participant.name;
                        const displayImage = (isMe && user) ? user.profileImage : participant.image;

                        return (
                            <div
                                key={participant.sessionId}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-[#FF8800]/20">
                                        <AvatarImage src={displayImage} alt={displayName} />
                                        <AvatarFallback className="bg-[#FF8800]/10 text-[#FF8800] font-bold">
                                            {(displayName || 'U').charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-sm">
                                            {displayName || 'Anonymous User'}
                                            {isMe && (
                                                <span className="ml-2 text-[10px] bg-[#FF8800] text-black px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                    Me
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {isMe ? 'Host / You' : 'Viewer'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        participant.isLocalParticipant ? "bg-green-500" : "bg-blue-500"
                                    )} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DialogContent>
    );
};

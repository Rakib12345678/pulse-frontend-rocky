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
import { useUserProfileStore } from '../stores/userProfileStore';

// Helper to extract fullName from participant custom fields
const getFullName = (p: any): string =>
    p?.custom?.fields?.fullName?.kind?.stringValue || p?.name || '';

export const ParticipantsDialog: React.FC = () => {
    const { useParticipants } = useCallStateHooks();
    const participants = useParticipants();
    const { user } = useAuthStore();
    const { openModal } = useUserProfileStore();

    return (
        <DialogContent className="sm:max-w-[425px] bg-[#0f1117] border-white/5 text-white">
            <DialogHeader>
                <DialogTitle className="text-xl font-bold">Participants ({participants.length})</DialogTitle>
            </DialogHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-4">
                    {participants.map((participant: any) => {
                        const isMe = participant.isLocalParticipant;
                        const isCreator = participant.roles?.includes('host') || participant.roles?.includes('admin');
                        const isCoHost = !isCreator && (
                            participant.roles?.includes('co_host') ||
                            participant.capabilities?.includes('send-audio') ||
                            participant.capabilities?.includes('send-video')
                        );

                        const displayName = (isMe && user) ? (user.fullName || user.username) : getFullName(participant);
                        const displayImage = (isMe && user) ? user.profileImage : participant.image;
                        const modalUsername = (isMe && user) ? user.username : participant.name;

                        let roleLabel = 'Viewer';
                        if (isCreator) roleLabel = isMe ? 'Host / You' : 'Host';
                        else if (isCoHost) roleLabel = isMe ? 'Co-Host / You' : 'Co-Host';
                        else if (isMe) roleLabel = 'You';

                        return (
                            <div
                                key={participant.sessionId}
                                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                                onClick={() => {
                                    if (modalUsername) openModal(modalUsername);
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className={cn("h-10 w-10 border", isCreator ? "border-[#FF8800]" : (isCoHost ? "border-purple-500" : "border-white/10"))}>
                                        <AvatarImage src={displayImage} alt={displayName} />
                                        <AvatarFallback className={cn("font-bold text-white", isCreator ? "bg-[#FF8800]/20" : (isCoHost ? "bg-purple-500/20" : "bg-white/10"))}>
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
                                        <span className={cn("text-xs", isCreator ? "text-[#FF8800]" : (isCoHost ? "text-purple-400" : "text-gray-500"))}>
                                            {roleLabel}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        isCreator ? "bg-[#FF8800]" : (isCoHost ? "bg-purple-500" : "bg-blue-500")
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

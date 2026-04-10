import { Avatar } from './Avatar';
import { capitalizeName } from '../utils/ChatUtils';
import type { Conversation } from '../types/chat.types';

export const EmptyConversation = ({ participant }: { participant: Conversation['participant'] }) => (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8 -mt-20">
        <Avatar src={participant.avatar} alt={participant.name} className="w-20 h-20 sm:w-24 sm:h-24 ring-4 ring-white/5" />
        <div className="space-y-1.5 focus:outline-none outline-none">
            <p className="text-white font-black text-lg sm:text-xl tracking-wide">{capitalizeName(participant.name)}</p>
            <p className="text-gray-500 text-sm sm:text-base font-medium">Send a message to get the conversation started!</p>
        </div>
    </div>
);
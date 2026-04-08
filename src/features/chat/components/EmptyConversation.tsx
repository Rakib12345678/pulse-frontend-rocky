import { Avatar } from './Avatar';
import { capitalizeName } from '../utils/ChatUtils';
import type { Conversation } from '../types/chat.types';

export const EmptyConversation = ({ participant }: { participant: Conversation['participant'] }) => (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
        <Avatar src={participant.avatar} alt={participant.name} className="w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-white/10" />
        <div>
            <p className="text-white font-semibold text-sm sm:text-base">{capitalizeName(participant.name)}</p>
            <p className="text-gray-500 text-md sm:text-sm mt-1">Send a message to get the conversation started!</p>
        </div>
    </div>
);

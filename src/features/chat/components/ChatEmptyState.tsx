import chatGroup from '@/assets/chatGroup.svg';

export const ChatEmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-6">
        <img src={chatGroup} alt="Chat Group" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
        <div className="max-w-sm">
            <p className="text-white font-bold text-lg sm:text-xl leading-snug">
                Please select a chat to start messaging
            </p>
            <p className="text-gray-500 text-xs sm:text-sm mt-2 leading-relaxed">
                Choose from your existing conversations on the left to start a conversation.
            </p>
        </div>
    </div>
);

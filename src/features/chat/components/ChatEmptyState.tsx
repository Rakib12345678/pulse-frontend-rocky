import chatGroup from '@/assets/chatGroup.svg';
import { useAuthStore } from '@/features/auth/stores/authStore';

export const ChatEmptyState = () => {
    const { user } = useAuthStore();

    const heading = user ? null : 'No chats yet';

    const subtext = user
        ? 'Search for creators and start your first conversation.'
        : 'Log in to discover creators and start chatting.';

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-6">
            <img src={chatGroup} alt="Chat Group" className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
            <div className="max-w-sm">
                {heading && (
                    <p className="text-white font-bold text-lg sm:text-xl leading-snug">
                        {heading}
                    </p>
                )}
                <p className="text-gray-500 text-md sm:text-sm mt-2 leading-relaxed">
                    {subtext}
                </p>
            </div>
        </div>
    );
};

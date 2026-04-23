import { useNavigate } from '@tanstack/react-router';
import chatGroup from '@/assets/chatGroup.svg';
import { useAuthStore } from '@/features/auth/stores/authStore';

export const ChatEmptyState = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();

    const heading = user ? null : 'No chats yet';

    const subtext = user
        ? 'Search for creators and start your first conversation.'
        : 'Log in to discover creators and start chatting.';

    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center px-6">
            <img src={chatGroup} alt="Chat Group" className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
            <div className="max-w-[320px] mx-auto">
                {heading && (
                    <p className="text-white font-bold text-xl sm:text-2xl leading-tight mb-3">
                        {heading}
                    </p>
                )}
                <p className="text-gray-500 text-lg sm:text-[15px] leading-relaxed">
                    {subtext}
                </p>
            </div>
        </div>
    );
};

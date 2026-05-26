import chatGroup from '@/assets/chatGroup.svg';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useIsMobile } from '@/hooks/use-mobile';

export const ChatEmptyState = () => {
    const { user } = useAuthStore();
    const isMobile = useIsMobile();

    const heading = user ? null : 'No chats yet';

    const subtext = user
        ? 'Search for creators and start your first conversation.'
        : 'Log in to discover creators and start chatting.';

    return (
        <div className={`flex-1 flex flex-col items-center justify-center text-center px-6 ${isMobile ? 'gap-4 py-8' : 'gap-5 py-12'}`}>
            <img 
                src={chatGroup} 
                alt="Chat Group" 
                className={`object-contain ${isMobile ? 'w-10 h-10' : 'w-12 h-12 sm:w-14 sm:h-14'}`} 
            />
            <div className="max-w-[320px] mx-auto">
                {heading && (
                    <p className={`text-white font-bold leading-tight mb-3 ${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'}`}>
                        {heading}
                    </p>
                )}
                <p className={`text-gray-500 leading-relaxed ${isMobile ? 'text-sm' : 'text-lg sm:text-[15px]'}`}>
                    {subtext}
                </p>
            </div>
        </div>
    );
};


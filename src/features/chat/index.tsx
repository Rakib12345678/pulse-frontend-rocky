import { ChatPage } from '@/features/chat/components/ChatPage';
import background from '@/assets/background.png';
import { useStreamInit } from '@/features/chat/stream/useStreamInit';

export const Chat = () => {
    useStreamInit();
    return (
        <div
            className="flex-1 min-h-0 w-full overflow-hidden flex flex-col"
            style={{
                backgroundColor: '#0d0a09',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.82), rgba(0,0,0,0.82)), url(${background})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '300px 300px',
            }}
        >
            <ChatPage />
        </div>
    );
};

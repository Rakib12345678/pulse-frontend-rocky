import { ChatPage } from '@/features/chat/components/ChatPage';
import background from '@/assets/background.png';
import { useStreamInit } from '@/features/chat/stream/useStreamInit';

// Ensure the background image is cached in memory to avoid rendering delay/flickering
if (typeof window !== 'undefined') {
  const bgImg = new Image();
  bgImg.src = background;
}

export const Chat = () => {
    useStreamInit();
    return (
        <div
            className="flex-1 min-h-0 w-full overflow-hidden flex flex-col relative"
            style={{
                backgroundColor: '#0d0a09',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.82), rgba(0,0,0,0.82)), url(${background})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '300px 300px',
            }}
        >
            {/* High-priority eager LCP image tag for immediate browser HTML preloader discovery */}
            <img
                src={background}
                alt=""
                className="absolute opacity-0 pointer-events-none w-px h-px"
                aria-hidden="true"
                fetchPriority="high"
                loading="eager"
            />
            <ChatPage />
        </div>
    );
};

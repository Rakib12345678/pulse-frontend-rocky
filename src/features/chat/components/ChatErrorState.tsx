import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import background from '@/assets/background.png';
import frame from '@/assets/Frame.svg';

// Ensure the background image is cached in memory to avoid rendering delay/flickering
if (typeof window !== 'undefined') {
  const bgImg = new Image();
  bgImg.src = background;
}

interface ChatErrorStateProps {
    onExplore?: () => void;
}

export const ChatErrorState: React.FC<ChatErrorStateProps> = ({ onExplore }) => {
    const navigate = useNavigate();
    const handleExplore = onExplore ?? (() => navigate({ to: '/for-you' }));

    return (
        <div
            className="relative h-full w-full flex items-center justify-center overflow-hidden"
            style={{
                backgroundColor: '#050505',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.85), rgba(0,0,0,0.85)), url(${background})`,
                backgroundRepeat: 'repeat',
                backgroundSize: '250px 250px',
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
            <div
                className="absolute pointer-events-none"
                style={{
                    width: '1000px',
                    height: '1000px',
                    bottom: '-80px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    /* Only change: ellipse horizontal radius 75% → 38% to narrow toward sides */
                    WebkitMaskImage: 'radial-gradient(ellipse 38% 100% at 50% 0%, black 20%, transparent 65%), linear-gradient(to bottom, black 0%, black 20%, transparent 50%)',
                    maskImage: 'radial-gradient(ellipse 38% 100% at 50% 0%, black 20%, transparent 65%), linear-gradient(to bottom, black 0%, black 20%, transparent 50%)',
                    background: `radial-gradient(circle, transparent 0%, transparent 42%, rgba(100, 20, 0, 0.25) 52%, rgba(170, 50, 0, 0.7) 59%, rgba(210, 80, 0, 0.88) 47%, rgba(170, 50, 0, 0.7) 57%, rgba(100, 20, 0, 0.25) 63%, transparent 72%)`,
                    filter: 'blur(32px)',
                    zIndex: 0,
                }}
            />

            {/* Content — sits inside the hollow of the arch */}
            <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-[700px]">

                {/* Frame icon */}
                <img
                    src={frame}
                    alt="Chat"
                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain mb-6"
                />

                {/* Coming Soon — gradient left blue → purple → pink → orange */}
                <h1
                    className="font-black leading-none tracking-tight mb-4 whitespace-nowrap"
                    style={{
                        fontSize: 'clamp(3.5rem, 9vw, 7rem)',
                        background: 'linear-gradient(90deg, #6366F1 0%, #A855F7 30%, #EC4899 65%, #F97316 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    Coming Soon
                </h1>

                {/* Subtitle */}
                <p className="text-white font-bold text-lg sm:text-xl mb-3">
                    Our team working on chat screen
                </p>

                {/* Description */}
                <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-sm mb-10 opacity-80">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. In elementum
                    odio turpis, eget dictum felis fringilla non.
                </p>

                {/* Orange CTA button */}
                <button
                    onClick={handleExplore}
                    className="px-12 py-4 rounded-full font-bold text-white text-base transition-all duration-200 active:scale-95 hover:brightness-110"
                    style={{
                        background: 'linear-gradient(180deg, #FF8A00 0%, #FF5C00 100%)',
                        boxShadow: '0 10px 40px rgba(255, 92, 0, 0.35)',
                    }}
                >
                    Explore Live Stream
                </button>
            </div>
        </div>
    );
};
import React, { useEffect, useState, useCallback } from 'react';
import { useLiveStreamContext } from './LiveStreamLayout';
import { AnimatePresence, motion } from 'motion/react';

interface Heart {
    id: string;
    color: string;
    x: number; // Random horizontal start position offset
}

const HEART_COLORS = ['#FF4D4D', '#FF0000', '#FF6B6B', '#FF8080', '#D90000'];

export const FloatingHearts: React.FC = () => {
    const { call } = useLiveStreamContext();
    const [hearts, setHearts] = useState<Heart[]>([]);

    // Subscribe to reactions
    useEffect(() => {
        if (!call) {
            console.log('FloatingHearts: No call object available');
            return;
        }

        console.log('FloatingHearts: Subscribing to reactions for call', call.id);

        const handleNewReaction = (event: any) => {
            console.log('FloatingHearts: New reaction received:', event);
            if (event.reaction.type === 'live-heart') {
                console.log('FloatingHearts: Adding heart!');
                addHeart();
            }
        };

        // @ts-ignore
        call.on('call.reaction_new', handleNewReaction);

        return () => {
            console.log('FloatingHearts: Unsubscribing');
            // @ts-ignore
            call.off('call.reaction_new', handleNewReaction);
        };
    }, [call]);

    const addHeart = useCallback(() => {
        const id = Math.random().toString(36).substring(7);
        const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
        const x = Math.floor(Math.random() * 60) - 30; // Random x between -30 and 30 px

        setHearts((prev) => [...prev, { id, color, x }]);

        // Remove heart after animation
        setTimeout(() => {
            setHearts((prev) => prev.filter((h) => h.id !== id));
        }, 2000); // Animation duration
    }, []);

    useEffect(() => {
        const handleLocalHeart = () => addHeart();
        window.addEventListener('local-heart', handleLocalHeart);
        return () => window.removeEventListener('local-heart', handleLocalHeart);
    }, [addHeart]);

    return (
        <div className="absolute bottom-20 right-4 w-20 h-96 pointer-events-none z-30 overflow-visible flex flex-col justify-end items-center">
            <AnimatePresence>
                {hearts.map((heart) => (
                    <motion.div
                        key={heart.id}
                        initial={{ opacity: 1, y: 0, x: heart.x, scale: 0.5 }}
                        animate={{
                            opacity: 0,
                            y: -300,
                            x: heart.x + (Math.random() * 40 - 20),
                            scale: 1.2,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="absolute bottom-0 text-4xl drop-shadow-lg"
                        style={{ color: heart.color }}
                    >
                        ♥
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

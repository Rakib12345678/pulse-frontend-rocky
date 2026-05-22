import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useLiveStreamContext } from '@/features/live/components/layout/LiveStreamLayout';
import { useChatContext } from 'stream-chat-react';
import { AnimatePresence, motion } from 'motion/react';

interface Heart {
    id: string;
    color: string;
    x: number;
    rotation: number;
    delay: number;
    drift: number;
    size: number;
    emoji: string;
    imageUrl?: string;
}

const HEART_COLORS = ['#FF4D4D', '#FF0000', '#FF6B6B', '#FF8080', '#D90000', '#FF3366', '#FF1744'];

export const FloatingHearts: React.FC = () => {
    const { call, isGuest, isViewer } = useLiveStreamContext();
    const { client: chatClient } = useChatContext();
    const [hearts, setHearts] = useState<Heart[]>([]);
    const timeoutsRef = useRef<number[]>([]);

    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach(clearTimeout);
            timeoutsRef.current = [];
        };
    }, []);

    useEffect(() => {
        if (!call) {
            console.log('FloatingHearts: No call object available');
            return;
        }

        console.log('FloatingHearts: Subscribing to reactions for call', call.id);

        const handleNewReaction = (event: any) => {
            console.log('FloatingHearts: New reaction received:', event);
            if (event.reaction.type === 'live-heart' || event.reaction.type === 'live-reaction') {
                const emoji = event.reaction.custom?.emoji || '♥';
                const imageUrl = event.reaction.custom?.iconUrl;
                console.log('FloatingHearts: Adding reaction!', emoji, imageUrl);
                addHeart(emoji, imageUrl);
            }
        };

        // Authenticated users get the video SDK event
        if (!isGuest) {
            // @ts-ignore
            call.on('call.reaction_new', handleNewReaction);
        }

        // Setup chat listener for guests
        let chatChannel: any = null;
        let chatListener: any = null;

        if (isGuest && chatClient) {
            try {
                chatChannel = chatClient.channel('livestream', call.id);

                chatListener = chatChannel.on('client-live-reaction', (event: any) => {
                    console.log('FloatingHearts: New chat event reaction received:', event);
                    const emoji = event.emoji || '♥';
                    const imageUrl = event.iconUrl;
                    addHeart(emoji, imageUrl);
                });
            } catch (err) {
                console.error('FloatingHearts: Failed to setup chat listener', err);
            }
        }

        return () => {
            console.log('FloatingHearts: Unsubscribing');
            if (!isGuest) {
                // @ts-ignore
                call.off('call.reaction_new', handleNewReaction);
            }

            if (chatListener) {
                chatListener.unsubscribe();
            }
        };
    }, [call, chatClient, isGuest]);

    const addHeart = useCallback((emoji: string = '♥', imageUrl?: string) => {
        if (isViewer && imageUrl) return;

        const id = Math.random().toString(36).substring(7);
        const color = HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
        const x = Math.floor(Math.random() * 80) - 40; // Wider starting range
        const rotation = (Math.random() * 30) - 15;
        const delay = Math.random() * 0.1; // Slight stagger
        const drift = (Math.random() - 0.5) * 100; // How much it drifts sideways
        const size = 0.8 + Math.random() * 0.5; // Varying sizes

        setHearts((prev) => {
            const updated = [...prev, { id, color, x, rotation, delay, drift, size, emoji, imageUrl }];
            return updated.length > 5 ? updated.slice(updated.length - 5) : updated;
        });

        const timerId = window.setTimeout(() => {
            setHearts((prev) => prev.filter((h) => h.id !== id));
            timeoutsRef.current = timeoutsRef.current.filter(t => t !== timerId);
        }, 3000);
        timeoutsRef.current.push(timerId);
    }, [isViewer]);

    return (
        <div className="absolute bottom-20 right-[35%] w-20 h-96 pointer-events-none z-30 overflow-visible flex flex-col justify-end items-center">
            <AnimatePresence>
                {hearts.map((heart) => (
                    <motion.div
                        key={heart.id}
                        initial={{
                            opacity: 0,
                            y: 0,
                            x: heart.x,
                            scale: 0,
                            rotate: heart.rotation
                        }}
                        animate={{
                            opacity: [0, 1, 1, 0.8, 0],
                            y: -350,
                            x: heart.x + heart.drift,
                            scale: [0, heart.size * 1.1, heart.size, heart.size * 0.9, heart.size * 0.7],
                            rotate: heart.rotation + 20,
                        }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{
                            duration: 2.5,
                            delay: heart.delay,
                            ease: [0.25, 0.46, 0.45, 0.94], // Custom bezier for more natural movement
                            opacity: {
                                times: [0, 0.1, 0.5, 0.8, 1],
                                duration: 2.5,
                            },
                            y: {
                                duration: 2.5,
                                ease: "easeOut",
                            },
                            x: {
                                duration: 2.5,
                                ease: "easeInOut",
                            },
                            rotate: {
                                duration: 2.5,
                                ease: "easeInOut",
                            },
                        }}
                        className="absolute bottom-0 text-4xl drop-shadow-lg"
                        style={{
                            color: heart.emoji === '♥' ? heart.color : undefined, // Only color the default heart
                        }}
                    >
                        {heart.imageUrl ? (
                            <img src={heart.imageUrl} alt="gift" className="w-12 h-12 object-contain" />
                        ) : (
                            heart.emoji
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
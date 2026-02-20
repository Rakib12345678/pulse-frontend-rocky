import React, { useState, useRef, useEffect } from 'react';
import { Lock, Heart, SendHorizonal } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import {
    Channel,
    useChannelStateContext,
    useChatContext,
} from 'stream-chat-react';
import { Channel as StreamChannel } from 'stream-chat';
import { useLiveStreamContext } from './LiveStreamLayout';
import { useUserProfileStore } from '../stores/userProfileStore';

export const LiveStreamChat: React.FC = () => {
    const { client: chatClient } = useChatContext();
    const { call, isChatVisible, isViewer } = useLiveStreamContext();
    const { user } = useAuthStore();

    if (!isChatVisible) return null;

    if (!call || !chatClient) return null;

    // Use the same ID as the call for the chat channel
    const channel = chatClient.channel('livestream', call.id);

    return (
        <Channel key={chatClient.userID || 'anonymous'} channel={channel}>
            <div className="absolute bottom-10 left-4 right-4 sm:left-10 sm:right-auto sm:w-80 max-h-[400px] flex flex-col z-20">
                <LiveStreamMessageList />
                <LiveStreamMessageInput />
                <JoinMessageSender channel={channel} isViewer={isViewer} userId={user?.id} />
            </div>
        </Channel>
    );
};

const LiveStreamMessageList: React.FC = () => {
    const { messages } = useChannelStateContext();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { openModal: openProfileModal } = useUserProfileStore();
    const { openModal: openLoginModal, setMode } = useSignUpStore();
    const { isGuest } = useLiveStreamContext();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleUserClick = (username?: string) => {
        if (!username) return;
        if (isGuest) {
            setMode('login');
            openLoginModal();
        } else {
            openProfileModal(username);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto space-y-5 mb-4 scrollbar-hide pr-2">
            {messages?.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                    <img
                        src={msg.user?.image || 'https://i.pravatar.cc/150'}
                        alt={msg.user?.name || msg.user?.id}
                        onClick={() => handleUserClick(msg.user?.name)}
                        className="w-10 h-10 rounded-full border-2 border-blue-500/60 shrink-0 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    />
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="text-sm font-semibold text-white/60 cursor-pointer hover:text-white hover:underline transition-colors"
                                onClick={() => handleUserClick(msg.user?.name)}
                            >
                                @{msg.user?.name || msg.user?.id}
                            </span>
                            {typeof msg.text === 'string' && msg.text.split('\n').length > 1 && (
                                <>
                                    <span className="text-sm font-bold text-white mt-0.5">
                                        {msg.text.split('\n')[0]}
                                    </span>
                                    <p className="text-sm text-white/80 mt-1 leading-relaxed">
                                        {msg.text.split('\n').slice(1).join('\n')}
                                    </p>
                                </>
                            )}
                            {typeof msg.text === 'string' && msg.text.split('\n').length === 1 && (
                                <span className={`text-sm font-bold ${(msg as any).isJoinMessage ? 'text-white/50 italic' : 'text-white'}`}>
                                    {msg.text}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

const HEART_EMOJI = { char: '❤️', icon: Heart, color: 'text-red-500' };

const LiveStreamMessageInput: React.FC = () => {
    const { isAuthenticated, user } = useAuthStore();
    const { channel } = useChannelStateContext();
    const { call, isGuest } = useLiveStreamContext();
    const { openModal, setMode } = useSignUpStore();
    const [inputValue, setInputValue] = useState('');

    const openLoginModal = () => {
        setMode('login');
        openModal();
    };

    const handleSendMessage = async () => {
        if (isGuest) {
            openLoginModal();
            return;
        }
        if (!inputValue.trim() || !channel) return;

        try {
            await channel.sendMessage({
                text: inputValue,
            });
            setInputValue('');
        } catch (err) {
            console.error('Failed to send message:', err);
        }
    };

    const [lastReactionTime, setLastReactionTime] = useState(0);

    const handleSendReaction = async () => {
        if (isGuest) {
            openLoginModal();
            return;
        }

        const now = Date.now();
        if (now - lastReactionTime < 2000) return; // 2 seconds cooldown

        setLastReactionTime(now);

        if (call) {
            try {
                // Send video reaction
                await call.sendReaction({
                    type: 'live-reaction',
                    custom: { emoji: HEART_EMOJI.char }
                });

                // Also send a custom chat channel event for anonymous guest viewers
                if (channel) {
                    await channel.sendEvent({
                        type: 'client-live-reaction',
                        emoji: HEART_EMOJI.char
                    } as any);
                }
            } catch (err) {
                console.error('Failed to send reaction:', err);
            }
        }
    };

    if (isAuthenticated && user) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Add a Comment"
                        className="w-full h-12 bg-[#2A3A2A]/80 border border-[#C5B358]/60 rounded-full pl-14 pr-14 text-sm text-white focus:outline-none focus:border-[#C5B358] transition-all placeholder:text-[#C5B358]/70"

                    />

                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <button
                            onClick={handleSendReaction}
                            className="flex items-center justify-center transition-transform hover:scale-125 active:scale-95"
                            title="Send heart"
                        >
                            <Heart className="w-6 h-6 text-red-500 fill-red-500 drop-shadow-sm" />
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleSendMessage}
                    className="w-12 h-12 rounded-full bg-[#E8D5A0] flex items-center justify-center text-[#3A3A2A] hover:bg-[#F0DFA8] hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                    <SendHorizonal className="w-6 h-6" strokeWidth={2.5} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center cursor-pointer" onClick={openLoginModal}>
            <div className="flex-1 relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#C5B358]/80 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#2A2A1A]" />
                </div>
                <div className="w-full h-12 bg-[#2A3A2A]/80 border border-[#C5B358]/60 rounded-full pl-14 pr-4 flex items-center">
                    <span className="text-sm text-white/50">Log in to chat</span>
                </div>
            </div>
        </div>
    );
};

// Component to handle sending the join message
const JoinMessageSender: React.FC<{ channel: StreamChannel; isViewer: boolean; userId?: number }> = ({ channel, isViewer, userId }) => {
    useEffect(() => {
        if (!channel || !isViewer || !userId) return;

        const sessionKey = `pulse_joined_${channel.id}`;
        const hasJoined = sessionStorage.getItem(sessionKey);

        if (!hasJoined) {
            // Set immediately to prevent strict mode double-firing
            sessionStorage.setItem(sessionKey, 'true');

            const sendJoinEvent = async () => {
                try {
                    if (!channel.initialized) {
                        await channel.watch();
                    }
                    await channel.sendMessage({
                        text: 'has joined the live',
                        isJoinMessage: true
                    } as any);
                } catch (err) {
                    console.error('Failed to send join message:', err);
                    sessionStorage.removeItem(sessionKey);
                }
            };
            sendJoinEvent();
        }
    }, [channel, isViewer, userId]);

    return null;
};


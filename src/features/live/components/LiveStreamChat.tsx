import React, { useState, useRef, useEffect } from 'react';
import { Smile, Plus, Lock, Heart } from 'lucide-react';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
    Channel,
    useChannelStateContext,
    useChatContext,
} from 'stream-chat-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLiveStreamContext } from './LiveStreamLayout';
import { useUserProfileStore } from '../stores/userProfileStore';

export const LiveStreamChat: React.FC = () => {
    const { client: chatClient } = useChatContext();
    const { call, isChatVisible } = useLiveStreamContext();

    if (!isChatVisible) return null;

    if (!call || !chatClient) return null;

    // Use the same ID as the call for the chat channel
    const channel = chatClient.channel('livestream', call.id);

    return (
        <Channel channel={channel}>
            <div className="absolute bottom-10 left-4 right-4 sm:left-10 sm:right-auto sm:w-80 max-h-[400px] flex flex-col z-20">
                <LiveStreamMessageList />
                <LiveStreamMessageInput />
            </div>
        </Channel>
    );
};

const LiveStreamMessageList: React.FC = () => {
    const { messages } = useChannelStateContext();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { openModal } = useUserProfileStore();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex-1 overflow-y-auto space-y-5 mb-4 scrollbar-hide pr-2">
            {messages?.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                    <img
                        src={msg.user?.image || 'https://i.pravatar.cc/150'}
                        alt={msg.user?.name || msg.user?.id}
                        onClick={() => msg.user?.name && openModal(msg.user.name)}
                        className="w-10 h-10 rounded-full border-2 border-blue-500/60 shrink-0 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    />
                    <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span
                                className="text-sm font-semibold text-white/60 cursor-pointer hover:text-white hover:underline transition-colors"
                                onClick={() => msg.user?.name && openModal(msg.user.name)}
                            >
                                @{msg.user?.name || msg.user?.id}
                            </span>
                            {/* Show first line bold next to username if short */}
                            {typeof msg.text === 'string' && msg.text.split('\n').length === 1 && (
                                <span className="text-sm font-bold text-white">{msg.text}</span>
                            )}
                        </div>
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
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

const LiveStreamMessageInput: React.FC = () => {
    const { isAuthenticated, user } = useAuthStore();
    const { channel } = useChannelStateContext();
    const { call } = useLiveStreamContext();
    const [inputValue, setInputValue] = useState('');

    const handleSendMessage = async () => {
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

    const handleSendHeart = async () => {
        const now = Date.now();
        if (now - lastReactionTime < 3000) return; // 3 seconds cooldown

        setLastReactionTime(now);

        // Dispath local event for immediate feedback
        window.dispatchEvent(new CustomEvent('local-heart'));

        if (call) {
            try {
                await call.sendReaction({ type: 'live-heart', emoji_code: ':heart:' });
            } catch (err) {
                console.error('Failed to send reaction:', err);
            }
        }
    };

    if (isAuthenticated && user) {
        return (
            <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#C5B358]/80 flex items-center justify-center hover:bg-[#C5B358] transition-colors">
                                <Smile className="w-5 h-5 text-[#2A2A1A]" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="top" align="start" className="w-16 min-w-0 p-2 bg-[#2A3A2A]/90 border border-[#C5B358]/30 backdrop-blur-md">
                            <DropdownMenuItem
                                onClick={handleSendHeart}
                                className="flex justify-center p-2 focus:bg-white/10 cursor-pointer"
                            >
                                <Heart className="w-6 h-6 text-red-500 fill-red-500 hover:scale-110 active:scale-95 transition-transform" />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Add a Comment"
                        className="w-full h-12 bg-[#2A3A2A]/80 border border-[#C5B358]/60 rounded-full pl-14 pr-4 text-sm text-white focus:outline-none focus:border-[#C5B358] transition-all placeholder:text-[#C5B358]/70"
                    />
                </div>
                <button
                    onClick={handleSendMessage}
                    className="w-12 h-12 rounded-full bg-[#E8D5A0] flex items-center justify-center text-[#3A3A2A] hover:bg-[#F0DFA8] hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                    <Plus className="w-6 h-6" strokeWidth={2.5} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center">
            <div className="flex-1 relative">
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#C5B358]/80 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-[#2A2A1A]" />
                </div>
                <div className="w-full h-12 bg-[#2A3A2A]/80 border border-[#C5B358]/60 rounded-full pl-14 pr-4 flex items-center">
                    <span className="text-sm text-white/50">Please log in to add a comment.</span>
                </div>
            </div>
        </div>
    );
};

import { useState, useRef } from 'react';
import { UserSearchList, type StreamUser } from './Usersearchlist';
import { getStreamClient } from '../stream/streamClient';
import { capitalizeName, getDisplayName } from '../utils/ChatUtils';
import type { Message } from '../types/chat.types';

interface ForwardModalProps {
    message: Message;
    onClose: () => void;
    onForwardSuccess: (name: string) => void;
    onForwardError: () => void;
}

export const ForwardModal = ({
    message, onClose, onForwardSuccess, onForwardError,
}: ForwardModalProps) => {
    const [sent, setSent] = useState<string | null>(null);
    const backdropRef = useRef<HTMLDivElement>(null);

    const handleForwardTo = async (user: StreamUser) => {
        try {
            const client = getStreamClient();
            const channel = client.channel('messaging', { members: [client.userID!, user.id] });
            await channel.create();
            await channel.sendMessage({ text: message.originalText ?? message.text });
            const name = capitalizeName(getDisplayName(user));
            setSent(name);
            setTimeout(() => { onForwardSuccess(name); onClose(); }, 800);
        } catch {
            onForwardError();
            onClose();
        }
    };

    return (
        <div
            ref={backdropRef}
            onClick={e => { if (e.target === backdropRef.current) onClose(); }}
            className="fixed inset-0 z-600 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        >
            <div className="relative w-full max-w-md bg-[#111213] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-orange-900/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 px-10 pt-5 pb-4 flex flex-col gap-6">
                    <div className="flex items-center justify-center">
                        <h2 className="text-white font-semibold text-base">Forward Message</h2>
                    </div>
                    <p className="text-white text-sm leading-relaxed line-clamp-2">
                        {message.originalText ?? message.text}
                    </p>
                    <UserSearchList
                        placeholder="Search user..."
                        actionLabel="Tap to forward"
                        emptyMessage="Search to forward"
                        onSelectUser={handleForwardTo}
                        inlineSuccess={sent ? `✓ Forwarded to ${sent}` : null}
                        listClassName="max-h-60"
                    />
                </div>
            </div>
        </div>
    );
};

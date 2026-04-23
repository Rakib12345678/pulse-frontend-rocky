import { useEffect, useRef } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageDropdownProps {
    isMe: boolean;
    onDelete?: () => void;
    onCopy: () => void;
    onClose: () => void;
    positionLeft?: boolean;
}

export const MessageDropdown = ({
    isMe, onDelete, onCopy, onClose, positionLeft,
}: MessageDropdownProps) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const t = setTimeout(() => {
            const h = (e: MouseEvent) => {
                if (ref.current && !ref.current.contains(e.target as Node)) onClose();
            };
            document.addEventListener('mousedown', h);
            return () => document.removeEventListener('mousedown', h);
        }, 50);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div ref={ref} className={cn(
            'absolute top-8 z-[101] min-w-40 bg-[#1e2029] border border-white/10 rounded-xl shadow-2xl overflow-hidden',
            positionLeft ? 'left-0' : 'right-0',
        )}>
            <button
                onClick={() => { onCopy(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-200 hover:bg-white/8 transition-colors border-t border-white/8"
            >
                <Copy className="w-4 h-4 shrink-0" /> Copy
            </button>
            {onDelete && (
                <button
                    onClick={() => { onDelete(); onClose(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors border-t border-white/8"
                >
                    <Trash2 className="w-4 h-4 shrink-0" /> Delete
                </button>
            )}
        </div>
    );
};

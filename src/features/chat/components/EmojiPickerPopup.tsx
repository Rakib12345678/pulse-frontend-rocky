import { useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface EmojiPickerPopupProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

export const EmojiPickerPopup = ({ onSelect, onClose }: EmojiPickerPopupProps) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="absolute bottom-17 sm:bottom-18 right-3 sm:right-4 z-50"
            style={{
                '--rgb-background':    '17, 18, 19',
                '--rgb-input':         '30, 32, 41',
                '--rgb-color':         '255, 255, 255',
                '--rgb-accent':        '255, 119, 0',
                '--rgb-border':        '255, 255, 255',
                '--color-border':      'rgba(255,255,255,0.08)',
                '--color-border-over': 'rgba(255,255,255,0.15)',
            } as React.CSSProperties}
        >
            <Picker
                data={data}
                onEmojiSelect={(emoji: { native: string }) => {
                    onSelect(emoji.native);
                    onClose();
                }}
                theme="dark"
                set="native"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={1}
                perLine={8}
            />
        </div>
    );
};

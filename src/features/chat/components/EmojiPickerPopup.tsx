import { useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface EmojiPickerPopupProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

export const EmojiPickerPopup = ({
    onSelect, onClose,
}: EmojiPickerPopupProps) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [onClose]);

    return (
        <div ref={ref} className="absolute bottom-17 sm:bottom-18 right-3 sm:right-4 z-50">
            <Picker
                data={data}
                onEmojiSelect={(emoji: { native: string }) => { onSelect(emoji.native); onClose(); }}
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

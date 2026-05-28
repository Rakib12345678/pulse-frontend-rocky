import { useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { cn } from '@/lib/utils';

interface EmojiPickerPopupProps {
    onSelect: (emoji: any) => void;
    onClose: () => void;
    closeOnSelect?: boolean;
    className?: string;
    style?: React.CSSProperties;
    isMobile?: boolean;
    mobileHeight?: number;
}

export const EmojiPickerPopup = ({ onSelect, onClose, closeOnSelect = true, className, style, isMobile, mobileHeight = 320 }: EmojiPickerPopupProps) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [onClose]);

    const defaultStyle: React.CSSProperties = {
        '--rgb-background': '17, 18, 19',
        '--rgb-input': '30, 32, 41',
        '--rgb-color': '255, 255, 255',
        '--rgb-accent': '255, 119, 0',
        '--rgb-border': '255, 255, 255',
        '--color-border': 'rgba(255,255,255,0.08)',
        '--color-border-over': 'rgba(255,255,255,0.15)',
        width: isMobile ? '100%' : undefined,
        ...style,
    } as any;

    return (
        <div
            ref={ref}
            className={cn(
                className || "absolute bottom-17 sm:bottom-18 right-3 sm:right-4 z-50",
                isMobile && "w-full min-w-full"
            )}
            style={defaultStyle}
            data-vaul-no-drag
        >
            {isMobile && (
                <style>{`
                    em-emoji-picker {
                        width: 100% !important;
                        min-width: 100% !important;
                        max-width: 100% !important;
                        --width: 100% !important;
                        border-radius: 0 !important;
                        border: none !important;
                    }
                `}</style>
            )}
            <Picker
                data={data}
                onEmojiSelect={(emoji: any) => {
                    onSelect(emoji);
                    if (closeOnSelect) {
                        onClose();
                    }
                }}
                theme="dark"
                set="native"
                previewPosition="none"
                skinTonePosition="none"
                maxFrequentRows={1}
                navPosition={isMobile ? "bottom" : "top"}
                perLine={isMobile ? 8 : 8}
                dynamicWidth={isMobile}
                {...(isMobile ? { height: mobileHeight } : {})}
            />
        </div>
    );
};
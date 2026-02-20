import React from 'react';
import { cn } from '@/lib/utils';

interface AuthModalBackdropProps {
    children: React.ReactNode;
    onClose: () => void;
    size?: 'default' | 'large';
}

export const AuthModalBackdrop = ({ children, onClose, size = 'default' }: AuthModalBackdropProps) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />
            <div
                className={cn(
                    "relative z-10 overflow-hidden rounded-2xl bg-[#111213] shadow-2xl animate-in zoom-in-95 duration-200 border border-white/5",
                    size === 'large' ? "w-237.5 h-140" : "w-165 h-140"
                )}
            >
                <div
                    className="pointer-events-none absolute rounded-full"
                    style={{
                        width: 169,
                        height: 220,
                        top: -108,
                        right: -92,
                        background: '#FF7700',
                        filter: 'blur(180px)',
                        mixBlendMode: 'color-dodge',
                    }}
                />
                <div
                    className="pointer-events-none absolute rounded-full"
                    style={{
                        width: 220,
                        height: 220,
                        bottom: -110,
                        left: -110,
                        background: '#3E2AB5',
                        filter: 'blur(354px)',
                        mixBlendMode: 'color-dodge',
                    }}
                />
                <div className="relative z-10 h-full">
                    {children}
                </div>
            </div>
        </div>
    );
};
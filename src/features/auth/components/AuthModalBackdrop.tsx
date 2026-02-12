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
                    "relative z-10 overflow-hidden rounded-[24px] bg-[#0f1117] shadow-2xl animate-in zoom-in-95 duration-200 border border-white/5",
                    size === 'large' ? "w-[920px] h-[720px]" : "w-[660px] h-[560px]"
                )}
            >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_100%_0%,rgba(255,71,26,0.15)_0%,rgba(200,60,100,0.1)_25%,rgba(100,60,180,0.05)_50%,transparent_75%)]" />

                <div className="relative z-10 h-full">
                    {children}
                </div>
            </div>
        </div>
    );
};
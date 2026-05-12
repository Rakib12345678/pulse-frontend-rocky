import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, X } from 'lucide-react';

interface EndLiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEnd: (save: boolean) => Promise<void>;
    isLoading?: boolean;
    autoEndCountdown?: number;
}

export const EndLiveModal: React.FC<EndLiveModalProps> = ({
    isOpen,
    onClose,
    onEnd,
    isLoading = false,
    autoEndCountdown
}) => {
    const [localCountdown, setLocalCountdown] = React.useState(15);
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

    // Sync count from props when modal opens
    React.useEffect(() => {
        if (isOpen && autoEndCountdown) {
            setLocalCountdown(autoEndCountdown);
        }
    }, [isOpen]);

    // Independent timer loop
    React.useEffect(() => {
        if (isOpen && autoEndCountdown) {
            if (intervalRef.current) clearInterval(intervalRef.current);

            intervalRef.current = setInterval(() => {
                setLocalCountdown((prev) => {
                    if (prev <= 1) {
                        if (intervalRef.current) clearInterval(intervalRef.current);
                        onEnd(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isOpen, !!autoEndCountdown]); // Removed onEnd from deps to prevent resets

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
            <DialogContent 
                showCloseButton={false}
                className="bg-[#1C1C1E] border-white/5 rounded-3xl sm:max-w-md p-8 gap-6 shadow-2xl overflow-hidden"
            >
                <button 
                    onClick={onClose}
                    className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors z-50"
                >
                    <X className="w-6 h-6" />
                </button>

                <DialogHeader className="flex flex-col items-center gap-4 text-center">
                    <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                        {autoEndCountdown ? (
                            <div className="absolute inset-0 rounded-full border-4 border-red-500/20 flex items-center justify-center">
                                <span className="text-4xl font-black text-red-500">{localCountdown}</span>
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                                <Trash2 className="w-8 h-8 text-red-500" />
                            </div>
                        )}
                    </div>
                    <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                        {autoEndCountdown ? "Session Ended" : "End Live Stream?"}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400 text-base leading-relaxed">
                        {autoEndCountdown ? (
                            "Your 10-minute session limit has been reached. Would you like to save the recording to your profile?"
                        ) : (
                            "Are you sure you want to end your live stream? You can choose to save the recording to your profile."
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
                    <Button
                        onClick={() => onEnd(true)}
                        disabled={isLoading}
                        className="flex-1 py-7 rounded-2xl !bg-[#ff7700] !bg-none !text-black font-bold text-base hover:!bg-[#ff8800] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-1 border-0"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-black" /> : (autoEndCountdown ? "Save Recording" : "Save & End")}
                    </Button>

                    <Button
                        onClick={() => onEnd(false)}
                        disabled={isLoading}
                        className="flex-1 py-7 rounded-2xl !bg-[#555555] !bg-none !text-white font-bold text-base hover:!bg-[#666666] active:scale-95 transition-all flex items-center justify-center gap-1 border-0"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : (autoEndCountdown ? "Discard" : "Discard & End")}
                    </Button>

                    {!autoEndCountdown && (
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            disabled={isLoading}
                            className="flex-1 py-7 rounded-2xl !bg-transparent !bg-none border-2 border-gray-600 !text-gray-400 font-bold text-base hover:border-gray-400 hover:!text-white transition-all disabled:opacity-50"
                        >
                            Stay
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

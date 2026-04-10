import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { PopoverContent } from '@/components/ui/popover';

interface TranslateTogglePopoverProps {
    enabled: boolean;
    onToggle: (checked: boolean) => void;
    onChangeLanguage: () => void;
    className?: string;
}

export const TranslateTogglePopover = ({
    enabled,
    onToggle,
    onChangeLanguage,
    className,
}: TranslateTogglePopoverProps) => {
    return (
        <PopoverContent 
            align="end"
            sideOffset={12}
            className={cn(
                "w-[220px] bg-[#2A2D31] rounded-2xl p-4 shadow-2xl border border-white/5 z-[10000]",
                className
            )}
        >
            {/* Toggle Row with #111213 background */}
            <div className="flex items-center justify-between mb-4 bg-[#111213] p-3 px-4 rounded-2xl">
                <span className="text-gray-200 font-medium text-[14px]">Translate Chat</span>
                <Switch
                    checked={enabled}
                    onCheckedChange={onToggle}
                    className="data-[state=checked]:bg-[#FF7700] data-[state=unchecked]:bg-white/10 scale-90"
                />
            </div>
            
            <div className="flex justify-center pb-1">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onChangeLanguage();
                    }}
                    className="text-[#4A9EFF] hover:text-[#7ab8ff] text-[13px] font-medium transition-colors underline underline-offset-4 cursor-pointer"
                >
                    Change Language
                </button>
            </div>
        </PopoverContent>
    );
};

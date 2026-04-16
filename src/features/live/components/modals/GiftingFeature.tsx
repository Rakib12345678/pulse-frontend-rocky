import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Drawer,
    DrawerContent,
} from '@/components/ui/drawer';
import { GiftingGrid } from '@/features/live/components/modals/GiftingGrid';

interface GiftingFeatureProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const GiftingFeature: React.FC<GiftingFeatureProps> = ({ isOpen, onOpenChange }) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={onOpenChange}>
                <DrawerContent className="bg-[#141519] border-white/10 h-[60vh] rounded-t-4xl overflow-hidden">
                    <GiftingGrid onClose={() => onOpenChange(false)} />
                </DrawerContent>
            </Drawer>
        );
    }

    if (!isOpen) return null;

    return (
        <div className="absolute right-10 bottom-28 w-[340px] h-[540px] z-40 bg-[#141519] rounded-4xl shadow-2xl border border-white/5 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <GiftingGrid onClose={() => onOpenChange(false)} />
        </div>
    );
};

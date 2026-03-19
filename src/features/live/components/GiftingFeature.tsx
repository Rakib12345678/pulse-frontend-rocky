import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Drawer,
    DrawerContent,
} from '@/components/ui/drawer';
import { GiftingGrid } from './GiftingGrid';

interface GiftingFeatureProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export const GiftingFeature: React.FC<GiftingFeatureProps> = ({ isOpen, onOpenChange }) => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={onOpenChange}>
                <DrawerContent className="bg-[#0F1117] border-white/10 h-[60vh]">
                    <GiftingGrid onClose={() => onOpenChange(false)} />
                </DrawerContent>
            </Drawer>
        );
    }

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-0 bottom-0 w-80 z-40 bg-[#0F1117] border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300">
            <GiftingGrid onClose={() => onOpenChange(false)} />
        </div>
    );
};

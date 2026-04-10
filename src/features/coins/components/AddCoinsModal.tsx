import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import { useIsMobile } from '@/hooks/use-mobile';
import { useCoinsStore } from '../hooks/useCoinsStore';
import { CoinPackageGrid } from './CoinPackageGrid';
import { CheckoutView } from './CheckoutView';
import { ResultView } from './ResultView';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBackground } from '@/components/internal/AppBackground';

export const AddCoinsModal = () => {
    const { isOpen, step, closeModal } = useCoinsStore();
    const isMobile = useIsMobile();

    const renderContent = (isMobileView: boolean) => (
        <AppBackground 
            displayRings={false} 
            className={`h-full w-full ${isMobileView ? '' : 'sm:rounded-3xl'} flex flex-col pt-8`}
            innerClassName="flex flex-col overflow-hidden"
        >
            {/* Accessibility — hidden title */}
            {isMobileView ? (
                <>
                    <DrawerTitle className="sr-only">Add Coins</DrawerTitle>
                    <DrawerDescription className="sr-only">Purchase coins for PulseLive</DrawerDescription>
                </>
            ) : (
                <>
                    <DialogTitle className="sr-only">Add Coins</DialogTitle>
                    <DialogDescription className="sr-only">Purchase coins for PulseLive</DialogDescription>
                </>
            )}

            {/* Close Button */}
            <Button
                variant="ghost"
                onClick={closeModal}
                className="absolute top-4 right-4 z-50 w-7 h-7 p-0 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
            >
                <X className="w-4 h-4 text-white" />
            </Button>

            {/* Content */}
            <div className={`${isMobileView ? 'px-6' : 'px-18'} py-6 pt-0 flex-1 overflow-y-auto min-h-0`}>
                {step === 'select' && <CoinPackageGrid />}
                {step === 'checkout' && <CheckoutView />}
                {step === 'result' && <ResultView />}
            </div>
        </AppBackground>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={(open) => !open && closeModal()}>
                <DrawerContent 
                    className="bg-[#111213] border-none text-white max-h-[95vh] h-[95vh] flex flex-col p-0 overflow-hidden"
                    style={{ background: 'linear-gradient(180deg, #111213 0%, #0d0d0d 100%)' }}
                >
                    <div className="mx-auto mt-2 h-1 w-12 shrink-0 rounded-full bg-white/20" />
                    {renderContent(true)}
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent
                showCloseButton={false}
                className="bg-transparent border border-white/10 rounded-3xl p-0 sm:max-w-[580px] h-full sm:h-auto max-h-[90vh] overflow-hidden shadow-2xl"
            >
                {renderContent(false)}
            </DialogContent>
        </Dialog>
    );
};

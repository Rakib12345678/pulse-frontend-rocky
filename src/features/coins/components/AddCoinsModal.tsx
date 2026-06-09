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
            className={`h-full w-full ${isMobileView ? '' : 'sm:rounded-3xl'} flex flex-col`}
            innerClassName="flex flex-col overflow-hidden flex-1 min-h-0"
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

            {/* Fixed Header Area for Close Button */}
            <div className="w-full flex justify-end items-center p-4 pt-6 shrink-0 relative z-50">
                <Button
                    variant="ghost"
                    onClick={closeModal}
                    className="w-7 h-7 p-0 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer shadow-lg"
                >
                    <X className="w-4 h-4 text-white stroke-[3px]" />
                </Button>
            </div>

            {/* Content */}
            <div className={`${isMobileView ? 'px-6' : 'px-16'} py-2 flex-1 min-h-0 pb-8 flex flex-col ${step === 'select' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar'}`}>
                {step === 'select' && <CoinPackageGrid />}
                {step === 'checkout' && <CheckoutView />}
                {step === 'result' && <ResultView />}
            </div>
        </AppBackground>
    );

    if (isMobile) {
        if (step === 'result') {
            return (
                <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
                    <DialogContent
                        showCloseButton={false}
                        className="bg-[#111213] border border-white/10 p-0 w-[92dvw] max-w-[400px] h-auto rounded-[32px] overflow-hidden shadow-2xl focus:outline-none"
                        style={{ background: 'linear-gradient(180deg, #111213 0%, #0d0d0d 100%)' }}
                    >
                        {renderContent(true)}
                    </DialogContent>
                </Dialog>
            );
        }

        return (
            <Drawer
                open={isOpen}
                onOpenChange={(open) => !open && closeModal()}
            >
                <DrawerContent
                    className="bg-[#111213] border-none text-white flex flex-col p-0 overflow-hidden focus:outline-none"
                    style={{
                        background: 'linear-gradient(180deg, #111213 0%, #0d0d0d 100%)',
                        height: '85dvh',
                        maxHeight: '85dvh'
                    }}
                >
                    {renderContent(true)}
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent
                showCloseButton={false}
                className={`bg-transparent border border-white/10 rounded-3xl p-0 overflow-hidden shadow-2xl focus:outline-none flex flex-col ${
                    step === 'result'
                        ? 'sm:max-w-[480px] h-auto'
                        : 'sm:max-w-[840px] h-[650px] max-h-[90vh]'
                }`}
            >
                {renderContent(false)}
            </DialogContent>
        </Dialog>
    );
};

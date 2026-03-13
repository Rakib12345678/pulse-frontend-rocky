import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { useCoinsStore } from '../hooks/useCoinsStore';
import { CoinPackageGrid } from './CoinPackageGrid';
import { CheckoutView } from './CheckoutView';
import { ResultView } from './ResultView';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppBackground } from '@/components/internal/AppBackground';

export const AddCoinsModal = () => {
    const { isOpen, step, closeModal } = useCoinsStore();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
            <DialogContent
                showCloseButton={false}
                className="bg-transparent border border-white/10 rounded-3xl p-0 sm:max-w-[580px] h-full sm:h-auto max-h-[90vh] overflow-hidden shadow-2xl"
            >
                <AppBackground displayRings={false} className="h-full w-full rounded-none sm:rounded-3xl flex flex-col pt-8">
                    {/* Accessibility — hidden title */}
                    <DialogTitle className="sr-only">Add Coins</DialogTitle>
                    <DialogDescription className="sr-only">Purchase coins for PulseLive</DialogDescription>

                    {/* Close Button */}
                    <Button
                        variant="ghost"
                        onClick={closeModal}
                        className="absolute top-4 right-4 z-50 w-7 h-7 p-0 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4 text-white" />
                    </Button>

                    {/* Content */}
                    <div className="px-18 py-6 pt-0 flex-1 overflow-y-auto min-h-0">
                        {step === 'select' && <CoinPackageGrid />}
                        {step === 'checkout' && <CheckoutView />}
                        {step === 'result' && <ResultView />}
                    </div>
                </AppBackground>
            </DialogContent>
        </Dialog>
    );
};

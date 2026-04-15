import { useState } from 'react';
import { useCoinsStore } from '../hooks/useCoinsStore';
import { paymentService } from '../services/payment.service';
import coinIcon from '@/assets/coin.svg';
import { ArrowLeft, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CheckoutView = () => {
    const { selectedPackage, setStep } = useCoinsStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!selectedPackage) return null;

    const handlePay = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            const response = await paymentService.createCheckoutSession({
                coinId: Number(selectedPackage.id),
                successUrl: `${window.location.origin}/wallet/success`,
                cancelUrl: `${window.location.origin}/wallet/cancel`,
            });

            // The backend returns a checkoutUrl for Stripe Hosted Checkout
            if (response.checkoutUrl) {
                window.location.href = response.checkoutUrl;
            } else {
                throw new Error("No checkout URL returned from backend");
            }
        } catch (err) {
            console.error('Failed to create checkout session:', err);
            setError('Something went wrong. Please try again.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    onClick={() => setStep('select')}
                    disabled={isProcessing}
                    className="w-9 h-9 p-0 rounded-full bg-[#2D2D2D] flex items-center justify-center text-white hover:bg-[#3D3D3D] transition-colors cursor-pointer disabled:opacity-50"
                >
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-white text-xl font-bold">Checkout</h2>
            </div>

            {/* Selected Package Summary */}
            <div className="bg-[#1A1C1E] border border-white/10 rounded-2xl px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <img src={coinIcon} alt="coin" className="w-6 h-6" />
                    <span className="text-white font-bold text-xl">{selectedPackage.coins.toLocaleString()}</span>
                </div>
                <span className="text-white font-bold text-xl">₹ {selectedPackage.price.toLocaleString()}</span>
            </div>

            {/* Info */}
            <div className="bg-[#1A1C1E]/50 border border-white/5 rounded-2xl px-5 py-4">
                <p className="text-gray-400 text-sm leading-relaxed">
                    You will be redirected to Stripe's secure checkout to complete your payment. All major payment methods are supported.
                </p>
            </div>

            {/* Error */}
            {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Pay Button */}
            <Button
                onClick={handlePay}
                disabled={isProcessing}
                className="w-full h-auto bg-[#FF8800] text-white font-bold text-base py-4 rounded-full hover:bg-[#ff9922] transition-all cursor-pointer shadow-[0_0_20px_rgba(255,136,0,0.3)] disabled:opacity-75 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Redirecting to Stripe...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <span>Pay with Stripe</span>
                        <ExternalLink className="w-4 h-4" />
                    </div>
                )}
            </Button>
        </div>
    );
};

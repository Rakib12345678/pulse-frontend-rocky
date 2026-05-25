import { useState, useEffect, useRef } from 'react';
import { useCoinsStore } from '../hooks/useCoinsStore';
import { paymentService } from '../services/payment.service';
import coinIcon from '@/assets/coin.svg';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CheckoutView = () => {
    const { selectedPackage, setStep } = useCoinsStore();
    const [error, setError] = useState<string | null>(null);
    const hasFetched = useRef(false);

    useEffect(() => {
        const initCheckout = async () => {
            if (!selectedPackage || hasFetched.current) return;
            hasFetched.current = true;

            setError(null);
            try {
                const currentUrl = new URL(window.location.href);
                currentUrl.searchParams.delete('stripe_return');
                currentUrl.searchParams.delete('session_id');

                const successUrl = new URL(currentUrl.toString());
                successUrl.searchParams.set('stripe_return', 'success');

                const cancelUrl = new URL(currentUrl.toString());
                cancelUrl.searchParams.set('stripe_return', 'cancel');

                // Persist the package to restore it after redirect for "Add Coins Again" retry functionality
                localStorage.setItem('pulse_pending_coin_package', JSON.stringify(selectedPackage));

                const response = await paymentService.createCheckoutSession({
                    coinId: Number(selectedPackage.id),
                    successUrl: successUrl.toString(),
                    cancelUrl: cancelUrl.toString(),
                });

                if (response.checkoutUrl) {
                    window.location.href = response.checkoutUrl;
                } else {
                    setError("Backend did not provide a checkoutUrl to redirect to.");
                }
            } catch (err) {
                console.error('Failed to create checkout session:', err);
                setError('Failed to initialize payment. Please try again.');
            }
        };

        initCheckout();
    }, [selectedPackage]);

    if (!selectedPackage) return null;

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    onClick={() => setStep('select')}
                    className="w-9 h-9 p-0 rounded-full bg-[#2D2D2D] flex items-center justify-center text-white hover:bg-[#3D3D3D] transition-colors cursor-pointer"
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

            {error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-center">
                    <p className="text-red-400 text-sm mb-4">{error}</p>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="border-[#FF8800] text-[#FF8800] hover:bg-[#FF8800]/10"
                    >
                        Try Again
                    </Button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FF8800]" />
                    <p className="text-gray-400 text-sm">Redirecting to secure payment checkout...</p>
                </div>
            )}

            {/* Footer Info */}
            <div className="bg-[#1A1C1E]/50 border border-white/5 rounded-2xl px-5 py-4">
                <p className="text-white text-[15px] leading-relaxed text-center">
                    Your payment details are encrypted and secure with Stripe.
                    By continuing, you agree to Stripe's{" "}
                    <a
                        href="https://stripe.com/legal"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-white transition-colors"
                    >
                        Terms & Conditions
                    </a>{" "}
                    and{" "}
                    <a
                        href="https://stripe.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-white transition-colors"
                    >
                        Privacy Policy
                    </a>.
                </p>
            </div>
        </div>
    );
};

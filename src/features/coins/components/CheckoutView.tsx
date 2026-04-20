import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { useCoinsStore } from '../hooks/useCoinsStore';
import { paymentService } from '../services/payment.service';
import coinIcon from '@/assets/coin.svg';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/wallet/success`,
            },
        });

        if (error) {
            setErrorMessage(error.message ?? 'An unexpected error occurred.');
        }

        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <PaymentElement
                options={{
                    layout: {
                        type: 'accordion',
                        defaultCollapsed: false,
                        spacedAccordionItems: true,
                    },
                }}
            />

            {errorMessage && (
                <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    {errorMessage}
                </div>
            )}

            <Button
                type="submit"
                disabled={isProcessing || !stripe || !elements}
                className="w-full h-auto bg-[#FF8800] text-white font-bold text-base py-4 rounded-full hover:bg-[#ff9922] transition-all cursor-pointer shadow-[0_0_20px_rgba(255,136,0,0.3)] disabled:opacity-75 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                    </div>
                ) : (
                    "Pay Now"
                )}
            </Button>
        </form>
    );
};

export const CheckoutView = () => {
    const { selectedPackage, setStep } = useCoinsStore();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initCheckout = async () => {
            if (!selectedPackage) return;

            setLoading(true);
            setError(null);
            try {
                const response = await paymentService.createCheckoutSession({
                    coinId: Number(selectedPackage.id),
                    successUrl: `${window.location.origin}/wallet/success`,
                    cancelUrl: `${window.location.origin}/wallet/cancel`,
                });

                if (response.clientSecret) {
                    setClientSecret(response.clientSecret);
                } else {
                    setError("Backend did not provide a clientSecret for Payment Element.");
                }
            } catch (err) {
                console.error('Failed to create checkout session:', err);
                setError('Failed to initialize payment. Please try again.');
            } finally {
                setLoading(false);
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

            {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FF8800]" />
                    <p className="text-gray-400 text-sm">Initializing secure payment...</p>
                </div>
            ) : error ? (
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
            ) : clientSecret ? (
                <Elements
                    stripe={stripePromise}
                    options={{
                        clientSecret,
                        appearance: {
                            theme: 'night',
                            variables: {
                                colorPrimary: '#FF8800',
                                colorBackground: '#1A1C1E',
                                colorText: '#ffffff',
                                colorDanger: '#df1b41',
                                fontFamily: 'Ideal Sans, system-ui, sans-serif',
                                spacingUnit: '4px',
                                borderRadius: '12px',
                            },
                        }
                    }}
                >
                    <CheckoutForm />
                </Elements>
            ) : null}

            {/* Footer Info */}
            <div className="bg-[#1A1C1E]/50 border border-white/5 rounded-2xl px-5 py-4">
                <p className="text-gray-400 text-[12px] leading-relaxed text-center">
                    Your payment details are encrypted and secure with Stripe.
                    By continuing, you agree to our Terms of Service.
                </p>
            </div>
        </div>
    );
};

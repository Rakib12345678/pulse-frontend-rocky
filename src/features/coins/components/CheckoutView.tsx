import { useState } from 'react';
import { useCoinsStore } from '../hooks/useCoinsStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { paymentService } from '../services/payment.service';
import coinIcon from '@/assets/coin.svg';
import upiIcon from '@/assets/upi.svg';
import { ArrowLeft, CreditCard, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CheckoutView = () => {
    const { selectedPackage, paymentMethod, setPaymentMethod, setStep, setResultStatus } = useCoinsStore();
    const { updateUser } = useAuthStore();
    const [isProcessing, setIsProcessing] = useState(false);

    if (!selectedPackage) return null;

    const handlePay = async () => {
        setIsProcessing(true);
        try {
            // 1. Create Order API
            const { orderId, amount } = await paymentService.createOrder(Number(selectedPackage.id));

            // 2. Payment API
            await paymentService.processPayment({ orderId, amount });

            // 3. Fetch User Wallet API
            const { coinBalance } = await paymentService.getWalletBalance();

            // 4. Update Global State
            updateUser({ coins: coinBalance });

            // Success Transition
            setResultStatus('success');
            setStep('result');
        } catch (error) {
            console.error('Payment failed:', error);
            setResultStatus('failure');
            setStep('result');
        } finally {
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
                    <span className="bg-white text-black text-xs font-semibold px-2.5 py-1 rounded-md">
                        + {selectedPackage.bonus}
                    </span>
                </div>
                <span className="text-white font-bold text-xl">₹ {selectedPackage.price.toLocaleString()}</span>
            </div>

            {/* Payment Methods */}
            <div className="flex flex-col">
                {/* Add Card */}
                <Button
                    variant="ghost"
                    onClick={() => setPaymentMethod('card')}
                    disabled={isProcessing}
                    className="flex items-center justify-between px-4 py-5 border-b border-white/5 cursor-pointer hover:bg-white/2 transition-colors w-full h-auto rounded-none disabled:opacity-50"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#2D2D2D] flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="text-white text-base font-medium">Add Card</span>
                    </div>
                    <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'card'
                            ? 'bg-[#FF8800] border-[#FF8800]'
                            : 'border-gray-500 bg-transparent'
                            }`}
                    >
                        {paymentMethod === 'card' && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                </Button>

                {/* UPI */}
                <Button
                    variant="ghost"
                    onClick={() => setPaymentMethod('upi')}
                    disabled={isProcessing}
                    className="flex items-center justify-between px-4 py-5 cursor-pointer hover:bg-white/2 transition-colors w-full h-auto rounded-none disabled:opacity-50"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#2D2D2D] flex items-center justify-center">
                            <img src={upiIcon} alt="UPI" className="w-5 h-5" />
                        </div>
                        <span className="text-white text-base font-medium">UPI</span>
                    </div>
                    <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'upi'
                            ? 'bg-[#FF8800] border-[#FF8800]'
                            : 'border-gray-500 bg-transparent'
                            }`}
                    >
                        {paymentMethod === 'upi' && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                </Button>
            </div>

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
                        <span>Processing...</span>
                    </div>
                ) : (
                    'Pay'
                )}
            </Button>

            {/* Tax Disclaimer */}
            <p className="text-gray-500 text-xs text-center">
                Amount inclusive of regional taxes and fees: ₹{Math.round(selectedPackage.price * 1.18).toLocaleString()}
            </p>
        </div>
    );
};

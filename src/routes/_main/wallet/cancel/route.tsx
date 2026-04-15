import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { AppBackground } from '@/components/internal/AppBackground';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_main/wallet/cancel')({
  beforeLoad: async () => {
    if (typeof window === 'undefined' || !useAuthStore.getState().isHydrated) return;

    const { isAuthenticated, accessToken } = useAuthStore.getState();
    if (!isAuthenticated && !accessToken) {
      throw redirect({ to: '/for-you' });
    }
  },
  component: WalletCancelPage,
});

function WalletCancelPage() {
  const navigate = useNavigate();

  return (
    <AppBackground className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-6 text-center px-6 max-w-md">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-white text-2xl font-bold">Payment Cancelled</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          You cancelled the payment. No charges were made. You can try again anytime.
        </p>
        <Button
          onClick={() => navigate({ to: '/for-you' })}
          variant="outline"
          className="mt-4 px-10 py-3.5 h-auto rounded-full border-2 border-[#FF8800] bg-transparent text-[#FF8800] font-bold text-base hover:bg-[#FF8800]/10 transition-all cursor-pointer"
        >
          Go Home
        </Button>
      </div>
    </AppBackground>
  );
}

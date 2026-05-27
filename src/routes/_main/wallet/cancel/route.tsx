import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/stores/authStore'

export const Route = createFileRoute('/_main/wallet/cancel')({
  beforeLoad: async () => {
    if (typeof window === 'undefined' || !useAuthStore.getState().isHydrated) return;

    const { isAuthenticated, accessToken } = useAuthStore.getState();
    if (!isAuthenticated && !accessToken) {
      throw redirect({ to: '/for-you' });
    }
  },
})

import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { CoinsAdminManager } from '@/features/coins/components/CoinsAdminManager'

export const Route = createFileRoute('/_main/coins')({
    beforeLoad: async () => {
        // Skip server-side or unhydrated states; MainLayout handles the loading UI
        if (typeof window === 'undefined' || !useAuthStore.getState().isHydrated) return

        // If hydrated but not authenticated, redirect immediately
        const { isAuthenticated, accessToken } = useAuthStore.getState()
        if (!isAuthenticated && !accessToken) {
            throw redirect({ to: '/for-you' })
        }
    },
    component: () => (
        <div className="w-full min-h-screen bg-[#0d0a09]">
            <CoinsAdminManager />
        </div>
    )
})

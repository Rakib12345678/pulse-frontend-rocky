import { useAuthStore } from '@/features/auth/stores/authStore'
import { Chat } from '@/features/chat'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/chats')({
    beforeLoad: async () => {
        // Skip server-side or unhydrated states; MainLayout handles the loading UI
        if (typeof window === 'undefined' || !useAuthStore.getState().isHydrated) return

        // If hydrated but not authenticated, redirect immediately
        const { isAuthenticated, accessToken } = useAuthStore.getState()
        if (!isAuthenticated && !accessToken) {
            throw redirect({ to: '/for-you' })
        }
    },
    component: Chat

})
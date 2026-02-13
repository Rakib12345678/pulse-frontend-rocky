import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { useEffect } from 'react'
import ProfilePage from '@/features/profile';

export const Route = createFileRoute('/_main/profile')({
    beforeLoad: async () => {
        // Skip server-side or unhydrated states; MainLayout handles the loading UI
        if (typeof window === 'undefined' || !useAuthStore.getState().isHydrated) return

        // If hydrated but not authenticated, redirect immediately
        const { isAuthenticated, accessToken } = useAuthStore.getState()
        if (!isAuthenticated && !accessToken) {
            throw redirect({ to: '/for-you' })
        }
    },
    component: ProfilePage
})
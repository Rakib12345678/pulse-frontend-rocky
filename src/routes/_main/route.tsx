import { useEffect } from 'react'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { isPublicRoute } from '@/config/routes'
import { Navbar } from '@/components/layout/Navbar'
import { MobileFooter } from '@/components/layout/mobile-footer'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAuthStore } from '@/features/auth/stores/authStore'

export const Route = createFileRoute('/_main')({
    head: () => ({
        meta: [
            { title: 'PulseLive — Live Interaction' },
            {
                name: 'description',
                content: 'PulseLive is the ultimate platform for live interaction, connecting people in real-time.',
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            {
                property: 'og:title',
                content: 'PulseLive — Go Live & Connect',
            },
            {
                property: 'og:description',
                content: 'Engage with your audience like never before on PulseLive.',
            },
        ],
    }),
    beforeLoad: ({ location, context }) => {
        if (typeof window === 'undefined') {
            return
        }

        const storeState = useAuthStore.getState()
        const isAuthenticated = context.auth.isAuthenticated || storeState.isAuthenticated || !!storeState.accessToken

        if (!isAuthenticated && !isPublicRoute(location.pathname)) {
            throw redirect({
                to: '/',
            })
        }
    },
    component: MainLayout,
})

function MainLayout() {
    const { authenticate } = useAuth()
    const { accessToken, refreshToken } = useAuthStore()

    useEffect(() => {
        if (!accessToken && refreshToken) {
            authenticate({
                url: '/auth/refresh-token',
                payload: { refreshToken },
            })
        }
    }, [])

    return (
        <div className="flex min-h-screen flex-col bg-[#0f1117] text-white overflow-x-hidden">
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">
                <Outlet />
            </main>
            <MobileFooter />
        </div>
    )
}

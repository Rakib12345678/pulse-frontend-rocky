import { useEffect } from 'react'
import { Outlet, createFileRoute, useMatchRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/layout/Navbar'
import { MobileFooter } from '@/components/layout/mobile-footer'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { AppBackground } from '@/components/internal/AppBackground'

export const Route = createFileRoute('/_main')({
    head: () => ({
        meta: [
            { title: 'PulseLive — Live Interaction' },
            { name: 'description', content: 'PulseLive is the ultimate platform for live interaction.' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1' },
            { property: 'og:title', content: 'PulseLive — Go Live & Connect' },
            { property: 'og:description', content: 'Engage with your audience like never before on PulseLive.' },
        ],
    }),
    component: MainLayout,
})

function MainLayout() {
    const { authenticate } = useAuth()
    const { accessToken, refreshToken } = useAuthStore()
    const isHydrated = useAuthStore(s => s.isHydrated)

    // Detect if we're on the landing page (index route "/"")
    const matchRoute = useMatchRoute()
    const isLandingPage = !!matchRoute({ to: '/' })
    const isChatsPage = !!matchRoute({ to: '/chats', fuzzy: true })

    useEffect(() => {
        if (isHydrated && !accessToken && refreshToken) {
            authenticate({ url: '/auth/refresh-token', payload: { refreshToken }, redirect: false })
        }
    }, [isHydrated])

    if (!isHydrated) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0f1117] text-white overflow-hidden">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF8800]/30 border-t-[#FF8800]" />
            </div>
        )
    }
    const content = isLandingPage || isChatsPage
        ? <Outlet />                          // no AppBackground wrapper
        : (
            <AppBackground className="h-full">
                <Outlet />
            </AppBackground>
        )

    return (
        // <div className="h-screen flex flex-col overflow-hidden text-white">
        <div className="h-screen flex flex-col overflow-hidden">
            <Navbar />
            {/* <main className="flex-1 min-h-0 overflow-hidden"> */}
            <main className="flex-1 min-h-0 w-full overflow-y-auto flex flex-col">
                {content}
            </main>
            <MobileFooter />
        </div>
    )
}
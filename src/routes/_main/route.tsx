import { useEffect } from 'react'
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/layout/Navbar'
import { MobileFooter } from '@/components/layout/mobile-footer'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { AppBackground } from '@/components/internal/AppBackground'

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

    component: MainLayout,
})

function MainLayout() {
    const { authenticate } = useAuth()
    const { accessToken, refreshToken } = useAuthStore()

    // Check hydration
    const isHydrated = useAuthStore(s => s.isHydrated)

    // Debug logging
    useEffect(() => {
        console.log('MainLayout: Auth State', { isHydrated, accessToken: !!accessToken });
    }, [isHydrated, accessToken]);

    useEffect(() => {
        console.log('MainLayout: Checking auth', { accessToken: !!accessToken, refreshToken: !!refreshToken });
        if (isHydrated && !accessToken && refreshToken) {
            console.log('MainLayout: Refreshing token...');
            authenticate({
                url: '/auth/refresh-token',
                payload: { refreshToken },
                redirect: false
            })
        }
    }, [isHydrated])

    if (!isHydrated) {
        return <div className="flex h-screen w-full items-center justify-center bg-[#0f1117] text-white">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF8800]/30 border-t-[#FF8800]"></div>
            </div>
        </div>
    }

    return (
        <div className="flex min-h-screen flex-col text-white overflow-x-hidden">
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">
                <AppBackground>
                     <Outlet />
                </AppBackground>
            </main>
            <MobileFooter />
        </div>
    )
}

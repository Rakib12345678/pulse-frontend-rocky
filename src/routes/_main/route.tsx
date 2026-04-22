import { useEffect } from 'react'
import { Outlet, createFileRoute, useMatchRoute, useNavigate, useLocation } from '@tanstack/react-router'
import { Navbar } from '@/components/layout/Navbar'
import { MobileFooter } from '@/components/layout/mobile-footer'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { AppBackground } from '@/components/internal/AppBackground'
import { isPublicRoute } from '@/config/routes'
import { useCoinsStore } from '@/features/coins/hooks/useCoinsStore';

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
    const { accessToken, refreshToken, isAuthenticated } = useAuthStore()
    const isHydrated = useAuthStore(s => s.isHydrated)
    const navigate = useNavigate()
    const location = useLocation()

    // Detect if we're on the landing page (index route "/"")
    const matchRoute = useMatchRoute()
    const isLandingPage = !!matchRoute({ to: '/' })
    const isChatsPage = !!matchRoute({ to: '/chats', fuzzy: true })

    useEffect(() => {
        if (isHydrated && !accessToken && refreshToken) {
            authenticate({ url: '/auth/refresh-token', payload: { refreshToken }, redirect: false })
        }
    }, [isHydrated])

    // Client-side auth guard: after hydration, redirect unauthenticated users
    // away from protected routes. This covers the SSR gap where beforeLoad
    // cannot check localStorage.
    useEffect(() => {
        if (isHydrated && !isAuthenticated && !isPublicRoute(location.pathname)) {
            navigate({ to: '/for-you', replace: true })
        }
    }, [isHydrated, isAuthenticated, location.pathname])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        let stripeReturn = params.get('stripe_return');
        // Fallback to manual parsing if we have bad query strings e.g. "?xyz=123?abc=456"
        if (!stripeReturn) {
            const m = window.location.search.match(/stripe_return=([^&?]+)/);
            if (m) stripeReturn = m[1];
        }

        let sessionId = params.get('session_id');
        if (!sessionId) {
            const m = window.location.search.match(/session_id=([^&?]+)/);
            if (m) sessionId = m[1];
        }

        if (stripeReturn && sessionId) {
            // Remove the query parameters to prevent re-triggering
            const url = new URL(window.location.href);
            url.searchParams.delete('stripe_return');
            url.searchParams.delete('session_id');
            // If the query string was malformed, we can also manually chop it from string
            let cleanUrl = url.toString();
            cleanUrl = cleanUrl.replace(/(\?|&)stripe_return=[^&]+/, '');
            cleanUrl = cleanUrl.replace(/(\?|&)session_id=[^&]+/, '');
            cleanUrl = cleanUrl.replace(/\?$/, ''); // clean trailing ?

            window.history.replaceState({}, document.title, cleanUrl);

            useCoinsStore.getState().handleStripeRedirect(sessionId, stripeReturn);
        }
    }, []);

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
        <div className="h-screen flex flex-col overflow-hidden">
            <Navbar />
            <main className="flex-1 min-h-0 w-full overflow-y-auto flex flex-col">
                {content}
            </main>
            <MobileFooter />
        </div>
    )
}
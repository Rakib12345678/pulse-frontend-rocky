import { Suspense, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { useAuthStore } from '@/features/auth/stores/authStore'
import { LandingPageServer } from '@/features/landing/components/LandingPage.server'
import { LandingRailShell } from '@/features/landing/components/Landing.shell'
import { LandingRailFallback } from '@/features/landing/components/LandingPage.fallback'
import { LandingRailClient } from '@/features/landing/components/LandingPageNew'

export const Route = createFileRoute('/_main/')({
    component: LandingRoute,
})

function LandingRoute() {
    const isHydrated = useAuthStore((s) => s.isHydrated)
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const navigate = useNavigate()

    // Redirect logged-in users away from the landing page
    useEffect(() => {
        if (isHydrated && isAuthenticated) {
            navigate({ to: '/for-you', replace: true })
        }
    }, [isHydrated, isAuthenticated, navigate])

    // Don't render the landing page while redirecting
    if (isHydrated && isAuthenticated) {
        return null
    }

    return (
        <LandingPageServer>
            {/* The Rail Shell is passed as children to the Server Component */}
            <LandingRailShell>
                <Suspense fallback={<LandingRailFallback />}>
                    <LandingRailClient />
                </Suspense>
            </LandingRailShell>
        </LandingPageServer>
    )
}

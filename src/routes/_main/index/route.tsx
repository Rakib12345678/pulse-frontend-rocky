import { Suspense } from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { LandingPageServer } from '@/features/landing/components/LandingPage.server'
import { LandingRailShell } from '@/features/landing/components/Landing.shell'
import { LandingRailFallback } from '@/features/landing/components/LandingPage.fallback'
import { LandingRailClient } from '@/features/landing/components/LandingPageNew'

export const Route = createFileRoute('/_main/')({
    component: LandingRoute,
})

function LandingRoute() {
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
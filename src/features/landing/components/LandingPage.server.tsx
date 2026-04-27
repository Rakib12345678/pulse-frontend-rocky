import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useSignUpStore } from '@/features/auth/stores/signUpStore'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { useNavigate } from '@tanstack/react-router'
import '../styles/landing.css'

// Helper component for background (moved from LandingPage.tsx)
const BackgroundDecor = () => (
    <div className="pointer-events-none absolute left-1/2 top-0 z-0 -translate-x-1/2 opacity-50">
        <div className="absolute left-1/2 top-[400px] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        <div className="absolute left-1/2 top-[400px] h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
        <div className="absolute left-1/2 top-[400px] h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
    </div>
)

interface LandingPageServerProps {
    children: React.ReactNode
}

export function LandingPageServer({ children }: LandingPageServerProps) {
    const openSignUp = useSignUpStore((s) => s.openModal)
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const navigate = useNavigate()

    const handleInteractNow = () => {
        if (isAuthenticated) {
            navigate({ to: '/for-you' })
        } else {
            openSignUp()
        }
    }

    return (
        // overflow-y-auto   = vertical scroll works normally when content is tall
        <div
            className="relative h-full w-full overflow-x-hidden overflow-y-auto bg-[#0f1117] font-sans text-white selection:bg-pink-500/30 [&::-webkit-scrollbar]:hidden"
            style={{ overscrollBehavior: 'contain' }}
        >
            <BackgroundDecor />

            {/* Background Orbits */}
            <div className="pointer-events-none absolute left-1/2 top-0 z-0 -translate-x-1/2 opacity-20">
                {[
                    { size: 600, duration: 20 },
                    { size: 900, duration: 35, reverse: true },
                    { size: 1200, duration: 50 },
                ].map((orbit) => (
                    <div
                        key={orbit.size}
                        className="orbit-container"
                        style={{
                            width: orbit.size,
                            height: orbit.size,
                            animationDuration: `${orbit.duration}s`,
                            animationName: (orbit as any).reverse ? 'orbit-rotate-reverse' : 'orbit-rotate',
                        }}
                    >
                        <div className={`orbit-trail ${(orbit as any).reverse ? 'orbit-trail-reverse' : 'orbit-trail-normal'}`} />
                        <div className="planet" />
                    </div>
                ))}
            </div>

            {/* HERO */}
            <div className="relative z-10 flex flex-col items-center px-4 pt-12 pb-10 text-center">
                <h1 className="mb-6 max-w-4xl text-5xl font-extrabold tracking-tight sm:text-7xl leading-[1.1]">
                    The Ultimate Platform for <br />
                    <span className="bg-linear-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
                        Live Interaction
                    </span>
                </h1>

                <p className="mb-10 max-w-2xl text-lg text-gray-400 leading-relaxed">
                    Host, stream, and connect in real time with clear video, instant chat, and seamless engagement tools designed for modern experiences.
                </p>

                <Button
                    onClick={handleInteractNow}
                    size="lg"
                    className="h-14 rounded-full bg-linear-to-r from-indigo-600 to-pink-600 px-10 text-base font-bold text-white shadow-[0_0_20px_rgba(219,39,119,0.3)] transition-all hover:from-indigo-600 hover:to-pink-600 dark:hover:from-indigo-600 dark:hover:to-pink-600"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Interact Now
                </Button>
            </div>

            {/* DYNAMIC RAIL CONTENT (Passed as children) */}
            <div className="relative z-10 w-full overflow-hidden pb-20">
                {children}
            </div>
        </div>
    )
}
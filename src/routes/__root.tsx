import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  redirect,
} from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"
import { Suspense, lazy } from "react"
import type { useAuthStore } from "@/features/auth/stores/authStore"

import { Toaster } from "@/components/ui/sonner"
import { SignUpModal } from "@/features/auth/components/SignUpModal"
import { GoLiveModal } from "@/features/live/components/GoLiveModal"
import { RejoinStreamBanner } from "@/features/live/components/RejoinStreamBanner"

import appCss from "../styles.css?url"
import { Button } from "@/components/ui/button"
import { GoogleOAuthProvider } from "@react-oauth/google"

export interface RouterContext {
  queryClient: QueryClient
  authStore: typeof useAuthStore
}

const DevtoolsLazy =
  import.meta.env.DEV
    ? lazy(() => import("@/components/Devtools.client"))
    : null

import { isPublicRoute } from "@/config/routes"

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
  beforeLoad: async ({ location, context }) => {
    // If we are on the server (SSR), skip auth checks completely because 
    // we use localStorage which isn't available. The client will handle it.
    if (typeof window === 'undefined') {
      return
    }

    // We must wait for the auth store to hydrate from local storage on the client
    // before we make any routing decisions, to avoid false redirects.
    const state = context.authStore.getState()
    if (!state.isHydrated) {
      await new Promise<void>((resolve) => {
        const unsub = context.authStore.subscribe((s) => {
          if (s.isHydrated) {
            unsub()
            resolve()
          }
        })
      })
    }

    const publicRoute = isPublicRoute(location.pathname)
    const { isAuthenticated } = context.authStore.getState()

    // We redirect to home ("/for-you") if they are trying to access a protected route
    // while unauthenticated.
    if (!publicRoute && !isAuthenticated) {
      throw redirect({
        to: '/for-you',
        search: {
          redirect: location.href,
        },
      })
    }

    // If user IS authenticated and trying to access a public-only route (like a login page if we had one),
    // we would redirect them to their dashboard/home, but the user requested:
    // "a non auth user will be redirected and an auth user will not be"
  }
})

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-visual"
        />
        {/* iOS Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pulse Live" />
        <meta name="theme-color" content="#0f1117" />
        <meta name="format-detection" content="telephone=no" />
        {/* <meta name="referrer" content="no-referrer" /> */}
        <title>Pulse Live</title>

        <HeadContent />
        <link rel="stylesheet" href={appCss} />
      </head>

      <body className="min-h-screen bg-[#0f1117] text-foreground overscroll-none" style={{ WebkitTextSizeAdjust: '100%', WebkitTapHighlightColor: 'transparent', touchAction: 'pan-x pan-y' }}>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
          <Outlet />
          <Toaster />
          <SignUpModal />
          <GoLiveModal />
          <RejoinStreamBanner />
        </GoogleOAuthProvider>



        {/* Devtools oNly in development */}
        {DevtoolsLazy && (
          <Suspense fallback={null}>
            <DevtoolsLazy />
          </Suspense>
        )}

        <Scripts />
      </body>
    </html>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center text-md bg-linear-to-r from-pink-300 to-orange-300">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-5xl font-bold">404</h1>
        <p className="text-2xl">Page not found</p>
        <Button className="" onClick={() => history.back()}>Go Back</Button>
      </div>
    </div>
  )
}

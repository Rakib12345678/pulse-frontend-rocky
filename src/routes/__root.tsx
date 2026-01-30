import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"
import type { QueryClient } from "@tanstack/react-query"
import { Suspense, lazy } from "react"

import { Toaster } from "@/components/ui/sonner"
import { SignUpModal } from "@/features/auth/components/SignUpModal"
import { LoginModal } from "@/features/auth/components/LoginModal"

import appCss from "../styles.css?url"
import { Button } from "@/components/ui/button"
import { GoogleOAuthProvider } from "@react-oauth/google"

export interface RouterContext {
  queryClient: QueryClient
  auth: {
    isAuthenticated: boolean
  }
}

const DevtoolsLazy =
  import.meta.env.DEV
    ? lazy(() => import("@/components/Devtools.client"))
    : null

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
})

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <title>Pulse Live</title>

        <HeadContent />
        <link rel="stylesheet" href={appCss} />
      </head>

      <body className="min-h-screen bg-background text-foreground">
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}>
          <Outlet />
          <Toaster />
          <SignUpModal />
          <LoginModal />
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

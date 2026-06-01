import { useEffect, useRef } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { useSignUpStore } from '@/features/auth/stores/signUpStore'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface CallbackSearchParams {
  accessToken?: string
  refreshToken?: string
  newUser?: string
  code?: string
}

export const Route = createFileRoute('/auth/google/callback')({
  validateSearch: (search: Record<string, unknown>): CallbackSearchParams => {
    return {
      accessToken: search.accessToken as string | undefined,
      refreshToken: search.refreshToken as string | undefined,
      newUser: search.newUser as string | undefined,
      code: search.code as string | undefined,
    }
  },
  component: AuthCallbackComponent,
})

function AuthCallbackComponent() {
  const { accessToken: initialAccessToken, refreshToken: initialRefreshToken, newUser: initialNewUser, code } = Route.useSearch()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const setShowSuspendedModal = useAuthStore((s) => s.setShowSuspendedModal)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setSignUpStep = useSignUpStore((s) => s.setStep)
  const openSignUp = useSignUpStore((s) => s.openModal)
  const closeSignUp = useSignUpStore((s) => s.closeModal)

  const processedRef = useRef(false)

  useEffect(() => {
    if (processedRef.current) return
    processedRef.current = true

    const handleCallback = async () => {
      let accessToken = initialAccessToken;
      let refreshToken = initialRefreshToken;
      let newUserStr = initialNewUser;

      try {
        if (code) {
          // Exchange Google OAuth code for backend tokens
          const payload = {
            code,
            redirectUri: `${window.location.origin}/auth/google/callback`
          };
          const res = await api.post('/auth/google', payload);
          accessToken = res.data.accessToken;
          refreshToken = res.data.refreshToken;
          newUserStr = res.data.newUser ? 'true' : 'false';
        }

        if (!accessToken || !refreshToken) {
          toast.error('Authentication failed. Missing tokens.')
          navigate({ to: '/for-you' })
          return
        }

        // 1. Temporarily set tokens in store so the api interceptor can use them
        // We pass a dummy user/wallet first, then overwrite with real data
        setAuth({
          accessToken,
          refreshToken,
          user: {} as any,
          wallet: { coinBalance: 0, diamondBalance: 0 },
          newUser: newUserStr === 'true',
        })

        // 2. Fetch the actual user profile
        const { data: user } = await api.get('/users/me')

        if (user.status === 'SUSPENDED') {
          setShowSuspendedModal(true)
          clearAuth()
          return
        }

        // 3. Fetch wallet balance
        let wallet = { coinBalance: 0, diamondBalance: 0 }
        try {
          const { data: walletData } = await api.get('/wallet/balance')
          wallet = walletData
        } catch (err) {
          console.warn('Failed to fetch wallet balance in callback:', err)
        }

        // 4. Save complete auth state
        setAuth({
          accessToken,
          refreshToken,
          user,
          wallet,
          newUser: newUserStr === 'true',
        })

        const onboardingState = user.onboardingState

        if (onboardingState && onboardingState !== 'COMPLETED') {
          // User has a pending onboarding step — route them to the correct step.
          if (onboardingState === 'EIGHTEEN_PLUS_UPDATE') {
            setSignUpStep('age')
          } else if (onboardingState === 'PROFILE_DETAILS') {
            setSignUpStep('details')
          } else if (onboardingState === 'INTEREST_UPDATE') {
            setSignUpStep('interests')
          }
          openSignUp()
        } else {
          // Onboarding complete — close modal and navigate to stashed return path or /for-you
          closeSignUp()
          const returnPath = sessionStorage.getItem('postAuthRedirect')
          sessionStorage.removeItem('postAuthRedirect')

          toast.success('Welcome back!')
          if (returnPath && returnPath !== '/auth/google/callback') {
            navigate({ to: returnPath })
          } else {
            navigate({ to: '/for-you' })
          }
        }
      } catch (error: any) {
        console.error('Auth callback error:', error)
        clearAuth()
        const msg = error.response?.data?.message || 'Authentication failed. Please try again.'
        toast.error(msg)
        navigate({ to: '/for-you' })
      }
    }

    handleCallback()
  }, [initialAccessToken, initialRefreshToken, initialNewUser, code, setAuth, setShowSuspendedModal, clearAuth, setSignUpStep, openSignUp, closeSignUp, navigate])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f1117] text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#FF7700]" />
        <p className="text-lg font-medium text-gray-300">Completing Verification...</p>
      </div>
    </div>
  )
}
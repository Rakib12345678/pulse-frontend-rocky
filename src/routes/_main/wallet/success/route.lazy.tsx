import { useEffect, useState } from 'react'
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/stores/authStore'
import { paymentService, type SessionStatusResponse } from '@/features/coins/services/payment.service'
import { AppBackground } from '@/components/internal/AppBackground'
import coinIcon from '@/assets/coin.svg'
import { Loader2, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const Route = createLazyFileRoute('/_main/wallet/success')({
  component: WalletSuccessPage,
})

function WalletSuccessPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { updateWallet } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'failed' | 'expired'>('loading')
  const [sessionData, setSessionData] = useState<SessionStatusResponse | null>(null)

  useEffect(() => {
    const checkStatus = async () => {
      const params = new URLSearchParams(window.location.search)
      const sessionId = params.get('session_id')

      if (!sessionId) {
        setStatus('failed')
        return
      }

      try {
        const res = await paymentService.getSessionStatus(sessionId)
        setSessionData(res)

        // Normalize backend status to our UI states
        const backendStatus = res.status?.toUpperCase()

        if (backendStatus === 'SUCCESS' || backendStatus === 'SUCCEEDED' || backendStatus === 'COMPLETE') {
          setStatus('success')
          // Refresh wallet balance
          try {
            const wallet = await paymentService.getWalletBalance()
            updateWallet(wallet)
            queryClient.invalidateQueries({ queryKey: ['walletBalance'] })
          } catch (err) {
            console.error('Failed to refresh wallet:', err)
          }
        } else if (backendStatus === 'PENDING' || backendStatus === 'PROCESSING' || backendStatus === 'REQUIRES_ACTION') {
          setStatus('pending')
        } else if (backendStatus === 'EXPIRED') {
          setStatus('expired')
        } else {
          setStatus('failed')
        }
      } catch (error) {
        console.error('Failed to check session status:', error)
        setStatus('failed')
      }
    }

    checkStatus()
  }, [])

  return (
    <AppBackground className="h-full flex items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-6 text-center px-6 max-w-md">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-[#FF8800]" />
            <h2 className="text-white text-2xl font-bold">Verifying Payment...</h2>
            <p className="text-gray-400 text-sm">Please wait while we confirm your payment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-white text-3xl font-bold italic">Congratulations!</h2>
            {sessionData && sessionData.coins > 0 && (
              <div className="bg-[#2D2D2D] rounded-xl px-5 py-3 flex items-center gap-2.5">
                <img src={coinIcon} alt="coin" className="w-6 h-6" />
                <span className="text-white font-bold text-xl">{sessionData.coins.toLocaleString()}</span>
              </div>
            )}
            <p className="text-gray-300 text-base">Coins added successfully!</p>
            <Button
              onClick={() => navigate({ to: '/for-you' })}
              variant="outline"
              className="mt-4 px-10 py-3.5 h-auto rounded-full border-2 border-[#FF8800] bg-transparent text-[#FF8800] font-bold text-base hover:bg-[#FF8800]/10 transition-all cursor-pointer"
            >
              Explore Stream
            </Button>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
            <h2 className="text-white text-2xl font-bold">Payment Processing</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your payment is being processed. Coins will be added to your wallet shortly. You can check your balance later.
            </p>
            <Button
              onClick={() => navigate({ to: '/for-you' })}
              className="mt-4 px-10 py-3.5 h-auto rounded-full border-2 border-[#FF8800] bg-transparent text-[#FF8800] font-bold text-base hover:bg-[#FF8800]/10 transition-all cursor-pointer"
            >
              Go Home
            </Button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-white text-2xl font-bold">Payment Failed</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Something went wrong with your payment. No coins were charged. Please try again.
            </p>
            <a href="mailto:support@pulselive.com" className="text-gray-400 text-sm hover:text-white transition-colors">
              support@pulselive.com
            </a>
            <Button
              onClick={() => navigate({ to: '/for-you' })}
              variant="outline"
              className="mt-2 px-10 py-3.5 h-auto rounded-full border-2 border-[#FF8800] bg-transparent text-[#FF8800] font-bold text-base hover:bg-[#FF8800]/10 transition-all cursor-pointer"
            >
              Go Home
            </Button>
          </>
        )}

        {status === 'expired' && (
          <>
            <div className="w-20 h-20 rounded-full bg-gray-500/20 flex items-center justify-center">
              <Clock className="w-10 h-10 text-gray-500" />
            </div>
            <h2 className="text-white text-2xl font-bold">Session Expired</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Your checkout session has expired. Please try purchasing again.
            </p>
            <Button
              onClick={() => navigate({ to: '/for-you' })}
              variant="outline"
              className="mt-2 px-10 py-3.5 h-auto rounded-full border-2 border-[#FF8800] bg-transparent text-[#FF8800] font-bold text-base hover:bg-[#FF8800]/10 transition-all cursor-pointer"
            >
              Go Home
            </Button>
          </>
        )}
      </div>
    </AppBackground>
  )
}

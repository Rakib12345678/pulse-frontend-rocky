import { createLazyFileRoute } from '@tanstack/react-router'
import { CoinWallet } from '@/features/setting/components/CoinWallet'

export const Route = createLazyFileRoute('/_main/profile/setting/coins')({
  component: CoinWallet,
})

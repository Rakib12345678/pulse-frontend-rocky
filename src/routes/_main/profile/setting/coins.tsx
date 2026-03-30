import { CoinWallet } from '@/features/setting/components/CoinWallet'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/profile/setting/coins')({
  component: CoinWallet,
})

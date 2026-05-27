import { createLazyFileRoute } from '@tanstack/react-router'
import { GetMoney } from '@/features/setting/components/GetMoney'

export const Route = createLazyFileRoute('/_main/profile/setting/diamonds')({
  component: GetMoney,
})

import { GetMoney } from '@/features/setting/components/GetMoney'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/profile/setting/diamonds')({
  component: GetMoney,
})

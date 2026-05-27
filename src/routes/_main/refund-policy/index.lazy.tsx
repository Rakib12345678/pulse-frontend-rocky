import { createLazyFileRoute } from '@tanstack/react-router'
import RefundPolicyPage from '@/features/legal/components/RefundPolicyPage'

export const Route = createLazyFileRoute('/_main/refund-policy/')({
  component: RefundPolicyPage,
})

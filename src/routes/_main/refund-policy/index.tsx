import { createFileRoute } from '@tanstack/react-router'
import RefundPolicyPage from '@/features/legal/components/RefundPolicyPage';

export const Route = createFileRoute('/_main/refund-policy/')({
  component: RefundPolicyPage,
})

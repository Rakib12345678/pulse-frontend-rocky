import { createLazyFileRoute } from '@tanstack/react-router'
import PrivacyPolicyPage from '@/features/legal/components/PrivacyPolicyPage'

export const Route = createLazyFileRoute('/_main/privacy-policy/')({
  component: PrivacyPolicyPage,
})

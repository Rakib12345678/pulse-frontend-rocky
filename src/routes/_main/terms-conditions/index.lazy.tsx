import { createLazyFileRoute } from '@tanstack/react-router'
import TermsConditionsPage from '@/features/legal/components/TermsConditionsPage'

export const Route = createLazyFileRoute('/_main/terms-conditions/')({
  component: TermsConditionsPage,
})

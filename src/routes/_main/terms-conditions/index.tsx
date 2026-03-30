import { createFileRoute } from '@tanstack/react-router'
import TermsConditionsPage from '@/features/legal/components/TermsConditionsPage';

export const Route = createFileRoute('/_main/terms-conditions/')({
  component: TermsConditionsPage,
})

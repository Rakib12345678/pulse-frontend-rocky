import { createFileRoute } from '@tanstack/react-router'
import PrivacyPolicyPage from '@/features/legal/components/PrivacyPolicyPage';

export const Route = createFileRoute('/_main/privacy-policy/')({
    component: PrivacyPolicyPage,
})

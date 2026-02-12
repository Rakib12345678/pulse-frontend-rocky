import { createFileRoute } from '@tanstack/react-router'
import { ForYouPage } from '@/features/for-you/components/ForYouPage'

export const Route = createFileRoute('/_main/for-you')({
    component: ForYouPage,
})
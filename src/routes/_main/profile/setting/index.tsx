import { Settings } from '@/features/setting'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/profile/setting/')({
  component: Settings,
})

import { createLazyFileRoute } from '@tanstack/react-router'
import { Settings } from '@/features/setting'

export const Route = createLazyFileRoute('/_main/profile/setting/')({
  component: Settings,
})

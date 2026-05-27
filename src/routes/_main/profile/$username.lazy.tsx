import { createLazyFileRoute } from '@tanstack/react-router'
import ProfilePage from '@/features/profile'

export const Route = createLazyFileRoute('/_main/profile/$username')({
  component: ProfilePage,
})

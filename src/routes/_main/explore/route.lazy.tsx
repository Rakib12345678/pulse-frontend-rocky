import { createLazyFileRoute } from '@tanstack/react-router'
import { ExplorePage } from '@/features/explore/components/ExplorePage'

export const Route = createLazyFileRoute('/_main/explore')({
  component: () => <ExplorePage />,
})

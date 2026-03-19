import { createFileRoute } from '@tanstack/react-router'
import { GiftsAdminManager } from '@/features/gifts/components/GiftsAdminManager'

export const Route = createFileRoute('/_main/gifts')({
  component: RouteComponent,
})

function RouteComponent() {
  return <GiftsAdminManager />
}

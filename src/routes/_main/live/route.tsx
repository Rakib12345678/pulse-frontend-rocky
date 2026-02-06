import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/live')({
    component: () => <div className="p-8">Live Stream Page Placeholder</div>
})

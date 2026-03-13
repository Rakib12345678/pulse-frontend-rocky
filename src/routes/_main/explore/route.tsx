import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/explore')({
    component: () => <div className="p-8">Explore Page Placeholder</div>
})

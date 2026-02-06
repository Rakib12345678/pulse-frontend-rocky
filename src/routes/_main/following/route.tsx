import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/following')({
    component: () => <div className="p-8">Following Page Placeholder</div>
})

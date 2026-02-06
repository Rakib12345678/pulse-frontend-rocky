import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/profile')({
    component: () => <div className="p-8">Profile Page Placeholder</div>
})

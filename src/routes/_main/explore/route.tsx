import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/explore')({
    beforeLoad: () => {
        throw redirect({
            to: '/for-you',
        })
    },
    component: () => <div className="p-8">Explore Page Placeholder</div>
})

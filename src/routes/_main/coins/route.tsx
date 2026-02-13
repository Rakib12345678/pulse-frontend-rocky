import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/coins')({
    beforeLoad: () => {
        throw redirect({
            to: '/for-you',
        })
    },
    component: () => <div className="p-8">Coins Page Placeholder</div>
})

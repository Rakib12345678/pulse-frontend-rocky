import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/chats')({
    beforeLoad: () => {
        throw redirect({
            to: '/for-you',
        })
    },
    component: () => <div className="p-8">Chats Page Placeholder</div>
})

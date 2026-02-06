import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/chats')({
    component: () => <div className="p-8">Chats Page Placeholder</div>
})

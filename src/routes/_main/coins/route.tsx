import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/coins')({
    component: () => <div className="p-8">Coins Page Placeholder</div>
})

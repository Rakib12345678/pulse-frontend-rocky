import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/for-you')({
    component: HomePage,
})

function HomePage() {

    return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] gap-8">
            <h1 className="text-4xl font-bold text-white">For You</h1>
        </div>
    )
}
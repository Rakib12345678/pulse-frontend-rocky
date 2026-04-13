import { Outlet, createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/stream')({
    component: () => <Outlet />,
    notFoundComponent: () => <Navigate to="/for-you" />,
})

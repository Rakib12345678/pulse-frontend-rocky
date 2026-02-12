import { Outlet, createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/live')({
    component: () => <Outlet />,
    notFoundComponent: () => <Navigate to="/for-you" />,
})

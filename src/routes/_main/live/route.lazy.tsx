import { Outlet, createLazyFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_main/live')({
  component: () => <Outlet />,
  notFoundComponent: () => <Navigate to="/for-you" />,
})

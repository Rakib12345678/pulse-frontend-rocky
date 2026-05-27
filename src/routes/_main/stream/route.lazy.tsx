import { Outlet, createLazyFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_main/stream')({
  component: () => <Outlet />,
  notFoundComponent: () => <Navigate to="/for-you" />,
})

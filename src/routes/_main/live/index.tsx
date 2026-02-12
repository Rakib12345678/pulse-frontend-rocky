import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_main/live/')({
  beforeLoad: () => {
    throw redirect({
      to: '/for-you',
    })
  },
})

import { createLazyFileRoute } from '@tanstack/react-router'
import { Chat } from '@/features/chat'

export const Route = createLazyFileRoute('/_main/chats')({
  component: Chat,
})

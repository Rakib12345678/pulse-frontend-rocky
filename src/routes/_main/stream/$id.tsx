import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const recordingSearchSchema = z.object({
  mobileVideoUrl: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  cohosts: z.string().optional().nullable(),
})

export const Route = createFileRoute('/_main/stream/$id')({
  validateSearch: (search) => recordingSearchSchema.parse(search),
})

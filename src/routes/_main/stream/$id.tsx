import { createFileRoute } from '@tanstack/react-router'
import { RecordingLayout } from '@/features/live/components/layout/RecordingLayout'
import { RecordedVideoPlayer } from '@/features/live/components/layout/RecordedVideoPlayer'
import { RecordedStreamHeader } from '@/features/live/components/layout/RecordedStreamHeader'
import { z } from 'zod'
import { liveService, FeedStreamItem } from '@/features/live/services/live.service'
import { useEffect, useState } from 'react'

const recordingSearchSchema = z.object({
  recordingUrl: z.string().optional().nullable(),
})

export const Route = createFileRoute('/_main/stream/$id')({
  component: RecordingPlaybackComponent,
  validateSearch: (search) => recordingSearchSchema.parse(search),
})

function RecordingPlaybackContent() {
  return (
    <>
      <RecordedVideoPlayer />
    </>
  )
}

function RecordingPlaybackComponent() {
  const { id } = Route.useParams()
  const { recordingUrl: searchUrl } = Route.useSearch()
  const [metadata, setMetadata] = useState<Partial<FeedStreamItem>>({})

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await liveService.getStreamByCallId(id)
        setMetadata(data)
      } catch (err) {
        console.error('Failed to fetch stream metadata:', err)
      }
    }
    fetchMetadata()
  }, [id])

  const finalRecordingUrl = searchUrl || metadata.recordingUrl || undefined;

  return (
    <RecordingLayout
      recordingUrl={finalRecordingUrl}
      recordingMetadata={{
        username: metadata.username || undefined,
        title: metadata.title || undefined,
        category: metadata.category || undefined,
        cohosts: metadata.cohosts,
        participantCount: metadata.participantCount
      }}
    >
      <RecordingPlaybackContent />
    </RecordingLayout>
  )
}

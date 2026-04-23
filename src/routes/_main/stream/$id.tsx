import { createFileRoute } from '@tanstack/react-router'
import { RecordingLayout } from '@/features/live/components/layout/RecordingLayout'
import { RecordedVideoPlayer } from '@/features/live/components/layout/RecordedVideoPlayer'
import { RecordedStreamHeader } from '@/features/live/components/layout/RecordedStreamHeader'
import { z } from 'zod'
import { liveService, FeedStreamItem } from '@/features/live/services/live.service'
import { useEffect, useState, useMemo } from 'react'
import api from '@/lib/api'

const recordingSearchSchema = z.object({
  recordingUrl: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  cohosts: z.string().optional().nullable(),
})

export const Route = createFileRoute('/_main/stream/$id')({
  component: RecordingPlaybackComponent,
  validateSearch: (search) => recordingSearchSchema.parse(search),
})

function RecordingPlaybackContent() {
  return (
    <>
      <RecordedStreamHeader />
      <RecordedVideoPlayer />
    </>
  )
}

function RecordingPlaybackComponent() {
  const { id } = Route.useParams()
  const {
    recordingUrl: searchUrl,
    username: searchUsername,
    title: searchTitle,
    category: searchCategory,
    cohosts: searchCohosts
  } = Route.useSearch()

  const [metadata, setMetadata] = useState<Partial<FeedStreamItem>>({})

  const parsedCohosts = useMemo(() => {
    if (!searchCohosts) return undefined;
    try {
      return JSON.parse(searchCohosts);
    } catch (e) {
      console.error('Failed to parse cohosts from search params:', e);
      return undefined;
    }
  }, [searchCohosts]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        console.log('[Recording] Fetching metadata for ID:', id);
        const data = await liveService.getStreamByCallId(id)
        console.log('[Recording] Received metadata:', data);

        // Fallback: If username is missing but creator ID exists, fetch the user profile
        if (!data.username && data.createdByUserId) {
          try {
            console.log('[Recording] Username missing, fetching profile for creator:', data.createdByUserId);
            const userResponse = await api.get(`/users/${data.createdByUserId}`);
            if (userResponse.data?.username) {
              data.username = userResponse.data.username;
              console.log('[Recording] Resolved username:', data.username);
            }
          } catch (profileErr) {
            console.error('[Recording] Failed to resolve host username:', profileErr);
          }
        }

        setMetadata(data)
      } catch (err) {
        console.error('[Recording] Failed to fetch stream metadata:', err)
      }
    }
    fetchMetadata()
  }, [id])

  const finalRecordingUrl = searchUrl || metadata.recordingUrl || undefined;

  return (
    <RecordingLayout
      recordingUrl={finalRecordingUrl}
      recordingMetadata={{
        username: searchUsername || metadata.username || undefined,
        title: searchTitle || metadata.title || undefined,
        category: searchCategory || metadata.category || undefined,
        cohosts: parsedCohosts || metadata.cohosts,
        participantCount: metadata.participantCount
      }}
    >
      <RecordingPlaybackContent />
    </RecordingLayout>
  )
}

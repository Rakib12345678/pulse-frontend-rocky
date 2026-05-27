import { createLazyFileRoute, getRouteApi } from '@tanstack/react-router'
import { LiveStreamLayout, useLiveStreamContext } from '@/features/live/components/layout/LiveStreamLayout'
import { LiveStreamHeader } from '@/features/live/components/layout/LiveStreamHeader'
import { LiveStreamVideoPlayer } from '@/features/live/components/layout/LiveStreamVideoPlayer'
import { LiveStreamChat } from '@/features/live/components/layout/LiveStreamChat'
import { LiveStreamControls } from '@/features/live/components/layout/LiveStreamControls'
import { JoinRequestPopup, JoinDeclineBanner, ViewerPendingRequestPopup } from '@/features/live/components/overlay/JoinRequestPopup'

const routeApi = getRouteApi('/_main/live/$id')

export const Route = createLazyFileRoute('/_main/live/$id')({
  component: LiveStreamComponent,
})

// Inner component that can use the context
function LiveStreamContent() {
  const { isViewer } = useLiveStreamContext()

  return (
    <>
      <LiveStreamHeader />
      <LiveStreamVideoPlayer />
      {/* Host: show join request popup (listens for GetStream permission_request events) */}
      {!isViewer && <JoinRequestPopup />}
      {/* Viewer: show pending popup and decline notification */}
      {isViewer && (
        <>
          <ViewerPendingRequestPopup />
          <JoinDeclineBanner />
        </>
      )}
      <LiveStreamChat />
      <LiveStreamControls isViewer={isViewer} />
    </>
  )
}

function LiveStreamComponent() {
  const { id } = routeApi.useParams()

  return (
    <LiveStreamLayout callId={id}>
      <LiveStreamContent />
    </LiveStreamLayout>
  )
}

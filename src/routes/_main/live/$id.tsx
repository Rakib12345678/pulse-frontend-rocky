import { createFileRoute, useBlocker } from '@tanstack/react-router'
import { LiveStreamLayout, useLiveStreamContext } from '@/features/live/components/LiveStreamLayout'
import { LiveStreamHeader } from '@/features/live/components/LiveStreamHeader'
import { LiveStreamVideoPlayer } from '@/features/live/components/LiveStreamVideoPlayer'
import { LiveStreamChat } from '@/features/live/components/LiveStreamChat'
import { LiveStreamControls } from '@/features/live/components/LiveStreamControls'
import { useGoLiveStore } from '@/features/live/stores/goLiveStore'
import { JoinRequestPopup, JoinDeclineBanner, ViewerPendingRequestPopup } from '@/features/live/components/JoinRequestPopup'
import { useEffect } from 'react'
import { liveService } from '@/features/live/services/live.service'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_main/live/$id')({
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
  const { id } = Route.useParams()
  const { closeModal } = useGoLiveStore()

  // Block in-app navigation with a custom confirmation dialog (only for hosts)
  // Skip the blocker when the host intentionally ends the stream
  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => {
      const { streamData, isEndingStream } = useGoLiveStore.getState();
      return !!streamData && !isEndingStream;
    },
    withResolver: true,
  })

  // Close go-live modal if user is on this page
  useEffect(() => {
    closeModal()
  }, [closeModal])

  /** End stream properly before leaving via blocker */
  const handleLeaveConfirm = async () => {
    const { streamData, setEndingStream } = useGoLiveStore.getState();
    if (streamData) {
      try {
        await liveService.endLiveStream(streamData.callId);
      } catch (e) {
        console.error('Failed to end stream on leave:', e);
      }
      setEndingStream(true);
    }
    proceed?.();
  };

  return (
    <>
      <LiveStreamLayout callId={id}>
        <LiveStreamContent />
      </LiveStreamLayout>

      {/* Custom leave confirmation dialog for host*/}
      <Dialog open={status === 'blocked'} onOpenChange={(open) => { if (!open) reset?.() }}>
        <DialogContent showCloseButton={false} className="bg-[#1a1d27] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-lg">Leave Live Stream?</DialogTitle>
            <DialogDescription className="text-white/60">
              You are currently in a live stream. Are you sure you want to leave the stream?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => reset?.()}
              className="flex-1 text-black border-white/20"
            >
              Stay
            </Button>
            <Button
              onClick={handleLeaveConfirm}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              Leave Stream
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

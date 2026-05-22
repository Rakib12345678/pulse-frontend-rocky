export function initMediaPatch() {
  if (typeof window !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
    try {
      if ((window as any).activeMediaTracks) {
        // Already initialized
        return;
      }
      (window as any).activeMediaTracks = new Set<MediaStreamTrack>();
      (window as any).pulseBlockMedia = false;
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        const stream = await originalGetUserMedia(constraints);
        
        // If we are currently in teardown phase, instantly kill the acquired tracks
        if ((window as any).pulseBlockMedia) {
            stream.getTracks().forEach(t => t.stop());
            return stream;
        }

        stream.getTracks().forEach(t => {
          (window as any).activeMediaTracks.add(t);
          t.addEventListener('ended', () => (window as any).activeMediaTracks.delete(t));
        });
        return stream;
      };

      if (typeof MediaStreamTrack !== 'undefined' && MediaStreamTrack.prototype?.clone) {
        const originalClone = MediaStreamTrack.prototype.clone;
        MediaStreamTrack.prototype.clone = function() {
          const clonedTrack = originalClone.apply(this, arguments as any);
          (window as any).activeMediaTracks.add(clonedTrack);
          clonedTrack.addEventListener('ended', () => (window as any).activeMediaTracks.delete(clonedTrack));
          return clonedTrack;
        };
      }

      if (typeof MediaStream !== 'undefined' && MediaStream.prototype?.addTrack) {
        const originalAddTrack = MediaStream.prototype.addTrack;
        MediaStream.prototype.addTrack = function(track: MediaStreamTrack) {
          (window as any).activeMediaTracks.add(track);
          track.addEventListener('ended', () => (window as any).activeMediaTracks.delete(track));
          return originalAddTrack.apply(this, arguments as any);
        };
      }

      (window as any).killAllMedia = () => {
        if ((window as any).activeMediaTracks) {
          (window as any).activeMediaTracks.forEach((t: MediaStreamTrack) => {
            try { t.stop(); } catch (e) {}
          });
          (window as any).activeMediaTracks.clear();
        }
      };
    } catch (e) {
      console.warn('[media-patch] failed to apply patches:', e);
    }
  }
}
import type { Call } from '@stream-io/video-react-sdk';

/**
 * Tears down all media and audio contexts associated with a Stream Video SDK Call.
 * Centralizes the cleanup logic that was duplicated across LiveStreamLayout (unmount),
 * LiveStreamHeader.handleLeaveStream (viewer), and LiveStreamHeader.handleEndLiveChoice (host).
 */
export const teardownCallMedia = async (call: Call) => {
    try {
        const mic = call.microphone as any;
        if (typeof mic.noAudioDetectorCleanup === 'function') await mic.noAudioDetectorCleanup();
        if (typeof mic.soundDetectorCleanup === 'function') await mic.soundDetectorCleanup();
    } catch (e) {
        console.warn('Failed to clean up audio detectors', e);
    }

    // Stop speaking-while-muted detection (would call getUserMedia)
    await call.microphone.disableSpeakingWhileMutedNotification().catch(() => { });

    // Stop all existing hardware tracks from every SDK source
    try {
        (call.camera.state as any).mediaStream?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    } catch { /* ignore */ }
    try {
        (call.microphone.state as any).mediaStream?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    } catch { /* ignore */ }

    const localParticipant = call.state.localParticipant;
    if (localParticipant) {
        localParticipant.videoStream?.getTracks().forEach(t => t.stop());
        localParticipant.audioStream?.getTracks().forEach(t => t.stop());
    }

    // Ultimate global fallback: kill ALL browser media tracks
    (window as any).killAllMedia?.();

    // Soft disable to let the SDK update its internal state without crashing future streams
    await call.camera.disable().catch(() => { });
    await call.microphone.disable().catch(() => { });
};
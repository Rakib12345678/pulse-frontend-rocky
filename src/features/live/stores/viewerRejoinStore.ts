import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ViewerRejoinData {
    callId: string;
    /** Streamer's display name — fullName if available, otherwise username */
    streamerName: string;
    /** Streamer's profile image URL (optional) */
    streamerImage?: string | null;
}

interface ViewerRejoinState {
    rejoinData: ViewerRejoinData | null;
    setRejoinData: (data: ViewerRejoinData) => void;
    clearRejoinData: () => void;
}

export const useViewerRejoinStore = create<ViewerRejoinState>()(
    persist(
        (set) => ({
            rejoinData: null,
            setRejoinData: (data) => set({ rejoinData: data }),
            clearRejoinData: () => set({ rejoinData: null }),
        }),
        {
            name: 'pulse_viewer_rejoin',
        }
    )
);

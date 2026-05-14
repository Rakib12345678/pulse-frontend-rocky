import { create } from 'zustand';

const getPersistedStreamData = (): { callId: string; callType: string; token: string } | null => {
    try {
        const stored = sessionStorage.getItem("pulse_host_stream");
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
};

export type Category =
    | 'Lifestyle'
    | 'Blogging'
    | 'Coding'
    | 'Dancing'
    | 'Cooking'
    | 'Speaking'
    | 'Science & Tech'
    | 'Others';

interface GoLiveState {
    isOpen: boolean;
    // Stream Configuration
    streamTitle: string;
    selectedCategory: Category | null;
    // Camera/Mic State
    isCameraEnabled: boolean;
    isMicEnabled: boolean;
    // Stream status
    isLoading: boolean;
    // Stream session data
    streamData: {
        callId: string;
        callType: string;
        token: string;
    } | null;
    isEndingStream: boolean;
    showConflict: boolean;
    conflictStream: any | null;
    isRejoinBannerDismissed: boolean;
    isRejoining: boolean;

    openModal: () => Promise<void>;
    closeModal: (reset?: boolean) => void;
    setShowConflict: (show: boolean) => void;
    setConflictStream: (stream: any | null) => void;
    setIsRejoining: (rejoining: boolean) => void;
    dismissRejoin: () => void;
    openRejoinSetup: (stream: any) => void;
    setStreamTitle: (title: string) => void;
    setCategory: (category: Category | null) => void;
    toggleCamera: () => void;
    toggleMic: () => void;
    setLoading: (loading: boolean) => void;
    setStreamData: (data: { callId: string; callType: string; token: string } | null) => void;
    setEndingStream: (ending: boolean) => void;
    reset: () => void;
}

export const useGoLiveStore = create<GoLiveState>((set, get) => ({
    isOpen: false,
    streamTitle: '',
    selectedCategory: null,
    isCameraEnabled: true,
    isMicEnabled: true,
    isLoading: false,
    streamData: getPersistedStreamData(),
    isEndingStream: false,
    showConflict: false,
    conflictStream: null,
    isRejoinBannerDismissed: false,
    isRejoining: false,

    openModal: async () => {
        set({ isRejoinBannerDismissed: true, isOpen: true, isLoading: true, isRejoining: false, isEndingStream: false });

        try {
            const { userService } = await import('../services/user.service');

            // FIX: If the user closed the modal while the API call was in-flight,
            // bail out instead of writing conflict state into a closed modal.
            if (!get().isOpen) return;

            const status = await userService.getUserStream();

            // FIX: Second guard — isOpen may have changed during the await above.
            if (!get().isOpen) return;

            if (status.isLive) {
                set({ conflictStream: status, showConflict: true, isLoading: false });
            } else {
                set({ isLoading: false });
            }
        } catch (err) {
            console.error("Failed to check for ongoing stream:", err);
            // FIX: Only clear the loading state if the modal is still open.
            if (get().isOpen) {
                set({ isLoading: false });
            }
        }
    },
    closeModal: (shouldReset = false) => {
        if (shouldReset) {
            get().reset();
        }
        set({
            isOpen: false,
            showConflict: false,
            conflictStream: null,
            isRejoining: false,
            isRejoinBannerDismissed: false
        });
    },
    setShowConflict: (show) => set({ showConflict: show }),
    setConflictStream: (stream) => set({ conflictStream: stream }),
    setIsRejoining: (rejoining) => set({ isRejoining: rejoining }),
    dismissRejoin: () => set({ isRejoinBannerDismissed: true }),
    openRejoinSetup: (stream) => set({
        isOpen: true,
        isRejoining: true,
        showConflict: false,
        conflictStream: stream,
        streamTitle: stream.title || '',
        selectedCategory: stream.category || null,
    }),
    setStreamTitle: (title) => set({ streamTitle: title }),
    setCategory: (category) => set({ selectedCategory: category }),
    toggleCamera: () => set((state) => ({ isCameraEnabled: !state.isCameraEnabled })),
    toggleMic: () => set((state) => ({ isMicEnabled: !state.isMicEnabled })),
    setLoading: (loading) => set({ isLoading: loading }),
    setStreamData: (data) => {
        if (data) {
            sessionStorage.setItem("pulse_host_stream", JSON.stringify(data));
            localStorage.removeItem("pulse_host_left_at");
        } else {
            sessionStorage.removeItem("pulse_host_stream");
        }
        set({ streamData: data });
    },
    setEndingStream: (ending) => set({ isEndingStream: ending }),

    reset: () => {
        sessionStorage.removeItem("pulse_host_stream");
        localStorage.removeItem("pulse_host_left_at");
        set({
            streamTitle: '',
            selectedCategory: null,
            isCameraEnabled: true,
            isMicEnabled: true,
            isLoading: false,
            streamData: null,
            showConflict: false,
            conflictStream: null,
            isRejoinBannerDismissed: false,
            isRejoining: false,
        });
    },
}));

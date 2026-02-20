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
    // Flag to bypass navigation blocker when host ends stream
    isEndingStream: boolean;

    // Actions
    openModal: () => void;
    closeModal: () => void;
    setStreamTitle: (title: string) => void;
    setCategory: (category: Category | null) => void;
    toggleCamera: () => void;
    toggleMic: () => void;
    setLoading: (loading: boolean) => void;
    setStreamData: (data: { callId: string; callType: string; token: string } | null) => void;
    setEndingStream: (ending: boolean) => void;
    reset: () => void;
}

export const useGoLiveStore = create<GoLiveState>((set) => ({
    isOpen: false,
    streamTitle: '',
    selectedCategory: null,
    isCameraEnabled: true,
    isMicEnabled: true,
    isLoading: false,
    streamData: getPersistedStreamData(),
    isEndingStream: false,

    openModal: () => set({ isOpen: true }),
    closeModal: () => set({ isOpen: false }),
    setStreamTitle: (title) => set({ streamTitle: title }),
    setCategory: (category) => set({ selectedCategory: category }),
    toggleCamera: () => set((state) => ({ isCameraEnabled: !state.isCameraEnabled })),
    toggleMic: () => set((state) => ({ isMicEnabled: !state.isMicEnabled })),
    setLoading: (loading) => set({ isLoading: loading }),
    setStreamData: (data) => {
        if (data) {
            sessionStorage.setItem("pulse_host_stream", JSON.stringify(data));
        } else {
            sessionStorage.removeItem("pulse_host_stream");
        }
        set({ streamData: data });
    },
    setEndingStream: (ending) => set({ isEndingStream: ending }),

    reset: () => {
        sessionStorage.removeItem("pulse_host_stream");
        set({
            streamTitle: '',
            selectedCategory: null,
            isCameraEnabled: true,
            isMicEnabled: true,
            isLoading: false,
            streamData: null,
            isEndingStream: false
        });
    },
}));

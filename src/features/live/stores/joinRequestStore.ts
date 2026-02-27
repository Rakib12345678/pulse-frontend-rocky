import { create } from 'zustand';

export interface JoinRequest {
    id: string;
    sessionId: string;
    userId: string;
    userName: string;
    userImage?: string;
    timestamp: number;
}

interface JoinRequestState {
    // Pending join requests (for host view)
    pendingRequests: JoinRequest[];
    
    // Current user's request status (for viewer view)
    hasRequestedToJoin: boolean;
    requestStatus: 'idle' | 'pending' | 'approved' | 'declined';
    
    // Decline notification message (for viewer view)
    declineMessage: string | null;
    
    // Actions for host
    addRequest: (request: JoinRequest) => void;
    removeRequest: (id: string) => void;
    clearRequests: () => void;
    
    // Actions for viewer
    setHasRequestedToJoin: (value: boolean) => void;
    setRequestStatus: (status: 'idle' | 'pending' | 'approved' | 'declined') => void;
    setDeclineMessage: (message: string) => void;
    clearDeclineMessage: () => void;
    
    // Reset
    reset: () => void;
}

export const useJoinRequestStore = create<JoinRequestState>((set) => ({
    pendingRequests: [],
    hasRequestedToJoin: false,
    requestStatus: 'idle',
    declineMessage: null,
    
    addRequest: (request) => set((state) => ({
        pendingRequests: [...state.pendingRequests, request]
    })),
    
    removeRequest: (id) => set((state) => ({
        pendingRequests: state.pendingRequests.filter((r) => r.id !== id)
    })),
    
    clearRequests: () => set({ pendingRequests: [] }),
    
    setHasRequestedToJoin: (value) => set({ hasRequestedToJoin: value }),
    
    setRequestStatus: (status) => set({ requestStatus: status }),
    
    setDeclineMessage: (message) => set({ declineMessage: message }),
    
    clearDeclineMessage: () => set({ declineMessage: null }),
    
    reset: () => set({
        pendingRequests: [],
        hasRequestedToJoin: false,
        requestStatus: 'idle',
        declineMessage: null,
    })
}));

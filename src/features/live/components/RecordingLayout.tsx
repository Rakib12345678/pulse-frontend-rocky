import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfileModal } from './UserProfileModal';
import { useAuthStore } from '@/features/auth/stores/authStore';

// Context for sharing recording state
interface RecordingContextValue {
    isViewer: boolean;
    isGuest: boolean;
    isChatVisible: boolean;
    setChatVisible: (visible: boolean) => void;
    isRecording: boolean;
    recordingMetadata: {
        username?: string;
        title?: string;
        category?: string;
        recordingUrl?: string;
    }
}

const RecordingContext = createContext<RecordingContextValue>({
    isViewer: true,
    isGuest: false,
    isChatVisible: true,
    setChatVisible: () => { },
    isRecording: true,
    recordingMetadata: {}
});

export const useRecordingContext = () => useContext(RecordingContext);

interface RecordingLayoutProps {
    children: React.ReactNode;
    recordingUrl?: string;
    recordingMetadata?: {
        username?: string;
        title?: string;
        category?: string;
    }
}

export const RecordingLayout: React.FC<RecordingLayoutProps> = ({
    children,
    recordingUrl,
    recordingMetadata
}) => {
    const { user } = useAuthStore();
    const [isChatVisible, setChatVisible] = useState(true);

    // Lock body scroll while active
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <RecordingContext.Provider value={{
            isViewer: true,
            isGuest: !user,
            isChatVisible,
            setChatVisible,
            isRecording: true,
            recordingMetadata: { ...recordingMetadata, recordingUrl }
        }}>
            <div className="fixed inset-0 pt-18 w-full bg-[#0f1117] text-white overflow-hidden flex flex-col recording-mode">
                <div className="flex-1 min-h-0 relative">
                    {children}
                </div>
                <UserProfileModal />
            </div>
        </RecordingContext.Provider>
    );
};

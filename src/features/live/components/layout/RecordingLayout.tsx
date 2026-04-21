import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfileModal } from '@/features/live/components/modals/UserProfileModal';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

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
        cohosts?: { username: string; profileImage: string; status: string }[];
        participantCount?: number;
    };
    currentTime: number;
    setCurrentTime: (time: number) => void;
    duration: number;
    setDuration: (duration: number) => void;
    isPlaying: boolean;
    setIsPlaying: (isPlaying: boolean) => void;
}

const RecordingContext = createContext<RecordingContextValue>({
    isViewer: true,
    isGuest: false,
    isChatVisible: true,
    setChatVisible: () => { },
    isRecording: true,
    recordingMetadata: {},
    currentTime: 0,
    setCurrentTime: () => { },
    duration: 0,
    setDuration: () => { },
    isPlaying: false,
    setIsPlaying: () => { }
});

export const useRecordingContext = () => useContext(RecordingContext);

interface RecordingLayoutProps {
    children: React.ReactNode;
    recordingUrl?: string;
    recordingMetadata?: {
        username?: string;
        title?: string;
        category?: string;
        cohosts?: { username: string; profileImage: string; status: string }[];
        participantCount?: number;
    }
}

export const RecordingLayout: React.FC<RecordingLayoutProps> = ({
    children,
    recordingUrl,
    recordingMetadata
}) => {
    const { user } = useAuthStore();
    const [isChatVisible, setChatVisible] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

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
            recordingMetadata: { ...recordingMetadata, recordingUrl },
            currentTime,
            setCurrentTime,
            duration,
            setDuration,
            isPlaying,
            setIsPlaying
        }}>
            <div className="relative w-full h-[calc(100vh-72px)] bg-black overflow-hidden">
                {children}
                <UserProfileModal />
            </div>
        </RecordingContext.Provider>
    );
};

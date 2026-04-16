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

    const navigate = useNavigate();
    const handleBack = () => {
        navigate({ to: '/profile' });
    };

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
            <div className="fixed inset-0 w-full h-full bg-black overflow-hidden z-[9999]">
                {/* Fixed Back Button at Top Level */}
                <div className="fixed top-24 left-8 z-[10000]">
                    <button
                        onClick={handleBack}
                        className="bg-[#FF8800] hover:bg-[#FF8800]/90 text-black font-bold px-6 py-2 rounded-full h-11 shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Back
                    </button>
                </div>

                {children}
                <UserProfileModal />
            </div>
        </RecordingContext.Provider>
    );
};

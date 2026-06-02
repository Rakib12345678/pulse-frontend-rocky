import { createContext, useContext } from 'react';
import { Call } from '@stream-io/video-react-sdk';

export interface LiveStreamContextValue {
    isViewer: boolean;
    isGuest: boolean;
    call: Call | null;
    isChatVisible: boolean;
    setChatVisible: (visible: boolean) => void;
    isGiftingOpen: boolean;
    setIsGiftingOpen: (open: boolean) => void;
    streamEnded: boolean;
    setStreamEnded: (ended: boolean) => void;
}

export const LiveStreamContext = createContext<LiveStreamContextValue>({
    isViewer: false,
    isGuest: false,
    call: null,
    isChatVisible: true,
    setChatVisible: () => { },
    isGiftingOpen: false,
    setIsGiftingOpen: () => { },
    streamEnded: false,
    setStreamEnded: () => { },
});

export const useLiveStreamContext = () => useContext(LiveStreamContext);

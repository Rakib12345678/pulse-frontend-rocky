import React from 'react';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoLiveStore } from '@/features/live/stores/goLiveStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';

export const GoLiveButton: React.FC = () => {
    const { openModal: openGoLiveModal } = useGoLiveStore();
    const { user } = useAuthStore();
    const { openModal: openSignUpModal, setStep, setOnAgeVerified, setMode } = useSignUpStore();

    const handleGoLiveClick = () => {
        if (!user) {
            setMode('login');
            setStep('input');
            openSignUpModal();
            return;
        }

        if (user && !user.eighteenPlus) {
            setStep('age');
            setOnAgeVerified(() => {
                openGoLiveModal();
            });
            openSignUpModal();
        } else {
            openGoLiveModal();
        }
    };

    return (
        <div className="mb-10 md:mb-0 fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <Button
                onClick={handleGoLiveClick}
                className="whitespace-nowrap px-8 py-6 rounded-full bg-[#FF8800] text-black text-lg font-bold hover:bg-[#ff9922] transition-all shadow-[0_0_30px_rgba(255,136,0,0.5)] cursor-pointer hover:text-black active:scale-95 flex items-center gap-2"
            >
                <Video className="h-6 w-6" />
                Go Live
            </Button>
        </div>
    );
};

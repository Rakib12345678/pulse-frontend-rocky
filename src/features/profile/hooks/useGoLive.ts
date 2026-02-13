import { useGoLiveStore } from '@/features/live/stores/goLiveStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';

export const useGoLive = () => {
  const { openModal: openGoLiveModal } = useGoLiveStore();
  const { user: authUser } = useAuthStore();
  const { openModal: openSignUpModal, setStep, setOnAgeVerified, setMode } = useSignUpStore();

  const handleGoLive = () => {
    if (!authUser) {
      setMode('login');
      setStep('input');
      openSignUpModal();
      return;
    }

    if (!authUser.eighteenPlus) {
      setStep('age');
      setOnAgeVerified(() => {
        openGoLiveModal();
      });
      openSignUpModal();
    } else {
      openGoLiveModal();
    }
  };

  return handleGoLive;
};
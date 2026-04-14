import { useAuthStore } from '@/features/auth/stores/authStore';
import { AuthModalBackdrop } from '@/features/auth/components/AuthModalBackdrop';
import { StepDetails } from '@/features/auth/components/SignUpModal';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const EditProfile = ({ isOpen, onClose }: EditProfileModalProps) => {
    const user = useAuthStore((s) => s.user);

    if (!isOpen || !user) return null;

    return (
        <AuthModalBackdrop onClose={onClose} size="large">
            <StepDetails
                mode="edit"
                initialValues={{
                    username: user.username ?? '',
                    identifier: user.email ?? user.phone ?? '',
                    fullName: user.fullName ?? '',
                    location: user.location ?? '',
                    bio: user.bio ?? '',
                    profileImage: user.profileImage ?? '',
                    isDefaultImage: user.isDefaultImage ?? true,
                }}
                onSuccess={onClose}
                onCancel={onClose}
            />
        </AuthModalBackdrop>
    );
};
import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useCurrentUser, useUserByUsername } from '@/features/profile/services/profile.service';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { ProfileMediaSection } from '@/features/profile/components/ProfileMediaSection';
import type { ProfileRouteParams } from '@/features/profile/services/profile.types';
import { EmptyState } from './components/EmptyState';
import { LogIn, UserX } from 'lucide-react';
import { useGoLive } from '@/features/profile/hooks/useGoLive';

interface ProfilePageProps {
  forcedUsername?: string;
}

export const ProfilePage = ({ forcedUsername }: ProfilePageProps = {}) => {
  const params = useParams({ strict: false }) as ProfileRouteParams;
  const [activeTab, setActiveTab] = useState<'moments' | 'pastLive'>('moments');

  const usernameFromUrl = forcedUsername || params.username;
  const handleGoLive = useGoLive();

  const {
    data: currentUser,
    isLoading: isCurrentUserLoading,
  } = useCurrentUser();

  const isOwnProfile =
    !usernameFromUrl ||
    usernameFromUrl === currentUser?.username;

  const {
    data: profileUser,
    isLoading: isProfileLoading,
    error,
  } = useUserByUsername(isOwnProfile ? undefined : usernameFromUrl);

  if (isCurrentUserLoading) {
    return (
      <div className="h-[calc(100vh-73px)] bg-black flex items-center justify-center overflow-hidden">
        <div className="w-12 h-12 border-4 border-[#FF7700] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-[calc(100vh-73px)] bg-black flex items-center justify-center overflow-hidden">
        <EmptyState
          icon={LogIn}
          title="You're not logged in"
          description="Please Login First to see your following details."
          actionLabel="Login"
          onAction={() => window.location.href = '/login'}
        />
      </div>
    );
  }

  if (!isOwnProfile && isProfileLoading) {
    return (
      <div className="h-[calc(100vh-73px)] bg-black flex items-center justify-center overflow-hidden">
        <div className="w-12 h-12 border-4 border-[#FF7700] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isOwnProfile && (error || !profileUser)) {
    return (
      <div className="h-[calc(100vh-73px)] bg-black flex items-center justify-center overflow-hidden">
        <EmptyState
          icon={UserX}
          title="User not found"
          description="The profile you're looking for doesn't exist or may have been removed."
          actionLabel="Home"
          onAction={() => window.location.href = '/'}
        />
      </div>
    );
  }

  const displayUser = isOwnProfile ? currentUser : profileUser!;
  const displayName =
    displayUser.displayName ||
    displayUser.fullName ||
    displayUser.username ||
    'User';

  return (
    <div className="bg-transparent h-[calc(100vh-73px)] overflow-y-auto scrollbar-hide">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-5 lg:py-8">
        <ProfileHeader
          user={displayUser}
          isOwnProfile={isOwnProfile}
        />

        <ProfileMediaSection
          userId={displayUser.id}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOwnProfile={isOwnProfile}
          userName={displayName}
          onGoLive={handleGoLive}
        />
      </div>
    </div>
  );
};

export default ProfilePage;
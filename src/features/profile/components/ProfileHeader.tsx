import { useState } from 'react';
import { MapPin, MoreHorizontal } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useToggleFollow, useUserLiveStatus, useBlockUser } from '@/features/profile/services/profile.service';
import type { User } from '@/features/profile/services/profile.types';
import cameraLogo from "@/assets/Camera.png"
import { toast } from 'sonner';
import { useGoLive } from '@/features/profile/hooks/useGoLive';
import { EditProfile } from '@/features/profile/components/EditProfile';
import { useSubmitReport } from '@/features/report/services/report.service';
import { BlockUserModal, ErrorModal, ReportSuccessModal } from '@/components/internal/ConfirmModal';
import { ReportUserModal } from '@/components/internal/ReasonModal';
import { SuccessModal } from '@/features/setting/components/SuccessModal';
import { FollowersFollowingModal } from '@/features/profile/components/FollowersFollowingModal';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
}

export const ProfileHeader = ({ user, isOwnProfile }: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showBlockSuccess, setShowBlockSuccess] = useState(false);
  const [showBlockError, setShowBlockError] = useState(false);
  const [blockErrorMessage, setBlockErrorMessage] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportSuccess, setShowReportSuccess] = useState(false);
  const [followModal, setFollowModal] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({
    isOpen: false,
    type: 'followers',
  });

  const { mutate: toggleFollow, isPending } = useToggleFollow();
  const { mutate: toggleBlock, isPending: isBlockPending } = useBlockUser();
  const { mutate: submitReport, isPending: isReportPending } = useSubmitReport();
  const handleGoLiveClick = useGoLive();

  const { data: liveStatus } = useUserLiveStatus(
    !isOwnProfile ? (user.username ?? undefined) : undefined,
    !isOwnProfile,
  );

  const isLive = !isOwnProfile && liveStatus?.isLive === true;
  const isBlocked = user.blockedByMe ?? false;


  const stats = [
    { label: 'Post', value: user.postCount ?? 0 },
    { label: 'Followers', value: (user.followerCount ?? 0).toLocaleString() },
    { label: 'Following', value: user.followingCount ?? 0 },
  ];

  const handleFollowClick = () => {
    toggleFollow({
      targetUserId: user.id,
      followedByMe: user.followedByMe ?? false,
    });
  };

  // Block / Unblock
  const handleBlockConfirm = () => {
    toggleBlock(
      { targetUserId: user.id, blockedByMe: isBlocked },
      {
        onSuccess: () => {
          setShowBlockModal(false);
          setActionMenuOpen(false);
          setShowBlockSuccess(true);
          if (!isBlocked) {
            navigate({ to: '/profile' });
          }
        },
        onError: (error: any) => {
          const message =
            error?.response?.data?.message ||
            (isBlocked ? 'Failed to unblock user' : 'Failed to block user');
          setBlockErrorMessage(message);
          setShowBlockModal(false);
          setShowBlockError(true);
        },
      }
    );
  };

  // Report
  const handleReportConfirm = (reasonId: string, otherText?: string) => {
    submitReport(
      {
        reportedUserId: user.id,
        contentType: 'USER_PROFILE',
        contentId: String(user.id),
        reason: reasonId,
        note: otherText,
      },
      {
        onSuccess: () => {
          setShowReportModal(false);
          setActionMenuOpen(false);
          setShowReportSuccess(true);
        },
        onError: () => {
          toast.error('Failed to submit report');
        },
      }
    );
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/profile/${user.username}`;
      await navigator.clipboard.writeText(url);
      toast.success("Profile link copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy profile link");
    }
  };

  const openFollowModal = (type: 'followers' | 'following') => {
    setFollowModal({ isOpen: true, type });
  };

  return (
    <>
      <EditProfile
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
      />

      {/* Block / Unblock modal */}
      <BlockUserModal
        isOpen={showBlockModal}
        username={user.username ?? ''}
        avatarUrl={user.profileImage}
        isBlocked={isBlocked}
        isLoading={isBlockPending}
        onConfirm={handleBlockConfirm}
        onCancel={() => setShowBlockModal(false)}
      />

      {/* Block success modal */}
      <SuccessModal
        isOpen={showBlockSuccess}
        title={isBlocked ? `Unblocked @${user.username ?? ''}` : `Blocked @${user.username ?? ''}`}
        description={isBlocked ? `${user.username ?? ''} was unblocked successfully.` : `${user.username ?? ''} was blocked successfully.`}
        buttonLabel="Done"
        onAction={() => setShowBlockSuccess(false)}
      />

      {/* Block error modal */}
      <ErrorModal
        isOpen={showBlockError}
        message={blockErrorMessage}
        onClose={() => setShowBlockError(false)}
      />

      {/* Report success modal */}
      <ReportSuccessModal
        isOpen={showReportSuccess}
        username={user.username ?? ''}
        avatarUrl={user.profileImage}
        isBlocked={isBlocked}
        isBlockPending={isBlockPending}
        onBlock={() => {
          setShowReportSuccess(false);
          setShowBlockModal(true);
        }}
        onMute={() => {
          toast.info('Mute feature coming soon');
        }}
        onDone={() => setShowReportSuccess(false)}
      />

      {/* Report modal */}
      <ReportUserModal
        isOpen={showReportModal}
        username={user.username ?? ''}
        isLoading={isReportPending}
        onConfirm={handleReportConfirm}
        onCancel={() => setShowReportModal(false)}
      />

      <FollowersFollowingModal
        isOpen={followModal.isOpen}
        onClose={() => setFollowModal({ ...followModal, isOpen: false })}
        type={followModal.type}
        userId={user.id}
      />

      <div className="bg-[#111213] flex flex-col rounded-2xl p-3 md:p-5 lg:p-6 xl:p-14 border-x-0 border-y-2 md:border-2 border-[#1D1F20] mb-3 md:mb-5 lg:mb-8 xl:mb-15">
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 lg:gap-6 xl:gap-8 justify-between items-center mb-3 md:mb-5 lg:mb-8 xl:mb-10">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center text-center md:text-left">
            <div className="relative shrink-0">
              <UserAvatar
                  src={user.profileImage}
                  alt={user.username}
                  isLive={isLive}
                  callId={liveStatus?.callId}
                  username={user.username}
                  size="custom"
                  className="w-32 h-32 md:w-20 md:h-20 lg:w-26 lg:h-26 xl:w-32 xl:h-32"
                  clickable={true}
                  showBadge={true}
              />
              {isOwnProfile && (
                <button
                  onClick={() => setEditProfileOpen(true)}
                  className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-lg border border-gray-200 hover:scale-110 transition-transform z-20"
                >
                  <img src={cameraLogo} alt="Edit profile" className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col items-center md:items-start w-full mt-2 md:mt-0">
              <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                <h1 className="text-xl md:text-xl lg:text-2xl xl:text-4xl font-bold text-white mb-1">
                  {user.fullName || user.username}
                </h1>
              </div>

              <div className="flex items-center gap-4 text-[#494E50] text-sm justify-center md:justify-start w-full">
                <span className="font-medium">@{user.username}</span>
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
              {user.bio && (
                <p className="text-zinc-300 text-sm md:text-sm lg:text-sm xl:text-base max-w-lg leading-relaxed text-center md:text-left mt-1 md:mt-2 lg:mt-3 px-2 md:px-0">{user.bio}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto md:mt-0">
            {isOwnProfile ? (
              <>
                <button
                  onClick={handleGoLiveClick}
                  className="bg-[#FF7700] text-[#111213] py-3 px-12 rounded-full font-bold hover:bg-[#FF7700] transition-colors cursor-pointer"
                >
                  Go Live
                </button>
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setEditProfileOpen(true)}
                    className="flex-1 md:flex-none md:w-48 border-2 border-[#FF7700] text-[#FF7700] rounded-full py-2.5 md:py-3 px-8 font-bold hover:bg-orange-500/10 transition-colors cursor-pointer"
                  >
                    Edit Profile
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setSettingsOpen((prev) => !prev)}
                      className="w-12 h-12 bg-[#FF7700] text-[#111213] rounded-full flex items-center justify-center hover:bg-orange-300 transition-all cursor-pointer"
                    >
                      <MoreHorizontal className="w-6 h-6" />
                    </button>
                    {settingsOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setSettingsOpen(false)} />
                        <div className="absolute right-0 bottom-full w-36 mb-2 bg-[#121212] border border-zinc-800 rounded-lg shadow-2xl z-50 py-1">
                          <button
                            onClick={() => { setSettingsOpen(false); navigate({ to: '/profile/setting' }); }}
                            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-zinc-800 cursor-pointer"
                          >
                            Settings
                          </button>
                          <div className="h-px bg-zinc-800 mx-2" />
                          <button
                            onClick={() => { setSettingsOpen(false); handleShare(); }}
                            className="w-full px-4 py-3 text-left text-sm text-white hover:bg-zinc-800 cursor-pointer"
                          >
                            Share Profile
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Follow / Unblock button */}
                <button
                  onClick={isBlocked ? () => setShowBlockModal(true) : handleFollowClick}
                  disabled={isBlocked ? isBlockPending : isPending}
                  className="w-full md:w-64 bg-[#FF7700] text-[#111213] font-bold py-3.5 rounded-full disabled:opacity-60 hover:bg-[#FF7700] transition-colors cursor-pointer"
                >
                  {isBlocked
                    ? (isBlockPending ? 'Please wait...' : 'Unblock User')
                    : (isPending ? 'Please wait...' : user.followedByMe ? 'Unfollow' : 'Follow')
                  }
                </button>
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={handleShare}
                    className="flex-1 md:flex-none md:w-48 border-2 border-[#FF7700] text-[#FF7700] rounded-full py-2.5 md:py-3 px-8 font-bold hover:bg-orange-500/10 transition-colors cursor-pointer"
                  >
                    Share Profile
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuOpen((prev) => !prev)}
                      className="w-12 h-12 bg-[#FF7700] text-[#111213] rounded-full flex items-center justify-center hover:bg-orange-300 transition-all cursor-pointer"
                    >
                      <MoreHorizontal className="w-6 h-6" />
                    </button>
                    {actionMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setActionMenuOpen(false)} />
                        <div className="absolute -right-15 bottom-full w-30 -mb-4 bg-[#121212] border border-zinc-800 rounded-lg shadow-2xl z-50 py-1">
                          <button
                            onClick={() => { setShowBlockModal(true); setActionMenuOpen(false); }}
                            disabled={isBlockPending}
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-800 cursor-pointer disabled:opacity-60"
                          >
                            {isBlocked ? 'Unblock User' : 'Block User'}
                          </button>
                          <div className="h-px bg-zinc-800 mx-2" />
                          <button
                            onClick={() => { setShowReportModal(true); setActionMenuOpen(false); }}
                            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-800 cursor-pointer"
                          >
                            Report User
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-[#1D1F20] rounded-2xl md:rounded-3xl lg:rounded-3xl xl:rounded-4xl py-1.5 md:py-2.5 lg:py-3 xl:py-4 px-4 md:px-10 lg:px-14 xl:px-20 border border-zinc-800/40 shadow-2xl w-full">
          <div className="flex justify-between items-center w-full">
            {stats.map((stat, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center gap-1 md:gap-1.5 flex-1",
                  stat.label !== 'Post' && "cursor-pointer hover:opacity-80 transition-opacity"
                )}
                onClick={stat.label !== 'Post' ? () => openFollowModal(stat.label.toLowerCase() as any) : undefined}
              >
                <span className="text-[#494E50] text-[9px] md:text-xs font-bold tracking-widest">{stat.label}</span>
                <span className="text-base md:text-2xl lg:text-3xl xl:text-4xl font-extrabold tracking-tight text-[#FFE2A5]">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
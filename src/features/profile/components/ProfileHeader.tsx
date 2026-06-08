import { useState } from 'react';
import { MapPin, MoreHorizontal, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useToggleFollow, useUserLiveStatus, useBlockUser } from '@/features/profile/services/profile.service';
import type { User } from '@/features/profile/services/profile.types';
import cameraLogo from "@/assets/Camera.png"
import { toast } from 'sonner';
import { useGoLive } from '@/features/profile/hooks/useGoLive';
import { userService } from '@/features/live/services/user.service';
import { EditProfile } from '@/features/profile/components/EditProfile';
import { useSubmitReport } from '@/features/report/services/report.service';
import { BlockUserModal, ErrorModal } from '@/components/internal/ConfirmModal';
import { ReportUserModal, ReportLimitModal, ReportSuccessModal, ReportFailureModal } from '@/components/internal/ReasonModal';
import { SuccessModal } from '@/features/setting/components/SuccessModal';
import { FollowersFollowingModal } from '@/features/profile/components/FollowersFollowingModal';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/UserAvatar';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { chatService } from '@/features/chat/services/chat.service';
import { SESSION_ACTIVE_KEY } from '@/features/chat/utils/chatConstants';

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
	const [blockSuccessAction, setBlockSuccessAction] = useState<'block' | 'unblock' | null>(null);
	const [showReportModal, setShowReportModal] = useState(false);
	const [showReportSuccess, setShowReportSuccess] = useState(false);
	const [showReportLimitModal, setShowReportLimitModal] = useState(false);
	const [failedReportData, setFailedReportData] = useState<{ reasonId: string; otherText?: string } | null>(null);
	const [followModal, setFollowModal] = useState<{ isOpen: boolean; type: 'followers' | 'following' }>({
		isOpen: false,
		type: 'followers',
	});
	const [isAvatarEnlarged, setIsAvatarEnlarged] = useState(false);

	const { mutate: toggleFollow, isPending } = useToggleFollow();
	const { mutate: toggleBlock, isPending: isBlockPending } = useBlockUser();
	const { mutate: submitReport, isPending: isReportPending } = useSubmitReport();
	const handleGoLiveClick = useGoLive();
	const { user: currentUser } = useAuthStore();
	const { openModal: openLoginModal, setMode, setStep } = useSignUpStore();
	const [isMessaging, setIsMessaging] = useState<number | null>(null);

	const handleMessage = async () => {
		if (!currentUser) {
			setMode('login');
			setStep('input');
			openLoginModal();
			return;
		}
		setIsMessaging(user.id);
		try {
			const { channelCid } = await chatService.startDirectChat(
				user.id,
				{ 
					id: String(currentUser.id), 
					name: currentUser.fullName || currentUser.username || '', 
					avatar: currentUser.profileImage || '' 
				},
				{ 
					name: user.fullName || user.username || '', 
					avatar: user.profileImage || '' 
				}
			);
			sessionStorage.setItem(SESSION_ACTIVE_KEY, channelCid);
			navigate({ to: '/chats' as any });
		} catch (error) {
			toast.error('Failed to start chat');
		} finally {
			setIsMessaging(null);
		}
	};

	const handleReportClick = () => {
		if (!currentUser) {
			setMode('login');
			setStep('input');
			openLoginModal();
			return;
		}
		setShowReportModal(true);
		setActionMenuOpen(false);
	};

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
		const action = isBlocked ? 'unblock' : 'block';
		toggleBlock(
			{ targetUserId: user.id, blockedByMe: isBlocked },
			{
				onSuccess: () => {
					setShowBlockModal(false);
					setActionMenuOpen(false);
					setBlockSuccessAction(action);
					setShowBlockSuccess(true);
				},
				onError: (error: any) => {
					const message =
						error?.response?.data?.message ||
						(isBlocked ? 'Failed to unblock user' : 'Failed to block user');
					setBlockErrorMessage(message);
					setShowBlockModal(false);
					setShowBlockError(true);
				},
			},
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
				onError: (error: any) => {
					if (error?.response?.status === 429) {
						setShowReportModal(false);
						setActionMenuOpen(false);
						setShowReportLimitModal(true);
					} else {
						setFailedReportData({ reasonId, otherText });
						setShowReportModal(false);
						setActionMenuOpen(false);
					}
				},
			},
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

			{/* Enlarged Avatar Modal */}
			{isAvatarEnlarged && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-300 animate-fade-in"
					onClick={() => setIsAvatarEnlarged(false)}
				>
					{/* Close button */}
					<button
						type="button"
						onClick={() => setIsAvatarEnlarged(false)}
						className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 active:scale-95 transition-all duration-200 z-50 cursor-pointer shadow-lg"
						aria-label="Close image view"
					>
						<X className="w-6 h-6" />
					</button>

					{/* Modal Container */}
					<div
						className="relative max-w-[90vw] max-h-[80vh] md:max-w-[70vw] md:max-h-[85vh] lg:max-w-[50vw] xl:max-w-[40vw] flex flex-col items-center justify-center p-2 animate-scale-up"
						onClick={(e) => e.stopPropagation()}
					>
						{/* The Image */}
						<div className="relative rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl bg-[#111213] group">
							{!user.profileImage ? (
								<div className="w-80 h-80 md:w-96 md:h-96 flex items-center justify-center bg-neutral-800">
									<span className="text-white/40 text-lg">
										No profile picture
									</span>
								</div>
							) : (
								<img
									src={user.profileImage}
									alt={user.username || "Profile picture"}
									className="w-full h-full object-contain max-h-[70vh] rounded-2xl select-none animate-scale-up"
								/>
							)}

							{/* Image Info Overlay on Hover */}
							<div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-between items-center">
								<div className="flex flex-col">
									<span className="text-white font-semibold text-lg">
										{user.fullName || user.username}
									</span>
									<span className="text-white/60 text-sm">
										{user.username}
									</span>
								</div>
								{/* {user.profileImage && (
									<a
										href={user.profileImage}
										download={`${user.username}-profile.jpg`}
										target="_blank"
										rel="noreferrer"
										className="p-2.5 rounded-full bg-[#FF7700] text-[#111213] hover:bg-orange-400 active:scale-95 transition-all shadow-md cursor-pointer"
										title="Open original image"
									>
										<Download className="w-5 h-5" />
									</a>
								)} */}
							</div>
						</div>
					</div>
				</div>
			)}

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
				title={
					blockSuccessAction === 'unblock'
						? `Unblocked ${user.username ?? ""}`
						: `Blocked ${user.username ?? ""}`
				}
				description={
					blockSuccessAction === 'unblock'
						? `${user.username ?? ""} was unblocked successfully.`
						: `${user.username ?? ""} was blocked successfully.`
				}
				buttonLabel="Done"
				onAction={() => {
					setShowBlockSuccess(false);
					setBlockSuccessAction(null);
				}}
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
				type="chat"
				onMute={() => {
					toast.success(`${user.username ?? ''} has been muted`);
					setShowReportSuccess(false);
				}}
				onBlock={async () => {
					try {
						await userService.blockUser(user.id);
						toast.success(`Blocked ${user.username ?? ''}`);
					} catch {
						toast.error('Failed to block user');
					}
					setShowReportSuccess(false);
				}}
				onClose={() => setShowReportSuccess(false)}
			/>

			{/* Report modal */}
			<ReportUserModal
				isOpen={showReportModal}
				username={user.username ?? ''}
				isLoading={isReportPending}
				onConfirm={handleReportConfirm}
				onCancel={() => setShowReportModal(false)}
			/>

			<ReportLimitModal
				isOpen={showReportLimitModal}
				onTryLater={() => setShowReportLimitModal(false)}
				onExplore={() => {
					setShowReportLimitModal(false);
					navigate({ to: '/explore' });
				}}
			/>

			<ReportFailureModal
				isOpen={!!failedReportData}
				onTryAgain={() => {
					if (failedReportData) {
						handleReportConfirm(failedReportData.reasonId, failedReportData.otherText);
						setFailedReportData(null);
					}
				}}
				onCancel={() => setFailedReportData(null)}
			/>

			<FollowersFollowingModal
				isOpen={followModal.isOpen}
				onClose={() => setFollowModal({ ...followModal, isOpen: false })}
				type={followModal.type}
				userId={user.id}
			/>

			<div className="bg-[#111213] flex flex-col rounded-2xl p-3 md:p-4 lg:p-5 xl:p-6 2xl:p-14 border-x-0 border-y-2 md:border-2 border-[#1D1F20] mb-3 md:mb-5 lg:mb-8 xl:mb-10 2xl:mb-15">
				<div className="flex flex-col md:flex-row gap-3 md:gap-4 lg:gap-6 xl:gap-6 2xl:gap-8 justify-between items-center mb-2 md:mb-4 lg:mb-5 xl:mb-6 2xl:mb-10">
					<div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center text-center md:text-left">
						<div
							className={cn(
								"relative shrink-0 group/avatar",
								!isLive && !isBlocked && "cursor-pointer",
								isBlocked && "cursor-not-allowed opacity-80",
							)}
							onClick={!isLive && !isBlocked ? () => setIsAvatarEnlarged(true) : undefined}
						>
							<UserAvatar
								src={user.profileImage}
								alt={user.username}
								isLive={isLive && !isBlocked}
								callId={liveStatus?.callId}
								username={user.username}
								size="custom"
								className={cn(
									"w-24 h-24 md:w-20 md:h-20 lg:w-22 lg:h-22 xl:w-24 xl:h-24 2xl:w-32 2xl:h-32 transition-transform duration-300",
									!isBlocked && "group-hover/avatar:scale-102"
								)}
								clickable={isLive && !isBlocked}
								showBadge={true}
							/>
							{isOwnProfile && (
								<button
									onClick={(e) => {
										e.stopPropagation();
										setEditProfileOpen(true);
									}}
									className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-lg border border-gray-200 hover:scale-110 transition-transform z-20"
								>
									<img src={cameraLogo} alt="Edit profile" className="w-4 h-4" />
								</button>
							)}
						</div>

						<div className="flex flex-col items-center md:items-start w-full mt-2 md:mt-0">
							<div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
								<h1 className="text-xl md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-white mb-1">
									{user.fullName || user.username}
								</h1>
							</div>

							<div className="flex items-center gap-4 text-[#494E50] text-sm justify-center md:justify-start w-full">
								<span className="font-medium">{user.username}</span>
								{user.location && (
									<div className="flex items-center gap-1">
										<MapPin className="w-3.5 h-3.5" />
										<span>{user.location}</span>
									</div>
								)}
							</div>
							{user.bio && (
								<p className="text-zinc-300 text-sm md:text-sm lg:text-sm xl:text-sm 2xl:text-base max-w-lg leading-relaxed text-center md:text-left mt-1 md:mt-2 lg:mt-2 px-2 md:px-0">{user.bio}</p>
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
								{!isBlocked && (
									<button
										onClick={handleFollowClick}
										disabled={isPending}
										className="w-full md:w-64 bg-[#FF7700] text-[#111213] font-bold py-3.5 rounded-full disabled:opacity-60 hover:bg-[#FF7700] transition-colors cursor-pointer"
									>
										{isPending ? 'Please wait...' : user.followedByMe ? 'Unfollow' : 'Follow'}
									</button>
								)}
								<div className="flex gap-3 w-full md:w-auto">
									<button
										onClick={handleMessage}
										disabled={isBlocked || isMessaging === user.id}
										className="flex-1 md:flex-none md:w-48 border-2 border-[#FF7700] text-[#FF7700] rounded-full py-2.5 md:py-3 px-8 font-bold hover:bg-orange-500/10 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{isMessaging === user.id ? 'Please wait...' : 'Message'}
									</button>
									<div className="relative">
										<button
											onClick={() => !isBlocked && setActionMenuOpen((prev) => !prev)}
											disabled={isBlocked}
											className="w-12 h-12 bg-[#FF7700] text-[#111213] rounded-full flex items-center justify-center hover:bg-orange-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<MoreHorizontal className="w-6 h-6" />
										</button>
										{actionMenuOpen && (
											<>
												<div className="fixed inset-0 z-40" onClick={() => setActionMenuOpen(false)} />
												<div className="absolute -right-15 bottom-full w-36 -mb-4 bg-[#121212] border border-zinc-800 rounded-lg shadow-2xl z-50 py-1">
													<button
														onClick={() => { setActionMenuOpen(false); handleShare(); }}
														className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-800 cursor-pointer"
													>
														Share Profile
													</button>
													<div className="h-px bg-zinc-800 mx-2" />
													<button
														onClick={() => { setShowBlockModal(true); setActionMenuOpen(false); }}
														disabled={isBlockPending}
														className="w-full px-4 py-2 text-left text-sm text-white hover:bg-zinc-800 cursor-pointer disabled:opacity-60"
													>
														{isBlocked ? 'Unblock User' : 'Block User'}
													</button>
													<div className="h-px bg-zinc-800 mx-2" />
													<button
														onClick={handleReportClick}
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

				<div className="bg-[#1D1F20] rounded-2xl md:rounded-3xl lg:rounded-3xl xl:rounded-3xl 2xl:rounded-4xl py-1 md:py-2 lg:py-2.5 2xl:py-4 px-4 md:px-10 lg:px-14 xl:px-16 2xl:px-20 border border-zinc-800/40 shadow-2xl w-full">
					<div className="flex justify-between items-center w-full">
						{stats.map((stat, i) => (
							<div
								key={i}
								className={cn(
									"flex flex-col items-center gap-1 md:gap-1.5 flex-1",
									stat.label !== 'Post' && !isBlocked && "cursor-pointer hover:opacity-80 transition-opacity",
									isBlocked && "cursor-not-allowed opacity-50"
								)}
								onClick={stat.label !== 'Post' && !isBlocked ? () => openFollowModal(stat.label.toLowerCase() as any) : undefined}
							>
								<span className="text-[#FF7700] text-[9px] md:text-xs font-bold tracking-widest">{stat.label}</span>
								<span className="text-base md:text-2xl lg:text-3xl xl:text-3xl 2xl:text-4xl font-extrabold tracking-tight text-[#FFE2A5]">{stat.value}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</>
	);
};
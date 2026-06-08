import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ShieldCheck, Clock, Users, Trash2, LogOut, Link2Off } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import {
    useBlockedUsers,
    useUnblockUser,
    useDeleteAccount,
} from '@/features/setting/services/setting.service';
import { toast } from 'sonner';
import { SignUpModal } from '@/features/auth/components/SignUpModal';

import { ConfirmModal, LogoutModal } from '@/components/internal/ConfirmModal';
import { DeleteAccountModal } from '@/components/internal/ReasonModal';
import { SuccessModal } from '@/features/setting/components/SuccessModal';

// ------ Settings Page -------
export const SettingsPage = () => {
    const navigate = useNavigate();
    const { user, clearAuth } = useAuthStore();
    const { setStep, openModal, setOnAgeVerified, reset: resetSignUp } = useSignUpStore();
    const queryClient = useQueryClient();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    const [pendingUnblockUser, setPendingUnblockUser] = useState<any | null>(null);

    const { data: blockedUsers = [], isLoading: isLoadingBlocked } = useBlockedUsers();
    const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();
    const { mutate: deactivateAccount, isPending: isDeactivating } = useDeleteAccount();

    const isAgeVerified = user?.eighteenPlus ?? false;

    const handleAgeVerification = () => {
        setOnAgeVerified(() => { });
        setStep('age');
        openModal();
    };

    // ----- Unblock -----
    const handleUnblockConfirm = () => {
        if (pendingUnblockUser == null) return;
        unblockUser(
            { targetUserId: pendingUnblockUser.id },
            {
                onSuccess: () => {
                    toast.success('User unblocked');
                    setPendingUnblockUser(null);
                },
                onError: () => {
                    toast.error('Failed to unblock user');
                    setPendingUnblockUser(null);
                },
            }
        );
    };

    // ----- Logout ------
    const handleLogout = () => {
        clearAuth();
        resetSignUp();
        // Clear cached blocked users so stale data never persists across accounts
        queryClient.removeQueries({ queryKey: ['blockedUsers'] });
        navigate({ to: '/' });
    };

    // ----- Delete -----
    const handleDelete = (reasonId: string, otherText?: string) => {
        deactivateAccount(
            { reasonId, otherText },
            {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setShowDeleteSuccess(true);
                },
                onError: (error: any) => {
                    toast.error(error?.response?.data?.message || 'Failed to delete account');
                    setShowDeleteModal(false);
                },
            }
        );
    };

    return (
        <>
            <SignUpModal />

            {/* Logout confirm */}
            <LogoutModal
                isOpen={showLogoutConfirm}
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />

            {/* Unblock user confirm */}
            <ConfirmModal
                isOpen={pendingUnblockUser !== null}
                title={`Unblock ${pendingUnblockUser?.fullName || (pendingUnblockUser?.username ? `${pendingUnblockUser.username}` : 'User')}`}
                description={`Are you sure you want to unblock\n${pendingUnblockUser?.fullName || (pendingUnblockUser?.username ? `${pendingUnblockUser.username}` : 'this user')}?`}
                avatarUrl={pendingUnblockUser?.profileImage}
                avatarFallback={(pendingUnblockUser?.fullName?.[0] || pendingUnblockUser?.username?.[0] || '?').toUpperCase()}
                confirmLabel="Unblock User"
                confirmClassName="bg-[#FF7700] text-black hover:bg-[#ff9922]"
                isLoading={isUnblocking}
                onConfirm={handleUnblockConfirm}
                onCancel={() => setPendingUnblockUser(null)}
            />

            {/* Delete success */}
            <SuccessModal
                isOpen={showDeleteSuccess}
                icon={<Link2Off className="w-12 h-12" />}
                title="Your PulseLive Account Successfully Deleted"
                buttonLabel="Okay"
                onAction={() => {
                    setShowDeleteSuccess(false);
                    clearAuth();
                    resetSignUp();
                    // Clear cached blocked users on account deletion too
                    queryClient.removeQueries({ queryKey: ['blockedUsers'] });
                    navigate({ to: '/' });
                }}
            />

            {/* Delete account — reason modal */}
            <DeleteAccountModal
                isOpen={showDeleteModal}
                isLoading={isDeactivating}
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />

            {/* Mobile: fullscreen overlay | Desktop: flex column with fixed height */}
            <div className="fixed inset-0 z-40 bg-[#161616] flex flex-col overflow-hidden md:static md:z-auto md:bg-transparent text-white md:h-[calc(100vh-160px)]">

                {/* Mobile-only glow blobs */}
                <div
                    className="pointer-events-none md:hidden absolute rounded-full"
                    style={{
                        width: 169,
                        height: 220,
                        top: -108,
                        right: -92,
                        background: '#FF7700',
                        filter: 'blur(100px)',
                        transform: 'translate3d(0,0,0)',
                    }}
                />
                <div
                    className="pointer-events-none md:hidden absolute rounded-full"
                    style={{
                        width: 220,
                        height: 220,
                        bottom: -110,
                        left: -110,
                        background: '#3E2AB5',
                        filter: 'blur(120px)',
                        transform: 'translate3d(0,0,0)',
                    }}
                />
                <div className="relative flex-1 overflow-y-auto overflow-x-hidden px-5 py-6 md:px-10 md:py-10 custom-scrollbar">
                    <div className="max-w-7xl mx-auto">

                        {/* Header */}
                        <div className="flex items-center gap-4 mb-8 md:mb-12">
                            <button
                                onClick={() => navigate({ to: "/profile" })}
                                className="w-10 h-10 md:w-9 md:h-9 rounded-full bg-[#1D1F20] flex items-center justify-center hover:bg-[#252830] transition-colors cursor-pointer shrink-0"
                            >
                                <ChevronLeft className="w-6 h-6 md:w-5 md:h-5 text-white" strokeWidth={2.5} />
                            </button>
                            <h1 className="text-xl md:text-2xl font-bold text-white">Settings</h1>
                        </div>

                        {/* Age Verification */}
                        <div className="flex items-center justify-between py-6 md:py-8 border-b border-t border-white/5">
                            <span style={{ fontFamily: "'Public Sans', sans-serif" }} className="text-white font-semibold text-base md:text-2xl leading-snug md:leading-[40px]">Age Verification</span>
                            {isAgeVerified ? (
                                <div className="flex items-center gap-2 bg-[#1D1F20] border border-white/10 rounded-full px-4 py-2 md:px-8 md:py-2.5 min-w-[130px] md:min-w-[160px] justify-center">
                                    <ShieldCheck className="w-4 h-4 text-green-400" />
                                    <span className="text-xs md:text-sm font-semibold text-green-400">18+ Verified</span>
                                </div>
                            ) : (
                                <button
                                    onClick={handleAgeVerification}
                                    className="flex items-center gap-2 bg-[#1D1F20] border border-white/10 rounded-full px-4 py-2 md:px-8 md:py-2.5 min-w-[130px] md:min-w-[160px] justify-center hover:bg-[#252830] transition-colors"
                                >
                                    <Clock className="w-4 h-4 text-[#FF0000]" />
                                    <span className="text-xs md:text-sm font-semibold text-[#FF0000]">Pending</span>
                                </button>
                            )}
                        </div>

                        {/* Blocked Users */}
                        <div className="py-6 md:py-8 border-b border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <span style={{ fontFamily: "'Public Sans', sans-serif" }} className="text-white font-semibold text-base md:text-2xl leading-snug md:leading-[40px]">Blocked Users</span>
                                {blockedUsers.length > 0 && (
                                    <span className="text-gray-500 text-sm">({blockedUsers.length} Users)</span>
                                )}
                            </div>

                            <div className="bg-[#1a1c24] rounded-2xl overflow-hidden border border-white/5">
                                {isLoadingBlocked ? (
                                    <div className="py-10 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    </div>
                                ) : blockedUsers.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center gap-3">
                                        <Users className="w-10 h-10 text-gray-600" />
                                        <p className="text-gray-500 text-sm">No blocked users</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {blockedUsers.map((blockedUser) => (
                                            <div
                                                key={blockedUser.id}
                                                className="flex items-center justify-between px-5 py-4"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {blockedUser.profileImage ? (
                                                        <img
                                                            src={blockedUser.profileImage}
                                                            alt={blockedUser.username}
                                                            className="w-9 h-9 rounded-full object-cover bg-zinc-800"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-white">
                                                            {(blockedUser.fullName?.[0] || blockedUser.username?.[0] || '?').toUpperCase()}
                                                        </div>
                                                    )}
                                                    <span className="text-gray-300 text-sm">{blockedUser.username}</span>
                                                </div>
                                                <button
                                                    onClick={() => setPendingUnblockUser(blockedUser)}
                                                    disabled={isUnblocking}
                                                    className="border border-white/20 text-white text-xs font-medium rounded-full px-5 py-2 hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
                                                >
                                                    Unblock
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* My Coin Wallet */}
                        <div className="flex items-center justify-between py-6 md:py-8 border-b border-white/5 cursor-pointer hover:bg-white/5 px-2 -mx-2 rounded-xl transition-colors" onClick={() => navigate({ to: '/profile/setting/coins' })}>
                            <span style={{ fontFamily: "'Public Sans', sans-serif" }} className="text-white font-semibold text-base md:text-2xl leading-snug md:leading-[40px]">My Coin Wallet</span>
                        </div>

                        {/* Get Money */}
                        <div className="flex items-center justify-between py-6 md:py-8 border-b border-white/5 cursor-pointer hover:bg-white/5 px-2 -mx-2 rounded-xl transition-colors" onClick={() => navigate({ to: '/profile/setting/diamonds' })}>
                            <span style={{ fontFamily: "'Public Sans', sans-serif" }} className="text-white font-semibold text-base md:text-2xl leading-snug md:leading-[40px]">Creator Wallet</span>
                        </div>

                        {/* Delete Account */}
                        <div className="flex items-center justify-between py-6 md:py-8 border-b border-white/5">
                            <span style={{ fontFamily: "'Public Sans', sans-serif" }} className="text-white font-semibold text-base md:text-2xl leading-snug md:leading-[40px]">Delete Account</span>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                className="flex items-center gap-2 border-2 border-red-500 text-red-500 rounded-full px-4 py-2 md:px-8 md:py-2.5 text-xs md:text-sm font-bold min-w-[130px] md:min-w-[160px] justify-center hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>

                        {/* Log out */}
                        <div className="flex items-center justify-between pt-6 pb-18 md:py-8">
                            <span style={{ fontFamily: "'Public Sans', sans-serif" }} className="text-white font-semibold text-base md:text-2xl leading-snug md:leading-[40px]">Log out</span>
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="flex items-center gap-2 border-2 border-[#FF7700] text-[#FF7700] rounded-full px-4 py-2 md:px-8 md:py-2.5 text-xs md:text-sm font-bold min-w-[130px] md:min-w-[160px] justify-center hover:bg-[#FF7700]/10 transition-colors cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Log out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
import { useState } from 'react';
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

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    const [unblockTargetId, setUnblockTargetId] = useState<number | null>(null);

    const { data: blockedUsers = [], isLoading: isLoadingBlocked } = useBlockedUsers();
    const { mutate: unblockUser, isPending: isUnblocking } = useUnblockUser();
    const { mutate: deactivateAccount, isPending: isDeactivating } = useDeleteAccount();

    const isAgeVerified = user?.eighteenPlus ?? false;

    const handleAgeVerification = () => {
        setOnAgeVerified(() => {});
        setStep('age');
        openModal();
    };

    // ----- Unblock -----
    const pendingUnblockUser = blockedUsers.find((u) => u.id === unblockTargetId);

    const handleUnblockConfirm = () => {
        if (unblockTargetId == null) return;
        unblockUser(
            { targetUserId: unblockTargetId },
            {
                onSuccess: () => {
                    toast.success('User unblocked');
                    setUnblockTargetId(null);
                },
                onError: () => {
                    toast.error('Failed to unblock user');
                    setUnblockTargetId(null);
                },
            }
        );
    };

    // ----- Logout ------
    const handleLogout = () => {
        clearAuth();
        resetSignUp();
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
                isOpen={unblockTargetId !== null}
                title="Block User"
                description={`Are you sure you want to block\n@${pendingUnblockUser?.username ?? ''}`}
                avatarUrl={pendingUnblockUser?.profileImage}
                avatarFallback={(pendingUnblockUser?.fullName?.[0] || pendingUnblockUser?.username?.[0] || '?').toUpperCase()}
                confirmLabel="Unblock User"
                confirmClassName="bg-[#FF7700] text-black hover:bg-[#ff9922]"
                isLoading={isUnblocking}
                onConfirm={handleUnblockConfirm}
                onCancel={() => setUnblockTargetId(null)}
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

            {/* ----- Page ----- */}
            <div className="text-white">
                <div className="mx-auto px-10 py-10 gap-8">

                    {/* Header */}
                    <div className="flex items-center gap-4 mb-12">
                        <button
                            onClick={() => navigate({ to: "/profile" })}
                            className="w-9 h-9 rounded-full bg-[#1D1F20] flex items-center justify-center hover:bg-[#252830] transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <h1 className="text-2xl font-bold text-white">Settings</h1>
                    </div>

                    {/* Age Verification */}
                    <div className="flex items-center justify-between py-8 border-b border-t border-white/5">
                        <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 600, fontSize: 24, lineHeight: "40px" }} className="text-white">Age Verification</span>
                        {isAgeVerified ? (
                            <div className="flex items-center gap-2 bg-[#1D1F20] border border-white/10 rounded-full px-8 py-2">
                                <ShieldCheck className="w-4 h-4 text-green-400" />
                                <span className="text-sm font-semibold text-green-400">18+ Verified</span>
                            </div>
                        ) : (
                            <button
                                onClick={handleAgeVerification}
                                className="flex items-center gap-2 bg-[#1D1F20] border border-white/10 rounded-full px-8 py-2 hover:bg-[#252830] transition-colors"
                            >
                                <Clock className="w-4 h-4 text-[#FF0000]" />
                                <span className="text-sm font-semibold text-[#FF0000]">Pending</span>
                            </button>
                        )}
                    </div>

                    {/* Blocked Users */}
                    <div className="py-8 border-b border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 600, fontSize: 24, lineHeight: "40px" }} className="text-white">Blocked Users</span>
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
                                                <span className="text-gray-300 text-sm">@{blockedUser.username}</span>
                                            </div>
                                            <button
                                                onClick={() => setUnblockTargetId(blockedUser.id)}
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

                    {/* Delete Account */}
                    <div className="flex items-center justify-between py-8 border-b border-white/5">
                        <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 600, fontSize: 24, lineHeight: "40px" }} className="text-white">Delete Account</span>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center gap-2 border-2 border-red-500 text-red-500 rounded-full px-13 py-2.5 text-sm font-bold hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </button>
                    </div>

                    {/* Log out */}
                    <div className="flex items-center justify-between py-8">
                        <span style={{ fontFamily: "'Public Sans', sans-serif", fontWeight: 600, fontSize: 24, lineHeight: "40px" }} className="text-white">Log out</span>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="flex items-center gap-2 border-2 border-[#FF7700] text-[#FF7700] rounded-full px-12 py-2.5 text-sm font-bold hover:bg-[#FF7700]/10 transition-colors cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            Log out
                        </button>
                    </div>

                </div>
            </div>
        </>
    );
};
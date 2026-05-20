import { LogOut, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    descriptionPrefix?: string;
    username?: string;
    description?: string;
    avatarUrl?: string;
    avatarFallback?: string;
    confirmLabel: string;
    confirmIcon?: React.ReactNode;
    confirmClassName?: string;
    cancelLabel?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    useDrawer?: boolean;
    headerIcon?: React.ReactNode;
}

const ModalHeaderIcon = ({ avatarUrl, avatarFallback, headerIcon }: { avatarUrl?: string, avatarFallback?: string, headerIcon?: React.ReactNode }) => {
    if (headerIcon) {
        return (
            <div className="mb-4 flex justify-center text-white">
                {headerIcon}
            </div>
        );
    }
    if (avatarUrl || avatarFallback) {
        return (
            <div className="mb-5 flex justify-center">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt="user"
                        className="w-24 h-24 rounded-full object-cover"
                        style={{
                            border: '3px solid transparent',
                            background: 'linear-gradient(#18191f, #18191f) padding-box, linear-gradient(135deg, #7b2ff7, #ff7700) border-box',
                        }}
                    />
                ) : (
                    <div
                        className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                        style={{
                            border: '3px solid transparent',
                            background: 'linear-gradient(#3a3a3a, #3a3a3a) padding-box, linear-gradient(135deg, #7b2ff7, #ff7700) border-box',
                        }}
                    >
                        {avatarFallback}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="mb-4 text-white flex justify-center">
            <LogOut className="w-12 h-12 mx-auto stroke-[1.5px]" />
        </div>
    );
};

/* Shared inner content used by both modal and drawer */
const ConfirmModalContent = ({
    descriptionPrefix,
    username,
    description,
    confirmLabel,
    confirmIcon,
    confirmClassName = 'bg-[#FF7700] text-black hover:bg-[#ff9922]',
    cancelLabel = 'Cancel',
    isLoading,
    onConfirm,
    onCancel,
}: Omit<ConfirmModalProps, 'isOpen'>) => (
    <>
        {/* Description */}
        {descriptionPrefix && username && (
            <p className="text-gray-400 text-md leading-relaxed text-center">
                {descriptionPrefix}{' '}
                <span className="text-white font-semibold">@{username}</span>
            </p>
        )}

        {/* Fallback plain description */}
        {description && !descriptionPrefix && (
            <p className="text-gray-400 text-sm mb-4 leading-relaxed text-center">{description}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-3 w-full mt-4">
            <button
                onClick={onConfirm}
                disabled={isLoading}
                className={`flex-1 flex items-center cursor-pointer justify-center gap-2 py-3 rounded-full text-base font-semibold transition-all disabled:opacity-60 ${confirmClassName}`}
            >
                {confirmIcon}
                {isLoading ? 'Please wait...' : confirmLabel}
            </button>
            <button
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1 py-3 rounded-full text-base font-semibold border-2 border-[#FF7700] text-[#FF7700] hover:bg-white/5 transition-all cursor-pointer"
            >
                {cancelLabel}
            </button>
        </div>
    </>
);

export const ConfirmModal = (props: ConfirmModalProps) => {
    const { isOpen, title, onCancel, useDrawer = true, confirmLabel, confirmIcon, confirmClassName = 'bg-[#FF7700] text-black hover:bg-[#ff9922]', cancelLabel = 'Cancel', isLoading, onConfirm, headerIcon, ...rest } = props;
    const isMobile = useIsMobile();

    if (!isOpen) return null;

    /* ---- Mobile: Bottom Drawer ---- */
    if (isMobile && useDrawer) {
        return (
            <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && onCancel()}>
                <DrawerContent className="bg-[#1D1F20] border-t border-white/10 rounded-t-3xl px-6 pb-8">
                    <DrawerHeader className="pt-2 pb-4">
                        <DrawerTitle className="text-white text-xl font-bold text-center">{title}</DrawerTitle>
                        <DrawerDescription className="sr-only">{title}</DrawerDescription>
                    </DrawerHeader>
                    <div className="flex flex-col items-center px-2">
                        <ModalHeaderIcon avatarUrl={rest.avatarUrl} avatarFallback={rest.avatarFallback} headerIcon={headerIcon} />
                        <ConfirmModalContent onCancel={onCancel} confirmLabel={confirmLabel} confirmIcon={confirmIcon} confirmClassName={confirmClassName} cancelLabel={cancelLabel} isLoading={isLoading} onConfirm={onConfirm} {...rest} />
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    /* ---- Mobile: Fullscreen card (no drawer) ---- */
    if (isMobile && !useDrawer) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-black/80" onClick={onCancel} />
                <div className="relative bg-[#1D1F20] border border-white/10 rounded-[24px] w-full max-w-sm p-8 flex flex-col items-center text-center">
                    <ModalHeaderIcon avatarUrl={rest.avatarUrl} avatarFallback={rest.avatarFallback} headerIcon={headerIcon} />

                    <h3 className="text-white text-2xl font-bold mb-1 leading-snug">{title}</h3>

                    {/* Stacked buttons */}
                    <div className="flex flex-col gap-4 w-full">
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`w-full flex items-center cursor-pointer justify-center gap-2 py-4 rounded-full text-base font-bold transition-all disabled:opacity-60 ${confirmClassName}`}
                        >
                            {confirmIcon}
                            {isLoading ? 'Please wait...' : confirmLabel}
                        </button>
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="w-full py-4 rounded-full text-base font-bold border-2 border-[#FF7700] text-[#FF7700] hover:bg-white/5 transition-all cursor-pointer"
                        >
                            {cancelLabel}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    /* ---- Desktop: Centered Modal ---- */
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent showCloseButton={false} className="bg-[#1D1F20] border-white/10 rounded-3xl px-8 py-10 w-full max-w-md shadow-2xl flex flex-col items-center text-center">
                <ModalHeaderIcon avatarUrl={rest.avatarUrl} avatarFallback={rest.avatarFallback} headerIcon={headerIcon} />
                <DialogTitle className="text-white text-2xl font-bold leading-snug">{title}</DialogTitle>
                <ConfirmModalContent onCancel={onCancel} confirmLabel={confirmLabel} confirmIcon={confirmIcon} confirmClassName={confirmClassName} cancelLabel={cancelLabel} isLoading={isLoading} onConfirm={onConfirm} {...rest} />
            </DialogContent>
        </Dialog>
    );
};

// ----- Pre-configured modals -----

/* Logout confirm modal */
export const LogoutModal = ({
    isOpen,
    isLoading,
    onConfirm,
    onCancel,
}: Pick<ConfirmModalProps, 'isOpen' | 'isLoading' | 'onConfirm' | 'onCancel'>) => (
    <ConfirmModal
        isOpen={isOpen}
        title="Are you sure do you want to log out?"
        confirmLabel="Log Out"
        confirmIcon={<Trash2 className="w-5 h-5" />}
        confirmClassName="bg-[#FF7700] text-black hover:bg-[#ff9922]"
        isLoading={isLoading}
        onConfirm={onConfirm}
        onCancel={onCancel}
        useDrawer={false}
    />
);

/* Block / Unblock user modal */
export const BlockUserModal = ({
    isOpen,
    username,
    avatarUrl,
    isBlocked = false,
    isLoading,
    onConfirm,
    onCancel,
}: {
    isOpen: boolean;
    username: string;
    avatarUrl?: string;
    isBlocked?: boolean;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) => (
    <ConfirmModal
        isOpen={isOpen}
        title={isBlocked ? 'Unblock User' : 'Block User'}
        descriptionPrefix={isBlocked ? 'Are you sure you want to unblock' : 'Are you sure you want to block'}
        username={username}
        avatarUrl={avatarUrl}
        avatarFallback={username?.[0]?.toUpperCase()}
        confirmLabel={isBlocked ? 'Unblock User' : 'Block User'}
        confirmClassName="bg-[#FF7700] text-black hover:bg-[#ff9922]"
        isLoading={isLoading}
        onConfirm={onConfirm}
        onCancel={onCancel}
    />
);

/* Error modal — shows backend error messages */
export const ErrorModal = ({
    isOpen,
    message,
    onClose,
}: {
    isOpen: boolean;
    message: string;
    onClose: () => void;
}) => {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className="bg-[#1e2028] border-white/10 rounded-2xl p-10 w-full max-w-md shadow-2xl flex flex-col items-center text-center">
                {/* Error icon */}
                <div className="mb-5 w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                <DialogTitle className="text-white text-2xl font-bold leading-snug mb-4">Something went wrong</DialogTitle>

                <p className="text-gray-400 text-sm leading-relaxed mb-8">{message}</p>

                <button
                    onClick={onClose}
                    className="w-40 py-3.5 rounded-full bg-[#FF7700] text-black text-sm font-bold hover:bg-[#ff9922] transition-all active:scale-95 cursor-pointer"
                >
                    Close
                </button>
            </DialogContent>
        </Dialog>
    );
};

/* Report success modal — shows after a successful report with Mute/Block actions */
export const ReportSuccessModal = ({
    isOpen,
    username,
    avatarUrl,
    isBlocked,
    isBlockPending,
    onBlock,
    onMute,
    onDone,
}: {
    isOpen: boolean;
    username: string;
    avatarUrl?: string;
    isBlocked?: boolean;
    isBlockPending?: boolean;
    onBlock: () => void;
    onMute: () => void;
    onDone: () => void;
}) => {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onDone()}>
            <DialogContent showCloseButton={false} className="bg-[#1e2028] border-white/10 rounded-2xl px-6 py-10 w-full max-w-2xl shadow-2xl flex flex-col items-center text-center">
                {/* User avatar */}
                <div className="mb-5 flex justify-center">
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={username}
                            className="w-24 h-24 rounded-full object-cover"
                            style={{
                                border: '3px solid transparent',
                                background: 'linear-gradient(#18191f, #18191f) padding-box, linear-gradient(135deg, #7b2ff7, #ff7700) border-box',
                            }}
                        />
                    ) : (
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                            style={{
                                border: '3px solid transparent',
                                background: 'linear-gradient(#3a3a3a, #3a3a3a) padding-box, linear-gradient(135deg, #7b2ff7, #ff7700) border-box',
                            }}
                        >
                            {username?.[0]?.toUpperCase()}
                        </div>
                    )}
                </div>

                <DialogTitle className="text-white text-2xl font-bold leading-snug mb-2">
                    You Reported @{username} Successfully
                </DialogTitle>

                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                    We appreciate you helping us keep PulseLive Safe.
                </p>

                {/* Action buttons — single row */}
                <div className="flex gap-6 w-full">
                    <button
                        onClick={onMute}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full border-2 border-[#FF7700] text-[#FF7700] text-lg font-bold hover:bg-white/5 transition-all active:scale-95 cursor-pointer"
                    >
                        Mute
                    </button>
                    <button
                        onClick={onBlock}
                        disabled={isBlockPending}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full bg-[#FF7700] text-black text-lg font-bold hover:bg-[#ff9922] transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                    >
                        {isBlocked ? 'Unblock' : 'Block'}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

/* Unblock-only modal */
export const UnblockUserModal = ({
    isOpen,
    username,
    avatarUrl,
    isLoading,
    onConfirm,
    onCancel,
}: {
    isOpen: boolean;
    username: string;
    avatarUrl?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) => (
    <ConfirmModal
        isOpen={isOpen}
        title="Unblock User"
        descriptionPrefix="Are you sure you want to unblock"
        username={username}
        avatarUrl={avatarUrl}
        avatarFallback={username?.[0]?.toUpperCase()}
        confirmLabel="Unblock User"
        confirmClassName="bg-[#FF7700] text-black hover:bg-[#ff9922]"
        isLoading={isLoading}
        onConfirm={onConfirm}
        onCancel={onCancel}
    />
);
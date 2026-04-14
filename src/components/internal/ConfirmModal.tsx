import { LogOut, Trash2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';

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
}

const ModalHeaderIcon = ({ avatarUrl, avatarFallback }: { avatarUrl?: string, avatarFallback?: string }) => {
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
            <p className="text-gray-400 text-md mb-4 leading-relaxed text-center">
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
    const { isOpen, title, onCancel, useDrawer = true, confirmLabel, confirmIcon, confirmClassName = 'bg-[#FF7700] text-black hover:bg-[#ff9922]', cancelLabel = 'Cancel', isLoading, onConfirm, ...rest } = props;
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
                        <ModalHeaderIcon avatarUrl={rest.avatarUrl} avatarFallback={rest.avatarFallback} />
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
                    <ModalHeaderIcon avatarUrl={rest.avatarUrl} avatarFallback={rest.avatarFallback} />

                    <h3 className="text-white text-2xl font-bold mb-8 leading-snug">{title}</h3>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
            <div className="relative bg-[#1D1F20] border border-white/10 rounded-3xl px-8 py-10 w-full max-w-md mx-4 shadow-2xl flex flex-col items-center text-center">
                <ModalHeaderIcon avatarUrl={rest.avatarUrl} avatarFallback={rest.avatarFallback} />
                <h3 className="text-white text-2xl font-bold mb-8 leading-snug">{title}</h3>
                <ConfirmModalContent onCancel={onCancel} confirmLabel={confirmLabel} confirmIcon={confirmIcon} confirmClassName={confirmClassName} cancelLabel={cancelLabel} isLoading={isLoading} onConfirm={onConfirm} {...rest} />
            </div>
        </div>
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
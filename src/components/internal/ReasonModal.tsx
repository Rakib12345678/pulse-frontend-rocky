import { useState } from 'react';
import { Trash2, Flag, AlarmClock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useReportReasons } from '@/features/report/services/report.service';
import type { ReportReason } from '@/features/report/services/report.service';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from '@/components/ui/dialog';

// ---- Types ----

export interface TargetUserOption {
    id: string;
    username: string;
    isHost?: boolean;
}


interface ReasonOption {
    id: string;
    label: string;
}

interface ReasonModalProps {
    isOpen: boolean;
    title: string;
    options: ReasonOption[];
    usersToReport?: TargetUserOption[];
    confirmLabel: string;
    confirmIcon?: React.ReactNode;
    confirmClassName?: string;
    /** IDs of options that require additional text */
    requiresNoteIds?: string[];
    othersPlaceholder?: string;
    isLoading?: boolean;
    onConfirm: (selectedId: string, otherText?: string, reportedUserId?: string) => void;
    onCancel: () => void;
}

/* Shared content for both modal and drawer */
const ReasonModalContent = ({
    options,
    confirmLabel,
    confirmIcon,
    confirmClassName = 'bg-[#FF7700] text-black hover:bg-[#ff9922]',
    requiresNoteIds = [],
    othersPlaceholder = 'Text',
    isLoading,
    onConfirm,
    onCancel,
    selected,
    setSelected,
    otherText,
    setOtherText,
    usersToReport,
    selectedUser,
    setSelectedUser,
}: {
    options: ReasonOption[];
    confirmLabel: string;
    confirmIcon?: React.ReactNode;
    confirmClassName?: string;
    requiresNoteIds?: string[];
    othersPlaceholder?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    selected: string;
    setSelected: (id: string) => void;
    otherText: string;
    setOtherText: (text: string) => void;
    usersToReport?: TargetUserOption[];
    selectedUser: string;
    setSelectedUser: (id: string) => void;
}) => {
    const hasUsers = usersToReport && usersToReport.length > 0;
    const requiresNote = selected ? requiresNoteIds.includes(selected) : false;
    const canSubmit = !!selected && (!requiresNote || otherText.trim().length > 0) && (!hasUsers || !!selectedUser);

    return (
        <>
            {hasUsers && (
                <div className="mb-6">
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger className="w-full bg-transparent border border-white/10 text-white hover:border-white/30 h-[52px] rounded-xl focus:ring-0 focus:ring-offset-0 px-4">
                            <SelectValue placeholder="Select User Here" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#18191f] border-white/10 text-white rounded-xl max-h-[200px] z-[10005]">
                            {usersToReport.map((u) => (
                                <SelectItem key={u.id} value={u.id} className="hover:bg-white/10 focus:bg-white/10 focus:text-white cursor-pointer py-3 px-4">
                                    {u.username} {u.isHost ? '(Host)' : '(Co-host)'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Options */}
            <div className="flex flex-col gap-4 mb-8">
                {options.map((opt) => (
                    <label
                        key={opt.id}
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => setSelected(opt.id)}
                    >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selected === opt.id
                            ? 'border-[#FF7700] bg-[#FF7700]'
                            : 'border-white/30 bg-transparent group-hover:border-white/60'
                            }`}>
                            {selected === opt.id && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                        </div>
                        <span className="text-gray-300 text-sm">{opt.label}</span>
                    </label>
                ))}

                {/* Note text area when selected option requires a note */}
                {requiresNote && (
                    <div className="mt-1">
                        <textarea
                            value={otherText}
                            onChange={(e) => {
                                if (e.target.value.length <= 100) setOtherText(e.target.value);
                            }}
                            onFocus={(e) => {
                                // Prevent iOS from scrolling the entire page up when keyboard opens
                                e.preventDefault();
                                setTimeout(() => {
                                    e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                }, 300);
                            }}
                            placeholder={othersPlaceholder}
                            className="w-full bg-[#0f1117] border border-white/10 rounded-xl p-3 text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-white/30 transition-colors"
                            rows={4}
                        />
                        <p className="text-right text-gray-600 text-xs mt-1">{otherText.length}/100</p>
                    </div>
                )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={onConfirm}
                    disabled={!canSubmit || isLoading}
                    className={`flex-1 flex items-center justify-center cursor-pointer gap-2 py-3 rounded-full text-sm font-bold transition-all disabled:opacity-40 ${confirmClassName}`}
                >
                    {confirmIcon}
                    {isLoading ? 'Please wait...' : confirmLabel}
                </button>
                <button
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 py-3 rounded-full text-sm cursor-pointer font-bold border border-[#FF7700] text-[#FF7700] hover:bg-white/5 transition-all"
                >
                    Cancel
                </button>
            </div>
        </>
    );
};

const ReasonModal = ({
    isOpen,
    title,
    options,
    usersToReport,
    confirmLabel,
    confirmIcon,
    confirmClassName = 'bg-[#FF7700] text-black hover:bg-[#ff9922]',
    requiresNoteIds = [],
    othersPlaceholder = 'Text',
    isLoading,
    onConfirm,
    onCancel,
}: ReasonModalProps) => {
    const [selected, setSelected] = useState<string>('');
    const [otherText, setOtherText] = useState('');
    const [selectedUser, setSelectedUser] = useState<string>('');
    const isMobile = useIsMobile();

    if (!isOpen) return null;

    const hasUsers = usersToReport && usersToReport.length > 0;
    const requiresNote = selected ? requiresNoteIds.includes(selected) : false;
    const canSubmit = !!selected && (!requiresNote || otherText.trim().length > 0) && (!hasUsers || !!selectedUser);

    const handleConfirm = () => {
        if (!canSubmit) return;
        onConfirm(selected, requiresNote ? otherText : undefined, hasUsers ? selectedUser : undefined);
    };

    const sharedProps = {
        options,
        confirmLabel,
        confirmIcon,
        confirmClassName,
        requiresNoteIds,
        othersPlaceholder,
        isLoading,
        onConfirm: handleConfirm,
        onCancel,
        selected,
        setSelected,
        otherText,
        setOtherText,
        usersToReport,
        selectedUser,
        setSelectedUser,
    };

    /* ---- Mobile: Bottom Drawer ---- */
    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && onCancel()} repositionInputs={false}>
                <DrawerContent className="bg-[#18191f] border-t border-white/10 rounded-t-3xl flex flex-col max-h-[85dvh]">
                    <div className="w-full flex flex-col overflow-y-auto px-6 pb-8">
                        <DrawerHeader className="pt-2 pb-4 px-0 shrink-0">
                            <DrawerTitle className="text-white text-lg font-bold text-center leading-snug">{title}</DrawerTitle>
                            <DrawerDescription className="sr-only">{title}</DrawerDescription>
                        </DrawerHeader>
                        <div className="h-px bg-white/10 mb-5 shrink-0" />
                        <div className="px-2 shrink-0">
                            <ReasonModalContent {...sharedProps} />
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    /* ---- Desktop: Centered Modal ---- */
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent showCloseButton={false} className="bg-[#18191f] border-white/10 rounded-2xl px-10 py-8 w-full max-w-lg shadow-2xl">
                <DialogTitle className="text-white text-xl font-bold mb-6 text-center leading-snug">{title}</DialogTitle>
                <div className="h-px bg-white/10 mb-5 -mx-8" />
                <ReasonModalContent {...sharedProps} />
            </DialogContent>
        </Dialog>
    );
};

// ---- Helper: map API ReportReason[] to ReasonOption[] + requiresNoteIds ----
const mapReportReasons = (reasons: ReportReason[]) => {
    const options: ReasonOption[] = reasons.map((r) => ({
        id: r.value,
        label: r.label,
    }));
    const requiresNoteIds = reasons
        .filter((r) => r.requiresNote)
        .map((r) => r.value);
    return { options, requiresNoteIds };
};

// ---- Pre-configured modals ----

const DELETE_OPTIONS = [
    { id: 'not_useful', label: 'I no longer find it useful' },
    { id: 'privacy_concerns', label: 'Privacy or security concerns' },
    { id: 'switching_platform', label: 'Switching to another platform' },
    { id: 'bad_experience', label: 'Had a bad experience' },
    { id: 'others', label: 'Others' },
];

/** Report user modal — fetches reasons from API */
export const ReportUserModal = ({
    isOpen,
    username,
    isLoading,
    onConfirm,
    onCancel,
}: {
    isOpen: boolean;
    username: string;
    isLoading?: boolean;
    onConfirm: (reasonId: string, otherText?: string) => void;
    onCancel: () => void;
}) => {
    const { data: reasons, isLoading: isReasonsLoading } = useReportReasons();
    const { options, requiresNoteIds } = mapReportReasons(reasons ?? []);

    return (
        <ReasonModal
            isOpen={isOpen}
            title={`Report @${username}`}
            options={options}
            requiresNoteIds={requiresNoteIds}
            confirmLabel="Submit Report"
            confirmClassName="bg-[#FF7700] text-black hover:bg-[#ff9922]"
            isLoading={isLoading || isReasonsLoading}
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
};

/* Delete account modal */
export const DeleteAccountModal = ({
    isOpen,
    isLoading,
    onConfirm,
    onCancel,
}: {
    isOpen: boolean;
    isLoading?: boolean;
    onConfirm: (reasonId: string, otherText?: string) => void;
    onCancel: () => void;
}) => (
    <ReasonModal
        isOpen={isOpen}
        title="Why did you choose to leave PulseLive?"
        options={DELETE_OPTIONS}
        confirmLabel="Delete Account"
        confirmIcon={<Trash2 className="w-4 h-4" />}
        confirmClassName="bg-[#FF7700] text-black hover:bg-[#ff9922]"
        isLoading={isLoading}
        onConfirm={onConfirm}
        onCancel={onCancel}
    />
);

/** Report stream modal — fetches reasons from API */
export const ReportStreamModal = ({
    isOpen,
    isLoading,
    usersToReport,
    onConfirm,
    onCancel,
}: {
    isOpen: boolean;
    isLoading?: boolean;
    usersToReport?: TargetUserOption[];
    onConfirm: (reasonId: string, otherText?: string, reportedUserId?: string) => void;
    onCancel: () => void;
}) => {
    const { data: reasons, isLoading: isReasonsLoading } = useReportReasons();
    const { options, requiresNoteIds } = mapReportReasons(reasons ?? []);

    return (
        <ReasonModal
            isOpen={isOpen}
            title="Report Stream"
            options={options}
            usersToReport={usersToReport}
            requiresNoteIds={requiresNoteIds}
            confirmLabel="Submit Report"
            confirmClassName="bg-[#FF7700] text-black hover:bg-[#ff9922]"
            isLoading={isLoading || isReasonsLoading}
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
};

/** Report chat message modal — fetches reasons from API */
export const ReportChatModal = ({
    isOpen,
    username,
    isLoading,
    onConfirm,
    onCancel,
}: {
    isOpen: boolean;
    username?: string;
    isLoading?: boolean;
    onConfirm: (reasonId: string, otherText?: string) => void;
    onCancel: () => void;
}) => {
    const { data: reasons, isLoading: isReasonsLoading } = useReportReasons();
    const { options, requiresNoteIds } = mapReportReasons(reasons ?? []);

    return (
        <ReasonModal
            isOpen={isOpen}
            title={username ? `Report @${username}` : 'Report Message'}
            options={options}
            requiresNoteIds={requiresNoteIds}
            confirmLabel="Submit Report"
            confirmIcon={<Flag className="w-4 h-4" />}
            confirmClassName="bg-[#FF7700] text-black hover:bg-[#ff9922]"
            isLoading={isLoading || isReasonsLoading}
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
};

export const ReportLimitModal = ({
    isOpen,
    onTryLater,
    onExplore,
}: {
    isOpen: boolean;
    onTryLater: () => void;
    onExplore: () => void;
}) => {
    const isMobile = useIsMobile();

    if (!isOpen) return null;

    const content = (
        <div className="flex flex-col items-center text-center">
            <div className="relative mb-6 w-24 h-24 flex items-center justify-center">
                <AlarmClock className="w-full h-full text-[#8c8c8c]" strokeWidth={1.5} />
                <div
                    className="absolute bg-[#FF0000] rounded-full flex items-center justify-center"
                    style={{
                        width: '60%',
                        height: '60%',
                        top: '54%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                >
                    <span className="text-white text-4xl font-black font-sans relative z-10 mb-1">!</span>
                </div>
            </div>

            <h2 className="text-white text-2xl font-bold mb-3">Report Limit Reached</h2>
            <p className="text-gray-400 text-[15px] mb-8">
                You've reported too many times. Try later.
            </p>

            <div className="flex gap-4 w-full mt-2">
                <button
                    onClick={onTryLater}
                    className="flex-1 py-3.5 rounded-full bg-[#FF7700] text-black text-[15px] font-bold hover:bg-[#ff9922] transition-all cursor-pointer"
                >
                    Try Later
                </button>
                <button
                    onClick={onExplore}
                    className="flex-1 py-3.5 rounded-full border-2 border-[#FF7700] text-[#FF7700] bg-transparent text-[15px] font-bold hover:bg-white/5 transition-all cursor-pointer"
                >
                    Explore
                </button>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && onTryLater()}>
                <DrawerContent className="bg-[#18191f] border-t border-white/10 rounded-t-3xl px-6 pb-8 z-[100005]">
                    <DrawerHeader className="pt-2 pb-4 sr-only">
                        <DrawerTitle>Report Limit Reached</DrawerTitle>
                        <DrawerDescription>You've reported too many times. Try later.</DrawerDescription>
                    </DrawerHeader>
                    {content}
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onTryLater()}>
            <DialogContent showCloseButton={false} className="bg-[#18191f] border-white/10 rounded-3xl p-10 w-full max-w-md shadow-2xl flex flex-col items-center text-center z-[100005]">
                <DialogTitle className="sr-only">Report Limit Reached</DialogTitle>
                {content}
            </DialogContent>
        </Dialog>
    );
};

export const ReportSuccessModal = ({
    isOpen,
    username,
    type,
    onMute,
    onBlock,
    onExplore,
    onClose,
}: {
    isOpen: boolean;
    username: string;
    type: 'chat' | 'other';
    onMute?: () => void;
    onBlock?: () => void;
    onExplore?: () => void;
    onClose: () => void;
}) => {
    const isMobile = useIsMobile();

    if (!isOpen) return null;

    const content = (
        <div className="flex flex-col items-center text-center">
            <h2 className="text-white text-2xl font-bold mb-6 leading-snug p-2">
                You Reported @{username} <br />
                Successfully
            </h2>
            <p className="text-gray-400 text-[15px] mb-8 leading-relaxed max-w-[280px]">
                We appreciate you helping us keep PulseLive Safe.
            </p>

            {type === 'chat' ? (
                <div className="flex gap-4 w-full mt-2">
                    <button
                        onClick={() => { onMute?.(); onClose(); }}
                        className="flex-1 py-3.5 rounded-full bg-[#FF7700] text-black text-[15px] font-bold hover:bg-[#ff9922] transition-all cursor-pointer"
                    >
                        Mute User
                    </button>
                    <button
                        onClick={() => { onBlock?.(); onClose(); }}
                        className="flex-1 py-3.5 rounded-full border-2 border-[#FF7700] text-[#FF7700] bg-transparent text-[15px] font-bold hover:bg-white/5 transition-all cursor-pointer"
                    >
                        Block User
                    </button>
                </div>
            ) : (
                <div className="w-full flex justify-center mt-2">
                    <button
                        onClick={() => { onExplore?.(); onClose(); }}
                        className="px-8 py-3.5 rounded-full bg-[#FF7700] text-black text-[15px] font-bold hover:bg-[#ff9922] transition-all cursor-pointer"
                    >
                        Explore More
                    </button>
                </div>
            )}
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
                <DrawerContent className="bg-[#18191f] border-t border-white/10 rounded-t-3xl px-6 pb-8 z-[100005]">
                    <DrawerHeader className="pt-2 pb-4 sr-only">
                        <DrawerTitle>Report Successful</DrawerTitle>
                        <DrawerDescription>You have successfully reported {username}</DrawerDescription>
                    </DrawerHeader>
                    {content}
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className="bg-[#18191f] border-white/10 rounded-3xl p-10 w-full max-w-md shadow-2xl flex flex-col items-center text-center z-[100005]">
                <DialogTitle className="sr-only">Report Successful</DialogTitle>
                {content}
            </DialogContent>
        </Dialog>
    );
};

export const ReportFailureModal = ({
    isOpen,
    onTryAgain,
    onCancel,
}: {
    isOpen: boolean;
    onTryAgain: () => void;
    onCancel: () => void;
}) => {
    const isMobile = useIsMobile();

    if (!isOpen) return null;

    const content = (
        <div className="flex flex-col items-center text-center p-2">
            <svg width="84" height="74" viewBox="0 0 100 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-6">
                <path d="M42.3 6.4C45.9 -0.1 54.1 -0.1 57.7 6.4L95.7 75.4C99.2 81.7 94.3 89.5 87 89.5H13C5.7 89.5 0.8 81.7 4.3 75.4L42.3 6.4Z" fill="#FF0000" />
                <path d="M46 25L48 55H52L54 25H46Z" fill="white" />
                <rect x="47" y="62" width="6" height="8" fill="white" />
            </svg>

            <h2 className="text-white text-2xl font-bold mb-4">Report Failed</h2>
            <p className="text-gray-400 text-[15px] mb-8 leading-relaxed max-w-[280px]">
                Your report could not be submitted at this time. Please try again later.
            </p>

            <div className="flex gap-4 w-full">
                <button
                    onClick={onTryAgain}
                    className="flex-1 py-3.5 rounded-full bg-[#FF7700] text-black text-[15px] font-bold hover:bg-[#ff9922] transition-all cursor-pointer"
                >
                    Try Again
                </button>
                <button
                    onClick={onCancel}
                    className="flex-1 py-3.5 rounded-full border-2 border-[#FF7700] text-[#FF7700] bg-transparent text-[15px] font-bold hover:bg-white/5 transition-all cursor-pointer"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={(open: boolean) => !open && onCancel()}>
                <DrawerContent className="bg-[#18191f] border-t border-white/10 rounded-t-3xl px-6 pb-8 z-[100005]">
                    <DrawerHeader className="pt-3 pb-4 sr-only">
                        <DrawerTitle>Report Failed</DrawerTitle>
                        <DrawerDescription>Your report failed to submit.</DrawerDescription>
                    </DrawerHeader>
                    {content}
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent showCloseButton={false} className="bg-[#18191f] border-white/10 rounded-3xl p-10 w-full max-w-md shadow-2xl flex flex-col items-center text-center z-[100005]">
                <DialogTitle className="sr-only">Report Failed</DialogTitle>
                {content}
            </DialogContent>
        </Dialog>
    );
};
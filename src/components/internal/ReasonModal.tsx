import { useState } from 'react';
import { Trash2, Flag } from 'lucide-react';
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

// ---- Types ----

interface ReasonOption {
    id: string;
    label: string;
}

interface ReasonModalProps {
    isOpen: boolean;
    title: string;
    options: ReasonOption[];
    confirmLabel: string;
    confirmIcon?: React.ReactNode;
    confirmClassName?: string;
    /** IDs of options that require additional text */
    requiresNoteIds?: string[];
    othersPlaceholder?: string;
    isLoading?: boolean;
    onConfirm: (selectedId: string, otherText?: string) => void;
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
}) => {
    const requiresNote = selected ? requiresNoteIds.includes(selected) : false;
    const canSubmit = !!selected && (!requiresNote || otherText.trim().length > 0);

    return (
        <>
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
    const isMobile = useIsMobile();

    if (!isOpen) return null;

    const requiresNote = selected ? requiresNoteIds.includes(selected) : false;
    const canSubmit = !!selected && (!requiresNote || otherText.trim().length > 0);

    const handleConfirm = () => {
        if (!canSubmit) return;
        onConfirm(selected, requiresNote ? otherText : undefined);
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
        <div className="fixed inset-0 z-400 flex items-center justify-center" style={{ zIndex: 9999 }}>
            <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
            <div className="relative bg-[#18191f] border border-white/10 rounded-2xl px-10 py-8 w-full max-w-lg mx-4 shadow-2xl">
                <h3 className="text-white text-xl font-bold mb-6 text-center leading-snug">{title}</h3>
                <div className="h-px bg-white/10 mb-5 -mx-8" />
                <ReasonModalContent {...sharedProps} />
            </div>
        </div>
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
    onConfirm,
    onCancel,
}: {
    isOpen: boolean;
    isLoading?: boolean;
    onConfirm: (reasonId: string, otherText?: string) => void;
    onCancel: () => void;
}) => {
    const { data: reasons, isLoading: isReasonsLoading } = useReportReasons();
    const { options, requiresNoteIds } = mapReportReasons(reasons ?? []);

    return (
        <ReasonModal
            isOpen={isOpen}
            title="Report Stream"
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
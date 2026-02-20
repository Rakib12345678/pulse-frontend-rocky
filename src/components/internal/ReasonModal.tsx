import { useState } from 'react';
import { Trash2 } from 'lucide-react';

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
    othersId?: string;
    othersPlaceholder?: string;
    isLoading?: boolean;
    onConfirm: (selectedId: string, otherText?: string) => void;
    onCancel: () => void;
}

export const ReasonModal = ({
    isOpen,
    title,
    options,
    confirmLabel,
    confirmIcon,
    confirmClassName = 'bg-[#FF7700] text-black hover:bg-[#ff9922]',
    othersId = 'others',
    othersPlaceholder = 'Text',
    isLoading,
    onConfirm,
    onCancel,
}: ReasonModalProps) => {
    const [selected, setSelected] = useState<string>('');
    const [otherText, setOtherText] = useState('');

    if (!isOpen) return null;

    const isOthers = selected === othersId;
    const canSubmit = !!selected;

    const handleConfirm = () => {
        if (!canSubmit) return;
        onConfirm(selected, isOthers ? otherText : undefined);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70" onClick={onCancel} />

            <div className="relative bg-[#18191f] border border-white/10 rounded-2xl px-10 py-8 w-full max-w-lg mx-4 shadow-2xl">
                <h3 className="text-white text-xl font-bold mb-6 text-center leading-snug">{title}</h3>

                {/* Divider */}
                <div className="h-px bg-white/10 mb-5 -mx-8" />

                {/* Options */}
                <div className="flex flex-col gap-4 mb-10">
                    {options.map((opt) => (
                        <label
                            key={opt.id}
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => setSelected(opt.id)}
                        >
                            {/* Custom radio */}
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                selected === opt.id
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

                    {/* Others text area */}
                    {isOthers && (
                        <div className="mt-1">
                            <textarea
                                value={otherText}
                                onChange={(e) => {
                                    if (e.target.value.length <= 100) setOtherText(e.target.value);
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
                <div className="flex gap-3 mt-5">
                    <button
                        onClick={handleConfirm}
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
            </div>
        </div>
    );
};

// Pre-configured modals 

const REPORT_OPTIONS = [
    { id: 'sexual_content', label: 'Sexual Content' },
    { id: 'reason_2', label: "i don't know" },
    { id: 'reason_3', label: "i don't know" },
    { id: 'reason_4', label: "i don't know" },
    { id: 'others', label: 'Others' },
];

// const DEACTIVATE_OPTIONS = [
//     { id: 'different_account', label: 'I want to use a different account' },
//     { id: 'I no longer find it useful', label: "I no longer find it useful" },
//     { id: 'reason_3', label: "i don't know" },
//     { id: 'reason_4', label: "i don't know" },
//     { id: 'others', label: 'Others' },
// ];

const DELETE_OPTIONS = [
    { id: 'not_useful', label: 'I no longer find it useful' },
    { id: 'privacy_concerns', label: 'Privacy or security concerns' },
    { id: 'switching_platform', label: 'Switching to another platform' },
    { id: 'bad_experience', label: 'Had a bad experience' },
    { id: 'others', label: 'Others' },
];

/** Report user modal */
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
}) => (
    <ReasonModal
        isOpen={isOpen}
        title={`Report @${username}`}
        options={REPORT_OPTIONS}
        confirmLabel="Submit Report"
        confirmClassName="bg-[#FF7700] text-black hover:bg-[#ff9922]"
        isLoading={isLoading}
        onConfirm={onConfirm}
        onCancel={onCancel}
    />
);

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
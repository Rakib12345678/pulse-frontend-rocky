interface SuccessModalProps {
    isOpen: boolean;
    icon?: React.ReactNode;
    title: string;
    description?: string;
    buttonLabel: string;
    onAction: () => void;
}

export const SuccessModal = ({
    isOpen,
    icon,
    title,
    description,
    buttonLabel,
    onAction,
}: SuccessModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/70" />
            <div className="relative bg-[#1e2028] rounded-2xl p-10 w-full max-w-md mx-4 shadow-2xl flex flex-col items-center text-center">

                {icon && (
                    <div className="mb-5 text-white/60">
                        {icon}
                    </div>
                )}

                <h3 className="text-white text-2xl font-bold leading-snug mb-4">{title}</h3>

                {description && (
                    <p className="text-gray-400 text-sm leading-relaxed mb-8">{description}</p>
                )}

                <button
                    onClick={onAction}
                    className="w-40 py-3.5 rounded-full bg-[#FF7700] text-black text-sm font-bold hover:bg-[#ff9922] transition-all active:scale-95 cursor-pointer"
                >
                    {buttonLabel}
                </button>
            </div>
        </div>
    );
};
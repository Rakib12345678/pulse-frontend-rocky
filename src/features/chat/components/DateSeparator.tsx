export const DateSeparator = ({ label }: { label: string }) => (
    <div className="flex items-center gap-3 my-2">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-[11px] text-gray-500 font-medium px-2 shrink-0">{label}</span>
        <div className="flex-1 h-px bg-white/8" />
    </div>
);

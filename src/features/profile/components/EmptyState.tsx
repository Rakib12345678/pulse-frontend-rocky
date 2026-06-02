import { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-start text-center px-6">
      <div className="mb-3 flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full">
        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
      </div>

      <h3 className="text-lg sm:text-2xl font-bold mb-2 text-white">
        {title}
      </h3>

      {description && (
        <p className="text-muted-foreground text-sm sm:text-base max-w-md mb-6">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-[#FF7700] text-[#111213] px-6 py-2.5 sm:px-8 sm:py-3 text-sm sm:text-base rounded-full font-medium hover:opacity-90 transition cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

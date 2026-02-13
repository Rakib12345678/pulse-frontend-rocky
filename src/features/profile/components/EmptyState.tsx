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
      <div className="mb-3 flex items-center justify-center w-16 h-16 rounded-full">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>

      <h3 className="text-2xl font-bold mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-[#FF7700] text-[#111213] px-8 py-3 rounded-full font-medium hover:opacity-90 transition"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

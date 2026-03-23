import React from 'react';
import { UserCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvatarProps {
    src?: string | null;
    alt?: string;
    className?: string;
}

export const Avatar = ({ src, alt = '', className = '' }: AvatarProps) => {
    const [broken, setBroken] = React.useState(false);
    React.useEffect(() => { setBroken(false); }, [src]);

    if (!src || broken) {
        return (
            <div className={cn('rounded-full bg-white/10 flex items-center justify-center shrink-0', className)}>
                <UserCircle2 className="w-[55%] h-[55%] text-gray-500" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={cn('rounded-full object-cover shrink-0', className)}
            onError={() => setBroken(true)}
        />
    );
};
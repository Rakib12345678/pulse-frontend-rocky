import React from 'react';

interface ExploreSectionProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    hasBackground?: boolean;
}

export const ExploreSection: React.FC<ExploreSectionProps> = ({ title, children, className, hasBackground }) => {
    return (
        <section className={`mb-12 last:mb-0 ${className} ${hasBackground ? 'py-12' : ''} relative`}>
            {hasBackground && (
                <div className="absolute inset-0 bg-[#1A1C1E] border-y border-white/5 w-screen left-1/2 -translate-x-1/2 -z-10" />
            )}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10">
                <h2 className="text-white font-bold text-2xl mb-6">{title}</h2>
                {children}
            </div>
        </section>
    );
};

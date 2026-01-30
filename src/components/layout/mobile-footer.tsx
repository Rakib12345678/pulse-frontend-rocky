// src/components/layout/MobileFooter.tsx
import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Home, Users, Compass, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterLinkProps {
    to: string;
    label: string;
    icon: React.ElementType;
}

const FooterLink = ({ to, label, icon: Icon }: FooterLinkProps) => {
    const { pathname } = useLocation();

    const isActive = pathname === to;

    return (
        <Link
            to={to}
            className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive ? "text-white" : "text-[#888888] hover:text-gray-300"
            )}
        >
            <Icon
                className="h-6 w-6"
                strokeWidth={isActive ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">{label}</span>
        </Link>
    );
};


export const MobileFooter: React.FC = () => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 w-full border-t border-white/5 bg-[#0f1117]/95 backdrop-blur-lg md:hidden">
            <div className="flex h-full items-center justify-around px-2">
                <FooterLink to="/for-you" label="For You" icon={Home} />
                <FooterLink to="/following" label="Following" icon={Users} />
                <FooterLink to="/explore" label="Explore" icon={Compass} />
                <FooterLink to="/chats" label="Chats" icon={MessageCircle} />
            </div>
        </nav>
    );
};
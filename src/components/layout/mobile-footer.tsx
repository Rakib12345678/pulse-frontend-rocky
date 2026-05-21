import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import LiveVideo from '@/assets/Live.svg';
import { cn } from '@/lib/utils';
import { useGoLive } from '@/features/profile/hooks/useGoLive';
import ForYouSvg from '@/assets/ForYouOutline.svg';
import ExploreSvg from '@/assets/Search.svg';
import ChatSvg from '@/assets/Group.svg';
import UserSvg from '@/assets/user.svg';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { useTotalUnreadCount } from '@/features/chat/hooks/useTotalUnreadCount';

// ------ Nav Item ---------
interface NavItemProps {
    to: string;
    label: string;
    customIcon?: React.ReactNode;
    onClick?: () => void;
    badgeCount?: number;
}

const NavItem = ({ to, label, customIcon, onClick, badgeCount = 0 }: NavItemProps) => {
    const { pathname } = useLocation();
    const isActive = pathname === to;
    const { isOpen: isModalOpen, currentStep, closeModal } = useSignUpStore();

    const handleClick = () => {
        if (isModalOpen && currentStep === 'welcome') {
            closeModal();
        }
        if (onClick) {
            onClick();
        }
    };

    const content = (
        <div className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors">
            <div
                className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                    isActive && to === '/for-you' ? "bg-[#1D1F20]" : "bg-transparent"
                )}
            >
                <div className="relative">
                    {customIcon}
                    {badgeCount > 0 && (
                        <span className={cn(
                            "absolute -top-2.5 flex h-[17px] items-center justify-center rounded-full bg-[#FF7700] font-black text-white border-1 border-[#111213] shadow-lg z-20 leading-none transition-all duration-200",
                            badgeCount < 10 
                                ? "w-[17px] -right-1 text-[11px]" 
                                : "min-w-[26px] -right-3.5 px-1.5 text-[9.5px]"
                        )}>
                            {badgeCount > 999 ? '999+' : badgeCount}
                        </span>
                    )}
                </div>
            </div>
            <span
                className={cn(
                    "text-[10px] font-semibold tracking-wide",
                    isActive ? "text-[#FF6B00]" : "text-[#666666]"
                )}
            >
                {label}
            </span>
        </div>
    );

    if (onClick) {
        return (
            <button
                onClick={handleClick}
                className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors cursor-pointer"
            >
                {content}
            </button>
        );
    }

    return (
        <Link to={to} onClick={handleClick} className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors">
            {content}
        </Link>
    );
};

// ------- Mobile Footer -------
export const MobileFooter: React.FC = () => {
    const handleGoLiveClick = useGoLive();
    const { pathname } = useLocation();
    const { isAuthenticated, accessToken } = useAuthStore();
    const { openModal, closeModal, setStep, setMode, isOpen: isModalOpen, currentStep } = useSignUpStore();
    const totalUnreadCount = useTotalUnreadCount();
    const prevPathname = useRef(pathname);

    useEffect(() => {
        if (pathname !== prevPathname.current) {
            prevPathname.current = pathname;
            if (isModalOpen && currentStep === 'welcome') {
                closeModal();
            }
        }
    }, [pathname, isModalOpen, currentStep, closeModal]);

    const isChatWindowOpen = false; // overlay handles coverage via z-index

    const isLoggedIn = isAuthenticated && !!accessToken;
    
    if ((isModalOpen && currentStep !== 'welcome') || pathname.startsWith('/live') || isChatWindowOpen) {
        return null;
    }

    const handleProfileClick = () => {
        if (!isLoggedIn) {
            const { pausedForLegal, resumeModal } = useSignUpStore.getState();
            if (pausedForLegal) {
                resumeModal();
                return;
            }
            setMode('login');
            setStep('welcome');
            openModal();
        }
    };

    const activeFilter = 'brightness(0) saturate(100%) invert(54%) sepia(93%) saturate(748%) hue-rotate(357deg) brightness(101%) contrast(101%)';

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-300 h-18 w-full border-t border-white/6 bg-black/20 backdrop-blur-2xl md:hidden">
            {/* iOS home indicator */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-white/20" />

            <div className="flex h-full items-center justify-around px-2 pb-1">

                {/* For You */}
                <NavItem
                    to="/for-you"
                    label="For You"
                    customIcon={
                        <img
                            src={ForYouSvg}
                            alt="For You"
                            className="h-5.75 w-5.75"
                            style={{ filter: pathname === '/for-you' ? activeFilter : 'none' }}
                        />
                    }
                />

                {/* Explore */}
                <NavItem
                    to="/explore"
                    label="Explore"
                    customIcon={
                        <img
                            src={ExploreSvg}
                            alt="Explore"
                            className="h-5.75 w-5.75"
                            style={{ filter: pathname === '/explore' ? activeFilter : 'none' }}
                        />
                    }
                />

                {/* Go Live FAB */}
                <div className="flex flex-col items-center justify-center flex-1 h-full rounded-full transition-colors">
                    <button
                        onClick={handleGoLiveClick}
                        className="relative flex items-center justify-center w-15 h-15 rounded-full -mt-16 active:scale-95 transition-transform cursor-pointer shadow-[0_4px_20px_rgba(255,119,0,0.4)]"
                    >
                        <img
                            src={LiveVideo}
                            alt="Go Live"
                            className="h-full w-full rounded-full object-cover"
                        />
                    </button>
                </div>

                {/* Chat */}
                <NavItem
                    to="/chats"
                    label="Chat"
                    badgeCount={totalUnreadCount}
                    customIcon={
                        <img
                            src={ChatSvg}
                            alt="Chat"
                            className="h-5.75 w-5.75"
                            style={{ filter: pathname === '/chats' ? activeFilter : 'none' }}
                        />
                    }
                />

                {/* Profile */}
                {isLoggedIn ? (
                    <NavItem
                        to="/profile"
                        label="Profile"
                        customIcon={
                            <img
                                src={UserSvg}
                                alt="Profile"
                                className="h-5.75 w-5.75"
                                style={{ filter: pathname === '/profile' ? activeFilter : 'none' }}
                            />
                        }
                    />
                ) : (
                    <NavItem
                        to="/profile"
                        label="Profile"
                        onClick={handleProfileClick}
                        customIcon={
                            <img
                                src={UserSvg}
                                alt="Profile"
                                className="h-5.75 w-5.75"
                                style={{ filter: 'none' }}
                            />
                        }
                    />
                )}
            </div>
        </nav>
    );
};
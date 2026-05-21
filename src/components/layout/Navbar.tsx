import React, { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import {
  // Bell,
  User,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { cn } from '@/lib/utils';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';

import Logo from "@/assets/Logo.png";
import LogoText from "@/assets/LogoText.svg";
import coinIcon from "@/assets/coin.svg";
import { LogoutModal } from '../internal/ConfirmModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCoinsStore } from '@/features/coins/hooks/useCoinsStore';
import { useWalletBalance } from '@/features/coins/hooks/useWallet';
import { AddCoinsModal } from '@/features/coins/components/AddCoinsModal';
import { useTotalUnreadCount } from '@/features/chat/hooks/useTotalUnreadCount';

interface NavLinkProps {
  to: string;
  label: string;
  badgeCount?: number;
}

const NavLink = ({ to, label, badgeCount = 0 }: NavLinkProps) => {
  const { pathname } = useLocation();
  const isActive = pathname === to;
  const { isOpen: isModalOpen, currentStep, closeModal } = useSignUpStore();

  const handleClick = () => {
    if (isModalOpen && currentStep === 'welcome') {
      closeModal();
    }
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={cn(
        "group flex flex-col items-center justify-center px-4 py-2 transition-colors relative",
        isActive ? "text-white" : "text-[#888888] hover:text-white"
      )}
    >
      <span className="relative flex items-center">
        <span className={cn(
          "text-[15px] font-medium whitespace-nowrap",
          isActive ? "text-white" : "text-muted-foreground group-hover:text-white"
        )}>
          {label}
        </span>
        {badgeCount > 0 && (
          <span className={cn(
            "absolute -top-2.5 flex h-[19px] items-center justify-center rounded-full bg-[#FF7700] font-black text-white border-1.5 border-[#0f1117] shadow-xl z-20 leading-none transition-all duration-200",
            badgeCount < 10
              ? "w-[19px] -right-4 text-[11px]"
              : "min-w-[30px] -right-6.5 px-2 text-[10px]"
          )}>
            {badgeCount > 999 ? '999+' : badgeCount}
          </span>
        )}
      </span>
    </Link>
  );
};

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, wallet, clearAuth, accessToken, isNewUser } = useAuthStore();
  const { data: walletData } = useWalletBalance();
  const { reset: resetSignUp } = useSignUpStore();
  const { openModal: openCoinsModal } = useCoinsStore();
  const queryClient = useQueryClient();

  const [hasMounted, setHasMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isMobile = useIsMobile();
  const totalUnreadCount = useTotalUnreadCount();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { openModal, closeModal, setStep, setMode, isOpen: isModalOpen, currentStep, pausedForLegal, resumeModal } = useSignUpStore();

  const shouldHide = isMobile && isModalOpen && currentStep !== 'welcome';

  const handleSignUpClick = () => {
    if (pausedForLegal) {
      resumeModal();
      navigate({ to: '/for-you' });
      return;
    }
    setMode('signup');
    setStep('welcome');
    openModal();
  };

  const handleLoginClick = () => {
    if (pausedForLegal) {
      resumeModal();
      navigate({ to: '/for-you' });
      return;
    }
    setMode('login');
    setStep('input');
    openModal();
  };

  const handleLogout = () => {
    clearAuth();
    resetSignUp();
    // Remove cached wallet data so the next login always fetches fresh balance from backend
    queryClient.removeQueries({ queryKey: ['walletBalance'] });
    setShowLogoutConfirm(false);
    navigate({ to: '/' });
  };


  const isLoggedIn = isAuthenticated && !!accessToken && !isNewUser;
  const { pathname } = useLocation();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      if (isModalOpen && currentStep === 'welcome') {
        closeModal();
      }
    }
  }, [pathname, isModalOpen, currentStep, closeModal]);

  if (shouldHide) return null;

  if ((pathname === '/profile/setting' && isMobile)) {
    return null;
  }

  return (
    <>
      <LogoutModal
        isOpen={showLogoutConfirm}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      <AddCoinsModal />

      <header className="sticky top-0 z-50 w-full bg-[#0f1117] border-b border-white/5">
        <div className="flex h-18 w-full items-center justify-between px-4 lg:px-8">

          {/* ================= LEFT SECTION: Logo ================= */}
          <div className="flex items-center shrink-0">
            <Link
              to="/"
              onClick={() => {
                if (isModalOpen && currentStep === 'welcome') {
                  closeModal();
                }
              }}
              className="flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <img src={LogoText} alt="PulseLive" className="hidden md:block h-20 w-36" />
              <img src={Logo} alt="PulseLive" className="block md:hidden h-9 w-9" />
              <span className="block md:hidden text-white font-bold text-lg">PulseLive</span>
            </Link>
          </div>

          {/* ================= CENTER SECTION: Navigation ================= */}
          <div className="hidden md:flex flex-row items-center gap-8 lg:gap-16">
            <NavLink to="/for-you" label="For You" />
            <NavLink to="/explore" label="Explore" />
            <NavLink to="/chats" label="Chats" badgeCount={totalUnreadCount} />
          </div>

          {/* ================= RIGHT SECTION: Auth & Profile ================= */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">

            {/* Wait for client hydration before rendering auth UI */}
            {!hasMounted ? (
              <div className="w-10 md:w-45" /> /* Placeholder to prevent layout shift */
            ) : !isLoggedIn ? (
              <div className="flex items-center gap-2 md:gap-3">
                <Button
                  onClick={handleSignUpClick}
                  variant="ghost"
                  className="whitespace-nowrap px-6 py-2 rounded-full border border-[#FF8800] text-[#FF8800] text-sm font-semibold hover:bg-[#FF8800]/10 transition-all cursor-pointer bg-transparent hover:text-[#FF8800]"
                >
                  Sign up
                </Button>
                <Button
                  onClick={handleLoginClick}
                  variant="ghost"
                  className="whitespace-nowrap px-6 py-2 rounded-full bg-[#FF8800] text-black text-sm font-bold hover:bg-[#ff9922] transition-all shadow-[0_0_15px_rgba(255,136,0,0.3)] cursor-pointer hover:text-black"
                >
                  Log in
                </Button>
              </div>
            ) : (
              /* LOGGED IN VIEW */
              <>
                {/* Mobile Specific - Coin Pill & Plus Button */}
                <div className="flex md:hidden items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={openCoinsModal}
                    className="flex items-center gap-2 pl-3 pr-2 py-1.5 h-9 rounded-full bg-[#1A1C1E] hover:bg-[#2D2D2D] transition-colors cursor-pointer border-0"
                  >
                    <div className="flex items-center gap-1.5">
                      <img src={coinIcon} alt="coin" className="w-4 h-4" />
                      <span className="text-white text-sm font-bold">{(walletData?.coinBalance ?? wallet?.coinBalance ?? 0).toLocaleString()}</span>
                    </div>
                    <Plus className="w-3.5 h-3.5 text-white/50" />
                  </Button>

                  {pathname.startsWith('/chats') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8.5 h-8.5 rounded-full bg-[#FF7700] hover:bg-[#ff9922] flex items-center justify-center p-0 transition-all active:scale-95 cursor-pointer shadow-lg hover:text-black"
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-new-chat'));
                      }}
                    >
                      <Plus className="w-5 h-5 text-black stroke-[3]" />
                    </Button>
                  )}
                </div>

                {/* Desktop View - Existing Layout */}
                <div className="hidden md:flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={openCoinsModal}
                    className="flex items-center gap-3 pl-4 pr-1.5 py-1.5 h-auto rounded-full bg-[#1A1C1E]/80 hover:bg-[#2D2D2D] transition-colors cursor-pointer border-0"
                  >
                    <span className="hidden sm:inline-block text-white text-[15px] font-medium tracking-wide">My Balance</span>
                    <div className="flex items-center gap-1.5">
                      <img src={coinIcon} alt="coin" className="w-5 h-5" />
                      <span className="text-white text-[15px] font-semibold">{(walletData?.coinBalance ?? wallet?.coinBalance ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center ml-1">
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                  </Button>
                  {/* Notifications
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex relative p-2 text-gray-400 hover:text-white transition-colors cursor-pointer hover:bg-transparent h-auto w-auto"
                >
                  <Bell className="h-6 w-6" />
                  <span className="absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-[#0f1117]" />
                </Button> */}

                  {/* Profile Link */}
                  <Link
                    to="/profile"
                    onClick={() => {
                      if (isModalOpen && currentStep === 'welcome') {
                        closeModal();
                      }
                    }}
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white/10 transition-transform hover:scale-105 active:scale-95 cursor-pointer bg-neutral-800 p-0"
                  >
                    {user?.profileImage ? (
                      <img
                        src={user?.profileImage}
                        alt={user?.displayName || user?.username || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-white" />
                    )}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
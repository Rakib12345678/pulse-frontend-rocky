import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import {
  Bell,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { cn } from '@/lib/utils';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';

import Logo from "@/assets/Logo.png";
import LogoText from "@/assets/LogoText.svg";
import { LogoutModal } from '../internal/ConfirmModal';
import { useIsMobile } from '@/hooks/use-mobile';

interface NavLinkProps {
  to: string;
  label: string;
}

const NavLink = ({ to, label }: NavLinkProps) => {
  const { pathname } = useLocation();
  const isActive = pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "group flex flex-col items-center justify-center px-4 py-2 transition-colors",
        isActive ? "text-white" : "text-[#888888] hover:text-white"
      )}
    >
      <span className={cn(
        "text-[15px] font-medium whitespace-nowrap",
        isActive ? "text-white" : "text-muted-foreground group-hover:text-white"
      )}>
        {label}
      </span>
    </Link>
  );
};

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, clearAuth, accessToken } = useAuthStore();
  const { reset: resetSignUp } = useSignUpStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { openModal, setStep, setMode, isOpen: isModalOpen, currentStep } = useSignUpStore();

  const shouldHide = isMobile && isModalOpen && currentStep !== 'welcome';

  const handleSignUpClick = () => {
    setMode('signup');
    setStep('welcome');
    openModal();
  };

  const handleLoginClick = () => {
    setMode('login');
    setStep('input');
    openModal();
  };

  const handleLogout = () => {
    clearAuth();
    resetSignUp();
    setIsDropdownOpen(false);
    setShowLogoutConfirm(false);
    navigate({ to: '/' });
  };

  // ── Settings navigation ──
  const handleSettingsClick = () => {
    setIsDropdownOpen(false);
    navigate({ to: '/profile/setting' });
  };

  const isLoggedIn = isAuthenticated && !!accessToken;
  const { pathname } = useLocation();

  if (shouldHide) return null;

  if ((pathname === '/profile/setting' && isMobile) || pathname.startsWith('/live')) {
    return null;
  }

  return (
    <>
      <LogoutModal
        isOpen={showLogoutConfirm}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      <header className="sticky top-0 z-50 w-full bg-[#0f1117] border-b border-white/5">
        <div className="flex h-18 w-full items-center justify-between px-4 lg:px-8">

          {/* ================= LEFT SECTION: Logo ================= */}
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <img src={LogoText} alt="PulseLive" className="hidden md:block h-20 w-36" />
              <img src={Logo} alt="PulseLive" className="block md:hidden h-9 w-9" />
              <span className="block md:hidden text-white font-bold text-lg">PulseLive</span>
            </Link>
          </div>

          {/* ================= CENTER SECTION: Navigation ================= */}
          <div className="hidden md:flex flex-row items-center gap-8 lg:gap-16">
            <NavLink to="/for-you" label="For You" />
            <NavLink to="/explore" label="Explore" />
            <NavLink to="/chats" label="Chats" />
          </div>

          {/* ================= RIGHT SECTION: Auth & Profile ================= */}
          <div className="hidden md:flex items-center gap-4 shrink-0">

            {/* Wait for client hydration before rendering auth UI */}
            {!hasMounted ? (
              <div className="hidden md:block w-45" /> /* Placeholder to prevent layout shift */
            ) : !isLoggedIn ? (
              <div className="hidden md:flex items-center gap-3">
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
                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative p-2 text-gray-400 hover:text-white transition-colors cursor-pointer hover:bg-transparent h-auto w-auto"
                >
                  <Bell className="h-6 w-6" />
                  {/* Notification count later on*/}
                  <span className="absolute right-2 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-[#0f1117]" />
                </Button>

                {/* Profile Dropdown */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-white/10 transition-transform hover:scale-105 active:scale-95 cursor-pointer bg-neutral-800 hover:bg-neutral-800 p-0"
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
                  </Button>

                  {isDropdownOpen && (
                    <>
                      {/* Invisible backdrop to close dropdown */}
                      <div
                        className="fixed inset-0 z-[-1]"
                        onClick={() => setIsDropdownOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-3 w-64 origin-top-right rounded-xl border border-white/10 bg-[#1a1c24] p-1 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-sm font-bold text-white truncate">
                            {user?.displayName || user?.username || 'User'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {user?.email || user?.phone || 'Account verified'}
                          </p>
                        </div>

                        <div className="p-1">
                          <Link
                            to="/profile"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            <User className="h-4 w-4" />
                            My Profile
                          </Link>
                          <button
                            onClick={handleSettingsClick}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                          >
                            <Settings className="h-4 w-4" />
                            Settings
                          </button>
                        </div>

                        <div className="p-1 border-t border-white/5">
                          <button
                            onClick={() => {
                              setIsDropdownOpen(false);
                              setShowLogoutConfirm(true);
                            }}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          >
                            <LogOut className="h-4 w-4" />
                            Log Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
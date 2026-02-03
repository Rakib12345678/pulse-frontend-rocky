import React, { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
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

import Logo from "@/assets/Logo.svg";
import LogoText from "@/assets/LogoText.svg";

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
  // 1. Single Source of Truth from Unified Auth Store
  const { isAuthenticated, user, clearAuth, accessToken } = useAuthStore();

  // 2. Local UI State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 3. Modal Controls
  const { openModal: openSignUpModal, setStep: setSignUpStep, setMode: setSignUpMode } = useSignUpStore();

  const handleSignUpClick = () => {
    setSignUpMode('signup');
    setSignUpStep('welcome');
    openSignUpModal();
  };

  const handleLoginClick = () => {
    setSignUpMode('login');
    setSignUpStep('input');
    openSignUpModal();
  };

  // Helper for Logout
  const handleLogout = () => {
    clearAuth();
    setIsDropdownOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0f1117] border-b border-white/5">
      <div className="flex h-[72px] w-full items-center justify-between px-4 lg:px-8">

        {/* ================= LEFT SECTION: Logo ================= */}
        <div className="flex items-center shrink-0">
          <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="flex items-center gap-2">
              <img src={LogoText} alt="PulseLive" className="hidden md:block h-20 w-36" />
              <img src={Logo} alt="PulseLive" className="block md:hidden h-9 w-9" />
            </div>
          </Link>
        </div>

        {/* ================= CENTER SECTION: Navigation ================= */}
        <div className="hidden md:flex flex-row items-center gap-8 lg:gap-16">
          <NavLink to="/for-you" label="For You" />
          <NavLink to="/following" label="Following" />
          <NavLink to="/explore" label="Explore" />
          <NavLink to="/chats" label="Chats" />
        </div>

        {/* ================= RIGHT SECTION: Auth & Profile ================= */}
        <div className="flex items-center gap-4 shrink-0">

          {/* LOGGED OUT VIEW */}
          {!isAuthenticated || !accessToken ? (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSignUpClick}
                variant="ghost"
                className="whitespace-nowrap px-6 py-2 rounded-full border border-[#FF8800] text-[#FF8800] text-sm font-semibold hover:bg-[#FF8800]/10 transition-all cursor-pointer bg-transparent hover:text-[#FF8800]"
              >
                Sign up
              </Button>
              <Button
                onClick={handleLoginClick}
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
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
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
                        <Button
                          variant="ghost"
                          className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors cursor-pointer h-auto"
                        >
                          <Settings className="h-4 w-4" />
                          Settings
                        </Button>
                      </div>

                      <div className="p-1 border-t border-white/5">
                        <Button
                          variant="ghost"
                          onClick={handleLogout}
                          className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer hover:text-red-400 h-auto"
                        >
                          <LogOut className="h-4 w-4" />
                          Log out
                        </Button>
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
  );
};
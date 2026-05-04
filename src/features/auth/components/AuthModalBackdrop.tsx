import React from 'react';
import { cn } from '@/lib/utils';
import { AppBackground } from '@/components/internal/AppBackground';

interface AuthModalBackdropProps {
  children: React.ReactNode;
  onClose: () => void;
  size?: 'default' | 'large';
  currentStep?: string;
}

export const AuthModalBackdrop: React.FC<AuthModalBackdropProps> = ({
  children,
  onClose,
  size = 'default',
  currentStep,
}) => {
  const isFloating = currentStep === 'welcome';
  const canCloseOnBackdrop = currentStep === 'welcome' || currentStep === 'input';

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && canCloseOnBackdrop) {
      onClose();
    }
  };

  return (
    <>
      {/* ══ MOBILE ══ */}
      {isFloating ? (
        // Welcome step: centred floating card with mini glows
        <div
          className="fixed inset-0 z-200 flex flex-col items-center justify-center p-6 md:hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleBackdropClick}
        >
          <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0d0a09]">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="absolute rounded-full"
                style={{ width: 200, height: 200, top: -80, right: -80, background: '#FF7700', filter: 'blur(120px)', mixBlendMode: 'color-dodge' }}
              />
              <div
                className="absolute rounded-full"
                style={{ width: 150, height: 150, bottom: -60, left: -60, background: '#3E2AB5', filter: 'blur(354px)', mixBlendMode: 'color-dodge' }}
              />
            </div>
            <div className="relative z-10">{children}</div>
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 z-200 md:hidden flex flex-col">
          {/* Decorative background */}
          <div className="absolute inset-0 pointer-events-none">
            <AppBackground className="h-full w-full" />
          </div>
          {/* Scrollable content layer */}
          <div className="relative z-10 flex flex-col h-full w-full overflow-hidden">
            {children}
          </div>
        </div>
      )}

      {/* ══ DESKTOP ══ */}
      <div
        className="hidden md:flex fixed inset-0 z-200 items-center justify-center bg-black/75 backdrop-blur-md p-4"
        onClick={handleBackdropClick}
      >
        <div
          className={cn(
            "relative z-10 overflow-hidden rounded-2xl bg-[#111213] shadow-2xl",
            "animate-in zoom-in-95 duration-200 border border-white/5",
            "w-full min-h-105 max-h-[90vh]",
            size === 'large' ? "max-w-237.5" : "max-w-165",
            "flex flex-col",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Atmosphere glows */}
          <div
            className="pointer-events-none absolute rounded-full"
            style={{ width: 169, height: 220, top: -108, right: -92, background: '#FF7700', filter: 'blur(180px)', mixBlendMode: 'color-dodge' }}
          />
          <div
            className="pointer-events-none absolute rounded-full"
            style={{ width: 220, height: 220, bottom: -110, left: -110, background: '#3E2AB5', filter: 'blur(354px)', mixBlendMode: 'color-dodge' }}
          />

          {/* flex-1 + overflow-auto lets inner steps control their own scroll */}
          <div className="relative z-10 flex flex-col flex-1 min-h-0">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};
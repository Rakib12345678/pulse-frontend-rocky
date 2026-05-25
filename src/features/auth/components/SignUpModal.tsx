import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ChevronDown, Check,
    Search, Loader2,
    Mail, Phone,
    Camera,
    ChevronLeft,
    X,
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { cn } from '@/lib/utils';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { authService } from '../services/auth.service';
import { toast } from 'sonner';
import { mediaService } from '../services/media.service';
import { countryCodes } from '@/lib/countries';
import Logo from "@/assets/Logo.svg";
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthModalBackdrop } from './AuthModalBackdrop';
import { isSafari } from '@/lib/browser';
import { inputSchema, InputFormData } from '@/features/auth/services/auth.schema';
import { useIsMobile } from '@/hooks/use-mobile';

// --- UI COMPONENTS ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from '@/components/ui/form';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@radix-ui/react-dropdown-menu';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { useUpdateProfile } from '@/features/profile/services/profile.service';

// ---------- Country Drawer (mobile only) --------------
interface CountryDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedValue: string;
    mode: 'dialCode' | 'location';
    onSelect: (value: string) => void;
    title?: string;
}

const CountryDrawer: React.FC<CountryDrawerProps> = ({
    open,
    onOpenChange,
    selectedValue,
    mode,
    onSelect,
    title = 'Select Country',
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filtered = countryCodes.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mode === 'dialCode' && c.dial_code.includes(searchQuery))
    );

    const handleSelect = (c: typeof countryCodes[0]) => {
        onSelect(mode === 'dialCode' ? c.dial_code : c.name);
        onOpenChange(false);
        setSearchQuery('');
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
            {open && (
                <div
                    className="fixed inset-0 z-[499] bg-black/60"
                    onClick={() => onOpenChange(false)}
                />
            )}
            <DrawerContent
                aria-describedby={undefined}
                onPointerDownOutside={() => onOpenChange(false)}
                onInteractOutside={() => onOpenChange(false)}
                className="fixed bottom-0 left-0 right-0 z-[500] bg-[#111213] border-t border-[#1D1F20] flex flex-col rounded-t-2xl focus:outline-none"
                style={{
                    maxHeight: '70dvh',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                <DrawerHeader className="shrink-0 pb-0 px-4 pt-4">
                    <DrawerTitle className="text-white text-base font-semibold text-left">
                        {title}
                    </DrawerTitle>
                    <div className="flex items-center gap-2 mt-3 px-3 h-11 bg-[#1a1c24] rounded-xl border border-white/10 focus-within:border-white/25 transition-colors">
                        <Search className="w-4 h-4 text-gray-500 shrink-0" />
                        <input
                            className="flex-1 bg-transparent border-none text-white focus:outline-none placeholder:text-gray-600"
                            placeholder="Search country..."
                            spellCheck={false}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            style={{ fontSize: '16px' }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="text-gray-500">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </DrawerHeader>
                <div className="overflow-y-auto flex-1 px-2 pb-6 pt-2 [&::-webkit-scrollbar]:hidden">
                    {filtered.length === 0 && (
                        <p className="text-center text-sm text-gray-500 py-10">No country found</p>
                    )}
                    {filtered.map(c => {
                        const isSelected =
                            mode === 'dialCode' ? selectedValue === c.dial_code : selectedValue === c.name;
                        return (
                            <button
                                key={c.code}
                                onClick={() => handleSelect(c)}
                                className={cn(
                                    'w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-colors',
                                    isSelected ? 'bg-[#FF7700]/10' : 'hover:bg-white/5'
                                )}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {mode === 'dialCode' && (
                                        <span className="text-gray-500 font-mono text-xs w-10 text-right shrink-0">
                                            {c.dial_code}
                                        </span>
                                    )}
                                    <span className={cn('text-sm truncate', isSelected ? 'text-[#FF7700] font-semibold' : 'text-gray-200')}>
                                        {c.name}
                                    </span>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-[#FF7700] shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            </DrawerContent>
        </Drawer>
    );
};

// -------- Mobile Page Header ---------
interface MobilePageHeaderProps {
    title?: string;
    showBack?: boolean;
    onBack?: () => void;
    onClose?: () => void;
    showClose?: boolean;
}

const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({
    title = 'Profile',
    showBack = false,
    onBack,
}) => (
    <div className="flex md:hidden items-center justify-between px-4 h-14 shrink-0 w-full bg-[#111213] border-b border-[#1D1F20] sticky top-0 z-10">
        <div className="flex items-center gap-3">
            {showBack ? (
                <button
                    onClick={onBack}
                    className="p-1 -ml-1 flex items-center justify-center cursor-pointer text-white"
                >
                    <ChevronLeft className="w-6 h-6" strokeWidth={2.5} />
                </button>
            ) : (
                <img src={Logo} alt="PulseLive" className="w-8 h-8 rounded-lg" />
            )}
            <span className="text-white font-bold text-lg">{title}</span>
        </div>
    </div>
);

// ------ Step Wrapper --------
interface StepWrapperProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    className?: string;
    showBackButton?: boolean;
    onBack?: () => void;
    mobileHeaderTitle?: string;
    showMobileHeader?: boolean;
}

const StepWrapper = ({
    children,
    title,
    subtitle,
    className = "",
    showBackButton,
    onBack,
    mobileHeaderTitle = "Profile",
    showMobileHeader = true,
}: StepWrapperProps) => {
    const { closeModal } = useSignUpStore();
    const { isAuthenticated, isNewUser } = useAuthStore();

    const handleClose = () => {
        if (isAuthenticated && isNewUser) return;
        closeModal();
    };

    return (
        <div className={cn("flex flex-col h-full w-full", className)}>
            {showMobileHeader && (
                <MobilePageHeader
                    title={mobileHeaderTitle}
                    showBack={showBackButton}
                    onBack={onBack}
                    onClose={!(isAuthenticated && isNewUser) ? handleClose : undefined}
                    showClose={!(isAuthenticated && isNewUser)}
                />
            )}
            <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col [&::-webkit-scrollbar]:hidden md:mt-4">
                <div className="flex flex-col items-center justify-start md:justify-center
                                px-5 pt-5 pb-6 md:p-8 md:pt-6
                                w-full max-w-125 mx-auto text-center flex-1">
                    <div className="flex flex-col items-center gap-1 md:gap-3 shrink-0 mb-4 md:mb-6">
                        <img src={Logo} alt="PulseLive" className="h-15 w-15 md:h-20 md:w-20 mb-4" />
                        <div>
                            <h2 className="text-4xl md:text-4xl font-bold text-white tracking-tight">{title}</h2>
                            {subtitle && (
                                <p className="text-gray-400 font-normal text-xs md:text-lg leading-relaxed tracking-normal mt-1 md:mt-2">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="w-full flex flex-col items-center gap-4 md:gap-4">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 1. WELCOME STEP ---
const StepWelcome = () => {
    const { setStep, setMode } = useSignUpStore();
    return (
        <StepWrapper
            title="Welcome to PulseLive"
            subtitle="Go Live. Connect. Inspire"
            mobileHeaderTitle="PulseLive"
            showMobileHeader={false}
        >
            <div className="mt-8 w-full flex flex-col items-center m-auto">
                <Button
                    onClick={() => {
                        setMode('signup');
                        setStep('input');
                    }}
                    className="w-52 rounded-full bg-[#FF7700] py-6 text-base font-bold text-black hover:bg-[#ff9922] transition-transform active:scale-95"
                >
                    Get Started →
                </Button>
                <p className="mt-4 text-[14px] text-white">
                    Already have an account ?{''}
                    <button
                        type="button"
                        onClick={() => {
                            setMode('login');
                            setStep('input');
                        }}
                        className="text-blue-500 cursor-pointer font-semibold bg-transparent border-none p-0 inline ml-1"
                    >
                        Log in
                    </button>
                </p>
                <p className="mt-12 text-[14px] text-white px-2 text-center max-w-md mx-auto leading-relaxed">
                    By continuing, you agree to our{' '}
                    <Link to="/terms-conditions" onClick={() => useSignUpStore.getState().pauseModal()} className="text-blue-500 cursor-pointer hover:underline">Terms of Service</Link> and{' '}
                    <Link to="/privacy-policy" onClick={() => useSignUpStore.getState().pauseModal()} className="text-blue-500 cursor-pointer hover:underline">Privacy Policy</Link>
                </p>
            </div>
        </StepWrapper>
    );
};

// --- 2. INPUT STEP ---
const StepInput = ({ isLiveStream }: { isLiveStream?: boolean }) => {
    const { setStep, method, setMethod, setIdentifier, countryCode, setCountryCode, mode } = useSignUpStore();
    const [isLoading, setIsLoading] = useState(false);

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
    const [desktopSearchQuery, setDesktopSearchQuery] = useState('');

    const { closeModal } = useSignUpStore();
    const { authenticate } = useAuth();
    const storeIdentifier = useSignUpStore((s) => s.identifier);
    const isMobile = useIsMobile();
    const safari = isSafari();

    const form = useForm<InputFormData>({
        resolver: zodResolver(inputSchema),
        defaultValues: { identifier: storeIdentifier, method: method },
        mode: 'onChange'
    });

    useEffect(() => {
        form.setValue('identifier', storeIdentifier, { shouldValidate: false });
    }, [storeIdentifier]);

    const prevMethod = useRef(method);
    useEffect(() => {
        if (prevMethod.current !== method) {
            form.setValue('identifier', '', { shouldValidate: false });
            form.setValue('method', method, { shouldValidate: false });
            setIdentifier('');
            prevMethod.current = method;
        }
    }, [method]);

    const filteredDesktopCountries = countryCodes.filter(c =>
        c.name.toLowerCase().includes(desktopSearchQuery.toLowerCase()) ||
        c.dial_code.includes(desktopSearchQuery)
    );

    const onSubmit = async (data: InputFormData) => {
        setIsLoading(true);
        try {
            setIdentifier(data.identifier);
            await authService.initiateSignup({ method, identifier: data.identifier });
            toast.success(`OTP sent to ${data.identifier}`);
            setStep('otp');
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to send code");
        } finally {
            setIsLoading(false);
        }
    };

    const title = mode === 'login' ? 'Welcome to PulseLive' : 'Create Account';
    const subtitle = mode === 'login' ? 'Go Live. Connect. Inspire' : 'Go Live. Connect. Inspire';

    return (
        <StepWrapper
            title={title}
            subtitle={subtitle}
            showBackButton={true}
            onBack={() => setStep('welcome')}
            mobileHeaderTitle="Profile"
            showMobileHeader={true}
        >
            <div className="md:hidden">
                <CountryDrawer
                    open={drawerOpen}
                    onOpenChange={setDrawerOpen}
                    selectedValue={countryCode}
                    mode="dialCode"
                    onSelect={setCountryCode}
                    title="Select Country Code"
                />
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 md:space-y-6">
                    <div className="text-left relative w-full">
                        <label className="block text-sm text-gray-400 mb-2 ml-1">
                            {method === 'phone' ? 'Phone number' : 'Email Address'}
                        </label>
                        <div className="flex gap-3 w-full">
                            {method === 'phone' && (
                                <>
                                    {/* Mobile → opens Drawer */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDrawerOpen(true)}
                                        className="md:hidden flex items-center justify-between h-12 min-w-25 bg-transparent border-white/20 rounded-xl text-white hover:bg-white/5 hover:text-white hover:border-white/40 transition-all"
                                    >
                                        <span className="text-base font-medium">{countryCode}</span>
                                        <ChevronDown className="w-4 h-4 text-gray-500 ml-2 opacity-70" />
                                    </Button>

                                    {/* Desktop → opens DropdownMenu */}
                                    <div className="hidden md:block relative">
                                        <DropdownMenu
                                            open={desktopDropdownOpen}
                                            onOpenChange={(open) => {
                                                setDesktopDropdownOpen(open);
                                                if (!open) setDesktopSearchQuery('');
                                            }}
                                        >
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="flex items-center justify-between h-14 min-w-25 bg-transparent border-white/20 rounded-xl text-white hover:bg-white/5 hover:text-white hover:border-white/40 transition-all"
                                                >
                                                    <span className="text-base font-medium">{countryCode}</span>
                                                    <ChevronDown className="w-4 h-4 text-gray-500 ml-2 opacity-70" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent
                                                className="w-75 p-0 bg-[#1a1c24] border-white/10 text-white z-50 shadow-2xl rounded-xl"
                                                align="start"
                                                sideOffset={8}
                                            >
                                                <div className="p-3 border-b border-white/5 bg-[#1a1c24] rounded-t-xl sticky top-0 z-10">
                                                    <div className="flex items-center px-3 h-10 bg-[#0f1117] rounded-lg border border-white/5 transition-colors focus-within:border-white/20">
                                                        <Search className="w-4 h-4 text-gray-500 mr-2" />
                                                        <input
                                                            className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-gray-600"
                                                            placeholder="Search country..."
                                                            spellCheck={false}
                                                            value={desktopSearchQuery}
                                                            onChange={(e) => setDesktopSearchQuery(e.target.value)}
                                                            onKeyDown={(e) => e.stopPropagation()}
                                                            autoFocus
                                                        />
                                                    </div>
                                                </div>
                                                <div className="overflow-y-auto max-h-60 p-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
                                                    {filteredDesktopCountries.map((c) => (
                                                        <DropdownMenuItem
                                                            key={c.code}
                                                            onClick={() => {
                                                                setCountryCode(c.dial_code);
                                                                setDesktopSearchQuery('');
                                                                setDesktopDropdownOpen(false);
                                                            }}
                                                            className="cursor-pointer py-2.5 px-3 rounded-lg text-sm hover:bg-white/5 focus:bg-white/5 text-gray-200 focus:text-white flex items-center justify-between group transition-colors"
                                                        >
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <span className="text-gray-500 font-mono text-xs w-10 text-right shrink-0 group-hover:text-gray-400 transition-colors">
                                                                    {c.dial_code}
                                                                </span>
                                                                <span className="truncate font-medium">{c.name}</span>
                                                            </div>
                                                            {countryCode === c.dial_code && (
                                                                <Check className="w-4 h-4 text-[#FF7700]" />
                                                            )}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    {filteredDesktopCountries.length === 0 && (
                                                        <div className="py-8 text-center text-sm text-gray-500">
                                                            No country found
                                                        </div>
                                                    )}
                                                </div>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </>
                            )}

                            <FormField
                                control={form.control}
                                name="identifier"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type={method === 'phone' ? 'tel' : 'email'}
                                                spellCheck={false}
                                                placeholder={method === 'phone' ? "Enter mobile number here..." : "Enter email address here..."}
                                                className="h-12 md:h-14 bg-transparent border-white/20 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-white/40 shadow-none"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs text-red-400" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 w-full">
                        <Button
                            type="submit"
                            disabled={isLoading || !form.formState.isValid}
                            className="flex-1 rounded-full bg-[#FF7700] bg-none hover:bg-[#ff9922] disabled:bg-[#262626] disabled:bg-none py-3 md:py-6 text-sm font-medium text-white transition-all border border-white/5 disabled:opacity-100"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isLoading ? 'Sending...' : 'Verify'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeModal}
                            disabled={isLoading}
                            className="flex-1 rounded-full border-[#FF7700] py-3 md:py-6 text-sm font-bold text-[#FF7700] hover:bg-[#FF7700]/10 hover:text-[#FF7700] bg-transparent transition-all"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Form>

            <div className="py-1 md:pt-6 md:mb-4 w-full flex justify-center">
                <div className="flex items-center w-full max-w-60">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="px-3 text-xs text-gray-500">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-2 items-center">
                <button
                    type="button"
                    onClick={() => setMethod(method === 'phone' ? 'email' : 'phone')}
                    className="flex items-center justify-center gap-2 w-50 h-9 rounded-full bg-[#131314] hover:bg-[#1e1e1e] border border-white/10 text-white transition-colors text-sm font-medium tracking-wide"
                >
                    {method === 'phone'
                        ? <Mail className="w-4 h-4 shrink-0 text-white/80" />
                        : <Phone className="w-4 h-4 shrink-0 text-white/80" />}
                    <span className="text-[#e3e3e3]">
                        {mode === 'login'
                            ? (method === 'phone' ? 'Login with Email' : 'Login with Phone')
                            : (method === 'phone' ? 'Signup with Email' : 'Signup with Phone')}
                    </span>
                </button>

                <div className="flex justify-center mt-1 md:mt-0">
                    <GoogleLogin
                        onSuccess={(credentialResponse) => {
                            if (credentialResponse.credential) {
                                authenticate({
                                    url: '/auth/google',
                                    payload: { idToken: credentialResponse.credential },
                                    redirect: !isLiveStream
                                });
                            }
                        }}
                        onError={() => toast.error("Google Signup Failed")}
                        useOneTap={false}
                        use_fedcm_for_prompt={!safari}
                        use_fedcm_for_button={!safari}
                        auto_select={false}
                        ux_mode="popup"
                        theme="filled_black"
                        shape="pill"
                        size="medium"
                        text={mode === 'login' ? 'continue_with' : 'signup_with'}
                        width="200"
                    />
                </div>
            </div>

            <p className="md:hidden text-[14px] text-white px-2 text-center">
                By continuing, you agree to our{' '}
                <Link to="/terms-conditions" onClick={() => useSignUpStore.getState().pauseModal()} className="text-blue-500 cursor-pointer hover:underline">Terms of Service</Link> and{' '}
                <Link to="/privacy-policy" onClick={() => useSignUpStore.getState().pauseModal()} className="text-blue-500 cursor-pointer hover:underline">Privacy Policy</Link>
            </p>
        </StepWrapper>
    );
};

// --- 3. OTP STEP ---
const StepOTP = ({ isLiveStream }: { isLiveStream?: boolean }) => {
    const { setStep, identifier, method, countryCode } = useSignUpStore();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(30);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const { authenticate, isLoading } = useAuth();

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (resendCooldown > 0) {
            interval = setInterval(() => setResendCooldown(c => c - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [resendCooldown]);

    const handleChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;
        if (error) setError('');
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (error) setError('');
        const pastedData = e.clipboardData.getData('text/plain').trim();
        if (/^\d{6}$/.test(pastedData)) {
            setOtp(pastedData.split(''));
            inputRefs.current[5]?.focus();
        }
    };

    const handleSubmit = async () => {
        const code = otp.join('');
        if (code.length !== 6) return;
        setError('');
        const payload = method === 'email'
            ? { email: identifier, otp: code }
            : { identifier, otp: code };

        authenticate({
            url: '/otp/verify',
            payload,
            redirect: !isLiveStream
        }, {
            onSuccess: () => {
                toast.dismiss();
                setStep('age');
            },
            onError: (err: any) => {
                // Suspension errors (403) are handled by useAuth.onError which
                // closes the SignUpModal and shows AccountSuspendedModal instead.
                const isSuspended =
                    err?.response?.status === 403 &&
                    (err?.response?.data?.message ?? '').toLowerCase().includes('suspended');
                if (isSuspended) return;

                setError("Wrong OTP. Please try again");
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        });
    };

    const handleResend = async () => {
        if (resendCooldown > 0) return;
        try {
            await authService.resendOtp(identifier, method);
            toast.success("OTP sent again!");
            setResendCooldown(30);
        } catch {
            toast.error("Failed to resend OTP");
        }
    };

    return (
        <StepWrapper
            title=""
            showBackButton={true}
            onBack={() => setStep('input')}
            mobileHeaderTitle="Profile"
            showMobileHeader={true}
        >
            <div className="text-center mb-5">
                <p className="text-gray-400 text-base flex items-center justify-center gap-1.5 flex-wrap">
                    OTP has been sent to
                    <span className="text-white font-semibold">
                        {method === 'phone' ? `${countryCode}-${identifier}` : identifier}
                    </span>
                </p>
                <button
                    onClick={() => setStep('input')}
                    className="mt-1 text-sm font-medium text-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
                >
                    {method === 'email' ? 'Change Email' : 'Change Number'}
                </button>
            </div>

            <div className="flex flex-col items-center gap-1 md:gap-2">
                <div className="flex gap-2 md:gap-2.5 justify-center">
                    {otp.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => { if (el) inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            maxLength={1}
                            value={digit}
                            spellCheck={false}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            onPaste={handlePaste}
                            disabled={isLoading}
                            className={cn(
                                "w-11 h-12 md:w-14 md:h-16 text-center text-xl md:text-2xl font-normal text-white transition-all bg-transparent rounded-xl border",
                                error
                                    ? "border-red-500 text-red-500 focus-visible:ring-0"
                                    : "border-white/20 focus-visible:ring-0 focus-visible:border-white/50"
                            )}
                        />
                    ))}
                </div>

                {/* Error OR sent-on hint */}
                <div className="h-4 flex items-center justify-center mb-4">
                    {error
                        ? <p className="text-red-400 text-xl">{error}</p>
                        : resendCooldown > 0 && (
                            <p className="text-gray-400 text-xs">
                                An OTP has been sent on your {method === 'email' ? 'email' : 'number'}
                            </p>
                        )
                    }
                </div>

                {/* Timer / Resend */}
                <div className="flex flex-col items-center justify-center text-sm mb-2">
                    {resendCooldown === 0 && (
                        <span className="text-red-500 text-xs mb-1">
                            Didn't recieve OTP? Retry
                        </span>
                    )}
                    <div className="h-6 flex items-center justify-center text-gray-400">
                        {resendCooldown > 0 ? (
                            <span>
                                Resend in{' '}
                                <span className="inline-flex items-baseline gap-0.5">
                                    <span className="text-white font-mono">
                                        {resendCooldown < 10 ? `0${resendCooldown}` : resendCooldown}
                                    </span>
                                    <span className="text-gray-400">sec</span>
                                </span>
                            </span>
                        ) : (
                            <button
                                onClick={handleResend}
                                disabled={isLoading}
                                className="text-blue-500 hover:text-blue-400 disabled:text-gray-600 disabled:cursor-not-allowed font-medium"
                            >
                                Resend OTP
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-4 w-full">
                <Button
                    onClick={handleSubmit}
                    disabled={otp.some(d => !d) || isLoading}
                    className="flex-1 rounded-full bg-[#FF7700] py-6 text-sm font-bold text-black hover:bg-[#ff9922] transition-transform active:scale-95 disabled:bg-white/10 disabled:text-gray-500"
                >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setStep('input')}
                    disabled={isLoading}
                    className="flex-1 rounded-full border-[#FF7700] py-6 text-sm font-bold text-[#FF7700] hover:bg-[#FF8800]/10 bg-transparent hover:text-[#FF8800]"
                >
                    Cancel
                </Button>
            </div>

            <p className="text-[14px] text-white text-center">
                By continuing, you agree to our{' '}
                <Link to="/terms-conditions" onClick={() => useSignUpStore.getState().pauseModal()} className="text-blue-500 cursor-pointer hover:underline">terms & conditions</Link> &{' '}
                <Link to="/privacy-policy" onClick={() => useSignUpStore.getState().pauseModal()} className="text-blue-500 cursor-pointer hover:underline">privacy policy</Link>
            </p>
        </StepWrapper>
    );
};

// --- 4. AGE CONFIRMATION STEP ---
const StepAge = () => {
    const { setStep, setIsAdult, onAgeVerified, closeModal, reset } = useSignUpStore();
    const [isLoading, setIsLoading] = useState(false);

    const handleAgeSelection = async (isAdult: boolean) => {
        setIsAdult(isAdult);
        setIsLoading(true);
        try {
            // Always send the explicit boolean — backend needs both true and false
            await authService.updateAgeConsent(isAdult);
            useAuthStore.getState().updateUser({ eighteenPlus: isAdult });
            if (onAgeVerified) {
                if (isAdult) onAgeVerified();
                closeModal();
                reset();
            } else {
                setStep('details');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update age consent");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <StepWrapper
            title="Age Confirmation"
            mobileHeaderTitle="Complete Your Profile"
            showMobileHeader={true}
        >
            <p className="text-gray-400 text-sm md:text-base mb-5 leading-relaxed max-w-md mx-auto">
                Before entering this website, you must confirm the following information.
            </p>
            <div className="bg-transparent mb-12 max-w-md mx-auto">
                <p className="text-gray-400 text-sm leading-relaxed">
                    To maintain a safe and trusted environment, access to this platform is limited to users aged 18 and above.
                </p>
            </div>
            <div className="flex flex-col md:flex-row gap-2 w-full">
                <Button
                    onClick={() => handleAgeSelection(true)}
                    disabled={isLoading}
                    className="w-full rounded-full bg-[#FF7700] py-6 text-sm font-bold text-black hover:bg-[#ff9922]"
                >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Yes, I agree let me in
                </Button>
                <Button
                    variant="outline"
                    onClick={() => handleAgeSelection(false)}
                    disabled={isLoading}
                    className="w-full rounded-full border-[#FF7700] py-6 text-sm font-bold text-[#FF7700] hover:bg-[#FF7700]/10 bg-transparent hover:text-[#FF7700]"
                >
                    Disagree, I am under 18
                </Button>
            </div>
            <p className="mt-5 text-[14px] text-white">
                By continuing, you agree to our{' '}
                <Link to="/terms-conditions" onClick={() => useSignUpStore.getState().pauseModal()} className="text-blue-500 cursor-pointer hover:underline">terms & conditions</Link> &{' '}
                <Link to="/privacy-policy" onClick={() => useSignUpStore.getState().pauseModal()} className="text-blue-500 cursor-pointer hover:underline">privacy policy</Link>
            </p>
        </StepWrapper>
    );
};

// --- 5. DETAILS STEP (FIXED TWO-COLUMN LAYOUT) ---
const detailsSchema = z.object({
    fullName: z.string({ message: "Full name is required" }).min(3, "Name must be at least 3 characters"),
    location: z.string({ message: "Please select a location" }).min(2, "Please select a location"),
    bio: z.string().max(100).nullable().optional(),
});
type DetailsFormData = z.infer<typeof detailsSchema>;

const generateAvatarFile = async (name: string): Promise<File> => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.beginPath();
    ctx.arc(300, 300, 300, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const colors = ['#FF7700', '#FF5500', '#FFAA00', '#FF3300', '#FFCC00'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(0, 0, 600, 600);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 300px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((name[0] || '?').toUpperCase(), 300, 300);
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(new File([blob], 'avatar.png', { type: 'image/png' }));
            else reject(new Error('Failed to generate avatar'));
        }, 'image/png');
    });
};

export interface StepDetailsProps {
    mode?: 'signup' | 'edit';
    initialValues?: {
        fullName?: string;
        location?: string;
        bio?: string;
        profileImage?: string;
        isDefaultImage?: boolean;
        username?: string;
        identifier?: string;
    };
    isAdult?: boolean;
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const StepDetails = ({
    mode = 'signup',
    initialValues,
    isAdult: isAdultProp,
    onSuccess,
    onCancel,
}: StepDetailsProps) => {
    const store = useSignUpStore();
    const { mutateAsync: updateProfileMutation } = useUpdateProfile();
    const isAdult = isAdultProp ?? store.isAdult;
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(initialValues?.profileImage ?? null);
    const [profileImageKey, setProfileImageKey] = useState<string | null>(initialValues?.profileImage ?? null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDefaultImage, setIsDefaultImage] = useState(initialValues?.isDefaultImage ?? true);
    const [cameraMenuOpen, setCameraMenuOpen] = useState(false);
    const [locationDrawerOpen, setLocationDrawerOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<DetailsFormData>({
        resolver: zodResolver(detailsSchema),
        defaultValues: {
            fullName: initialValues?.fullName ?? "",
            location: initialValues?.location ?? "India",
            bio: initialValues?.bio ?? ""
        },
        mode: 'onChange'
    });

    useEffect(() => {
        if (mode !== 'signup') return;
        if (!username || username.length < 3) { setIsUsernameAvailable(null); return; }
        if (/\s/.test(username)) { setIsUsernameAvailable(false); setUsernameError('Spaces are not allowed'); return; }
        const timer = setTimeout(async () => {
            setIsCheckingUsername(true);
            try {
                const available = await authService.checkUsernameAvailable(username);
                setIsUsernameAvailable(available);
                setUsernameError(available ? '' : 'Username is already taken');
            } catch (error) {
                console.error('Failed to check username:', error);
            } finally {
                setIsCheckingUsername(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [username, mode]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!['image/jpeg', 'image/png'].includes(file.type)) { toast.error("Please upload a JPEG or PNG image only"); return; }
        if (file.size > 2 * 1024 * 1024) { toast.error("Image size must be less than 2MB"); return; }
        setIsUploading(true);
        try {
            const extension = file.name.split('.').pop() || 'png';
            const { uploadUrl, fullUrl } = await mediaService.generatePresignedUrl('PROFILE_IMAGE', extension);
            await mediaService.uploadFileToS3(uploadUrl, file);
            setProfileImage(fullUrl);
            setProfileImageKey(fullUrl);
            setIsDefaultImage(false);
            toast.success("Profile photo updated");
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload image");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeletePhoto = async () => {
        if (!profileImageKey) return;
        try {
            await mediaService.deleteFile(profileImageKey);
            setProfileImage(null);
            setProfileImageKey(null);
            setIsDefaultImage(true);
            toast.success("Profile photo removed");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete image");
        }
    };

    const onSubmit = async (data: DetailsFormData) => {
        if (mode === 'signup') {
            if (username.length < 3) { setUsernameError('Minimum 3 characters'); return; }
            if (isUsernameAvailable === false) return;
        }
        setIsLoading(true);
        try {
            let currentProfileImageKey = profileImageKey;
            let isDefault = isDefaultImage;
            if (!currentProfileImageKey) {
                try {
                    const file = await generateAvatarFile(data.fullName);
                    const { uploadUrl, fullUrl } = await mediaService.generatePresignedUrl('PROFILE_IMAGE', 'png');
                    await mediaService.uploadFileToS3(uploadUrl, file);
                    currentProfileImageKey = fullUrl;
                    isDefault = true;
                } catch (err) {
                    console.error("Failed to generate/upload default avatar", err);
                    currentProfileImageKey = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=random`;
                    isDefault = true;
                }
            }
            await updateProfileMutation({
                data: {
                    ...data,
                    username: mode === 'signup' ? username : (initialValues?.username ?? ''),
                    bio: data.bio ?? "",
                    eighteenPlus: isAdult,
                    profileImage: currentProfileImageKey || "",
                    defaultProfileImage: isDefault
                } as any
            });
            if (mode === 'signup') {
                useAuthStore.getState().setAuthenticated(true);
                store.setStep('interests');
            } else {
                toast.success("Profile updated successfully!");
                onSuccess?.();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    const title = mode === 'edit' ? 'Edit Profile' : 'Almost There!';
    const subtitle = mode === 'edit' ? 'Update your profile details below.' : 'Let\'s set up your profile so you can start connecting.';
    const submitLabel = mode === 'edit' ? 'Save' : 'Enter PulseLive';

    const identifierPill = mode === 'signup'
        ? (store.identifier?.includes('@')
            ? store.identifier
            : (store.identifier && store.method === 'phone' && store.countryCode
                ? `${store.countryCode} ${store.identifier}`
                : (store.identifier || useAuthStore.getState().user?.email || '')))
        : initialValues?.identifier;

    const locationValue = form.watch('location');

    return (
        <div className="flex flex-col h-full w-full">
            <div className="md:hidden">
                <CountryDrawer
                    open={locationDrawerOpen}
                    onOpenChange={setLocationDrawerOpen}
                    selectedValue={locationValue}
                    mode="location"
                    onSelect={(val) => form.setValue('location', val, { shouldValidate: true })}
                    title="Select Location"
                />
            </div>
            <MobilePageHeader
                title={mode === 'edit' ? 'Edit Profile' : 'Complete Your Profile'}
                showBack={true}
                onBack={mode === 'edit' ? onCancel : () => store.setStep('age')}
                showClose={false}
            />
            <div className="flex-1 overflow-y-auto md:overflow-hidden custom-scrollbar flex flex-col">
                <div className="flex flex-col md:flex-row w-full items-start p-4 md:p-5 h-full">
                    {/* Left Card */}
                    <div className="flex flex-col items-center gap-6 md:gap-8 bg-[#1D1F20] rounded-xl py-8 md:py-16.5 px-6 md:px-8 w-full md:w-97.5 shrink-0 border border-white/5">
                        {identifierPill && (
                            <div className="w-full rounded-lg border border-blue-500/50 bg-transparent h-14 px-5 py-7 flex justify-between items-center gap-8">
                                <span className="text-gray-300 text-[16px] truncate">{identifierPill}</span>
                                <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                </div>
                            </div>
                        )}
                        <div className="relative mt-1">
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png" onChange={handleFileChange} />
                            <div className="size-33 rounded-full p-0.75" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #3b3bd6 50%, #ef4444 100%)' }}>
                                <div className="w-full h-full rounded-full bg-[#1c1e27] p-0.5">
                                    <div className={cn(
                                        "w-full h-full rounded-full overflow-hidden flex items-center justify-center text-4xl font-bold transition-colors",
                                        profileImage ? "bg-zinc-800 text-white" : "bg-orange-400 text-white"
                                    )}>
                                        {profileImage ? (
                                            <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            (form.watch('fullName')?.[0] || '👤').toUpperCase()
                                        )}
                                    </div>
                                </div>
                            </div>
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                                    <Loader2 className="w-7 h-7 animate-spin text-white" />
                                </div>
                            )}
                            <div className="absolute bottom-0.5 right-0.5">
                                <button type="button" disabled={isUploading} onClick={() => setCameraMenuOpen(o => !o)} className="bg-white rounded-full p-1.5 cursor-pointer shadow-lg hover:scale-110 transition-transform flex items-center justify-center border-2 border-[#1D1F20]">
                                    <Camera className="w-4 h-4 text-black" />
                                </button>
                                {cameraMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" style={{ background: 'transparent' }} onClick={() => setCameraMenuOpen(false)} />
                                        <div className="absolute bottom-full -right-20 mb-2 z-50 min-w-32.5 bg-[#1a1c24] border border-white/10 rounded-xl p-1 shadow-2xl">
                                            <button type="button" onClick={() => { fileInputRef.current?.click(); setCameraMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white cursor-pointer hover:bg-white/5 rounded-lg">
                                                {!isDefaultImage ? 'Change Photo' : 'Choose Photo'}
                                            </button>
                                            {profileImage && !isDefaultImage && (
                                                <>
                                                    <div className="my-1 border-t border-white/10" />
                                                    <button type="button" onClick={() => { handleDeletePhoto(); setCameraMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white cursor-pointer hover:bg-red-400/5 rounded-lg">
                                                        Delete Photo
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="w-full">
                            <label className="block text-xs text-gray-400 mb-2">Your name</label>
                            <Form {...form}>
                                <FormField control={form.control} name="fullName" render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input {...field} className="h-14 bg-[#111213] border-white/20 rounded-lg text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:border-white/40 text-[16px] px-4" placeholder="No Name" spellCheck={false} style={{ height: '56px', border: '1px solid var(--Grey-Grey-5, #959A9D)' }} />
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )} />
                            </Form>
                        </div>
                        <p className="text-xs text-white/70 text-center leading-relaxed">
                            You can edit your profile picture or upload a new one (JPG or PNG)
                        </p>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col flex-1 w-full justify-start px-0 md:px-8 py-6 md:py-4 min-w-0">
                        <h2 className={cn(
                            "font-bold text-white tracking-tight mb-1 text-center md:text-left",
                            mode === 'edit' ? "text-2xl md:text-4xl hidden md:block" : "text-2xl md:text-4xl"
                        )}>{title}</h2>
                        <p className={cn("text-gray-400 text-sm mb-5 md:mb-7 text-center md:text-left", mode === 'edit' && "hidden md:block")}>{subtitle}</p>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                                <div className="grid grid-cols-2 gap-4 items-start">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between" style={{ height: '20px' }}>
                                            <label className="text-xs text-gray-400">Username</label>
                                            {mode === 'signup' && isCheckingUsername && <Loader2 className="w-3 h-3 animate-spin text-gray-500" />}
                                            {mode === 'signup' && isUsernameAvailable === true && !isCheckingUsername && <Check className="w-3 h-3 text-green-500" />}
                                        </div>
                                        {mode === 'signup' ? (
                                            <>
                                                <input value={username} spellCheck={false} onChange={(e) => { setUsername(e.target.value); setUsernameError(''); setIsUsernameAvailable(null); }} placeholder="Choose a unique username"
                                                    className={cn("w-full bg-[#111213] border rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-colors px-4", "border-white/20 focus:border-white/40", isUsernameAvailable === false && "border-red-500/70", isUsernameAvailable === true && "border-green-500/40")}
                                                    style={{ height: '56px', border: '1px solid var(--Grey-Grey-5, #959A9D)' }} />
                                                <div className="h-4 flex items-center">{usernameError && <p className="text-[10px] text-red-400">{usernameError}</p>}</div>
                                            </>
                                        ) : (
                                            <input value={initialValues?.username ?? ''} spellCheck={false} readOnly tabIndex={-1} className="w-full bg-white/3 border border-white/10 rounded-lg text-gray-500 cursor-not-allowed text-sm select-none outline-none px-4" style={{ height: '56px', border: '1px solid var(--Grey-Grey-5, #959A9D)' }} />
                                        )}
                                    </div>
                                    <FormField control={form.control} name="location" render={({ field }) => (
                                        <FormItem className="flex flex-col gap-1.5">
                                            <label className="text-xs text-gray-400" style={{ height: '20px', display: 'flex', alignItems: 'center' }}>Location</label>
                                            <button type="button" onClick={() => setLocationDrawerOpen(true)} className="md:hidden flex items-center justify-between w-full px-4 bg-[#111213] rounded-lg text-white text-sm transition-colors hover:bg-[#1a1c24] focus:outline-none" style={{ height: '56px', border: '1px solid var(--Grey-Grey-5, #959A9D)' }}>
                                                <span className={cn('truncate', !field.value && 'text-gray-600')}>{field.value || 'Select Location'}</span>
                                                <ChevronDown className="w-5 h-5 text-white shrink-0 ml-2" />
                                            </button>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="hidden md:flex bg-[#111213] border-white/20 rounded-lg text-white focus:ring-0 focus:border-white/40 text-sm w-full px-4 [&>svg]:text-white! [&>svg]:opacity-100! [&>svg]:w-5 [&>svg]:h-5" style={{ height: '56px', border: '1px solid var(--Grey-Grey-5, #959A9D)' }}>
                                                        <SelectValue placeholder="Select Location" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="bg-[#1a1c24] border-white/10 text-white max-h-60 z-300" position="popper" sideOffset={4}>
                                                    {countryCodes.map(c => (
                                                        <SelectItem key={c.code} value={c.name} className="focus:bg-white/10 focus:text-white cursor-pointer text-sm">{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage className="text-[10px]" />
                                        </FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="bio" render={({ field }) => (
                                    <FormItem className="space-y-1.5">
                                        <label className="text-xs text-gray-400">Bio</label>
                                        <FormControl>
                                            <div className="relative">
                                                <Textarea {...field} value={field.value ?? ""} spellCheck={false} className="bg-[#111213] border-white/20 rounded-lg text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:border-white/40 resize-y min-h-25 py-3 text-[16px]" placeholder="Tell others a bit about yourself..." maxLength={100} style={{ height: '56px', border: '1px solid var(--Grey-Grey-5, #959A9D)' }} />
                                                <span className="absolute bottom-2 right-3 text-[10px] text-gray-500">{field.value?.length || 0}/100</span>
                                            </div>
                                        </FormControl>
                                        <FormMessage className="text-[10px]" />
                                    </FormItem>
                                )} />
                                <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-6 md:mt-8 w-full">
                                    <button type="submit" disabled={isLoading} className="rounded-full bg-[#FF7700] text-[#111213] h-12 px-12 md:px-18 w-full md:w-auto text-sm font-bold hover:bg-[#FF7700] transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
                                        {isLoading ? <span className="flex items-center justify-center"><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</span> : submitLabel}
                                    </button>
                                    {onCancel && (
                                        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="rounded-full border-[#FF7700] h-12 w-full md:w-auto md:px-18 text-sm font-bold text-[#FF7700] hover:bg-[#FF7700]/10 bg-transparent hover:text-[#FF7700] cursor-pointer">
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                                <p className="text-[11px] md:text-[15px] text-center md:text-left text-white mt-6 md:mt-4">
                                    By continuing, you agree to our <br className="md:hidden" />
                                    <Link to="/terms-conditions" onClick={() => useSignUpStore.getState().pauseModal()} className="text-blue-500 cursor-pointer hover:underline">terms & conditions</Link>{' '}&{' '}
                                    <Link to="/privacy-policy" onClick={() => useSignUpStore.getState().pauseModal()} className="text-blue-500 cursor-pointer hover:underline">privacy policy</Link>
                                </p>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- 6. INTERESTS STEP ---
const StepInterests = () => {
    const { reset, closeModal } = useSignUpStore();
    const [selected, setSelected] = useState<string[]>([]);
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isLiveStream = location.pathname.startsWith('/live');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await authService.getCategories();
                setCategories(data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
                toast.error('Failed to load interests');
            } finally {
                setIsLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    const toggleInterest = (name: string) => {
        if (selected.includes(name)) setSelected(selected.filter(i => i !== name));
        else setSelected([...selected, name]);
    };

    const handleConfirm = async () => {
        if (selected.length === 0) {
            toast.error('Please select at least one interest');
            return;
        }
        setIsSubmitting(true);
        try {
            await authService.setInterests(selected);
            useAuthStore.setState({ isNewUser: false });
            toast.success("Account created successfully!");
            closeModal();
            reset();
            if (!isLiveStream) { navigate({ to: '/for-you' }); }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to save interests");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <StepWrapper title="Interest">
            <div className="bg-transparent mb-4 max-w-sm mx-auto">
                <p className="text-white/80 text-sm leading-relaxed">
                    Help us tailor your experience with content and creators that match your vibe. Your selections will shape your feed, recommendations, and the creators you connect with.
                </p>
            </div>

            {isLoadingCategories ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="flex flex-wrap justify-center gap-3 mb-12 mt-4 w-full">
                    {categories.map((item) => {
                        const isActive = selected.includes(item.name);
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => toggleInterest(item.name)}
                                className={cn(
                                    "min-w-[73px] h-[36px] px-4 py-[6px] rounded-full text-sm font-medium transition-all flex items-center justify-center gap-[10px] border whitespace-nowrap",
                                    isActive
                                        ? "bg-[#FF8800]/10 border-[#FF8800] text-[#FF8800] shadow-[0_0_15px_rgba(255,136,0,0.1)]"
                                        : "bg-white/5 border-[#FF8800]/40 text-white/80 hover:border-[#FF8800] hover:text-white hover:bg-white/10 cursor-pointer"
                                )}
                            >
                                {isActive && <Check className="w-3 h-3" />}
                                {item.name}
                            </button>
                        )
                    })}
                </div>
            )}

            <Button
                onClick={handleConfirm}
                disabled={isSubmitting || selected.length === 0}
                className="w-52 rounded-full bg-[#FF8800] py-6 text-sm font-bold text-black hover:bg-[#ff9922]"
            >
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Confirm'}
            </Button>
        </StepWrapper>
    );
};

export const SignUpModal = () => {
    const { isOpen, currentStep, closeModal, openModal, setStep, isAdult, identifier, method, countryCode } = useSignUpStore();
    const { isNewUser, isAuthenticated, isHydrated } = useAuthStore();
    const location = useLocation();
    const isLiveStream = location.pathname.startsWith('/live');

    const didRecoverRef = useRef(false);
    useEffect(() => {
        if (!isHydrated || didRecoverRef.current) return;
        didRecoverRef.current = true;
        switch (currentStep) {
            case 'otp': setStep('input'); break;
            case 'age':
            case 'details': if (!isAuthenticated) { setStep('welcome'); } break;
            default: break;
        }
    }, [isHydrated]);

    useEffect(() => {
        if (isHydrated && isAuthenticated && isNewUser && !isOpen) {
            const step = currentStep;
            if (step === 'welcome' || step === 'input' || step === 'otp') { setStep('age'); }
            openModal();
        }
    }, [isHydrated, isAuthenticated, isNewUser]);

    // iOS-safe scroll lock
    useEffect(() => {
        if (!isOpen) return;
        const scrollY = window.scrollY;
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);

    // Auto-resume modal when navigating back from a legal page
    useEffect(() => {
        const legalPaths = ['/terms-conditions', '/privacy-policy', '/refund-policy'];
        if (legalPaths.includes(location.pathname)) return;
        const { pausedForLegal, resumeModal } = useSignUpStore.getState();
        if (pausedForLegal) {
            if (isAuthenticated) {
                useSignUpStore.getState().closeModal();
            } else {
                resumeModal();
            }
        }
    }, [location.pathname, isAuthenticated]);

    useEffect(() => {
        if (!isOpen) return;
        window.history.pushState({ modal: true }, '');
        const handlePopState = () => {
            // Don't close the modal if user is mid-signup (beyond welcome/input)
            if (currentStep !== 'welcome' && currentStep !== 'input') return;
            closeModal();
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [isOpen, currentStep]);

    const handleClose = () => {
        if (isAuthenticated && isNewUser) return;
        if (!['welcome', 'input'].includes(currentStep)) return;
        closeModal();
    };

    const verifiedIdentifier = method === 'phone' && countryCode
        ? `${countryCode} ${identifier}`
        : identifier;

    if (!isOpen) return null;

    return (
        <AuthModalBackdrop onClose={handleClose} size={currentStep === 'details' ? 'large' : 'default'} currentStep={currentStep}>
            {currentStep === 'welcome' && <StepWelcome />}
            {currentStep === 'input' && <StepInput isLiveStream={isLiveStream} />}
            {currentStep === 'otp' && <StepOTP isLiveStream={isLiveStream} />}
            {currentStep === 'age' && <StepAge />}
            {currentStep === 'details' && (
                <StepDetails
                    mode="signup"
                    isAdult={isAdult}
                    initialValues={{ identifier: verifiedIdentifier }}
                />
            )}
            {currentStep === 'interests' && <StepInterests />}
        </AuthModalBackdrop>
    );
};
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ChevronDown, Check, Pencil,
    Search, Loader2,
    Mail, Phone,
    Camera
} from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { cn } from '@/lib/utils';
import { useSignUpStore } from '@/features/auth/stores/signUpStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { authService } from '../services/auth.service';
import { toast } from 'sonner';
import { mediaService } from '../services/media.service';
import { countryCodes } from '@/lib/countries';
import GoogleLogo from '@/assets/google.svg';
import Logo from "@/assets/Logo.svg"
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthModalBackdrop } from './AuthModalBackdrop';

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
import { useUpdateProfile } from '@/features/profile/services/profile.service';

// -----StepWrapper ------- 

interface StepWrapperProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    className?: string;
}

const StepWrapper = ({
    children,
    title,
    subtitle,
    className = "",
}: StepWrapperProps) => {
    return (
        <div className={cn("flex flex-col h-full w-full overflow-y-auto custom-scrollbar", className)}>
            <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 min-h-full w-full max-w-[500px] mx-auto text-center">
                {/* Logo & Header */}
                <div className="flex flex-col items-center gap-6 shrink-0 mb-8">
                    <img src={Logo} alt="PulseLive" className='h-16 w-16 md:h-20 md:w-20' />
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">{title}</h2>
                        {subtitle && <p className="text-gray-400 font-normal text-sm md:text-lg leading-relaxed tracking-normal mt-3">{subtitle}</p>}
                    </div>
                </div>

                {/* Content */}
                <div className="w-full flex flex-col items-center flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- 1. WELCOME STEP ---
const StepWelcome = () => {
    const { setStep } = useSignUpStore();
    return (
        <StepWrapper title="Welcome to PulseLive" subtitle="Go Live. Connect. Inspire">
            <div className="mt-8 w-full flex flex-col items-center">
                <Button
                    onClick={() => setStep('input')}
                    className="w-52 rounded-full bg-[#FF8800] py-6 text-base font-bold text-black hover:bg-[#ff9922] transition-transform active:scale-95"
                >
                    Get Started →
                </Button>
                <p className="mt-16 text-md text-muted-foreground/60 px-4 max-w-xs mx-auto leading-relaxed">
                    By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </StepWrapper>
    );
};


// --- 2. INPUT STEP ---
const inputSchema = z.object({
    identifier: z.string().min(3, "Field is required"),
});

type InputFormData = z.infer<typeof inputSchema>;

const StepInput = () => {
    const { setStep, method, setMethod, setIdentifier, countryCode, setCountryCode, mode } = useSignUpStore();
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { closeModal } = useSignUpStore();
    const { authenticate } = useAuth();

    const storeIdentifier = useSignUpStore((s) => s.identifier);

    const form = useForm<InputFormData>({
        resolver: zodResolver(inputSchema),
        defaultValues: { identifier: storeIdentifier },
        mode: 'onChange'
    });

    useEffect(() => {
        form.setValue('identifier', storeIdentifier, { shouldValidate: false });
    }, [storeIdentifier]);

    const prevMethod = useRef(method);
    useEffect(() => {
        if (prevMethod.current !== method) {
            form.setValue('identifier', '', { shouldValidate: false });
            setIdentifier('');
            prevMethod.current = method;
        }
    }, [method]);

    const filteredCountries = countryCodes.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.dial_code.includes(searchQuery)
    );

    const onSubmit = async (data: InputFormData) => {
        setIsLoading(true);
        try {
            setIdentifier(data.identifier);
            await authService.initiateSignup({ method, identifier: data.identifier });
            toast.success(`OTP sent to ${data.identifier}`);
            setStep('otp');
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to send code");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <StepWrapper title={mode === 'login' ? 'Welcome to PulseLive' : 'Create Account'}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
                    <div className="text-left relative w-full">
                        <label className="block text-sm text-gray-400 mb-2 ml-1">
                            {method === 'phone' ? 'Phone number' : 'Email Address'}
                        </label>
                        <div className="flex gap-3 w-full">
                            {method === 'phone' && (
                                <div className="relative">
                                    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex items-center justify-between h-12 min-w-[100px] bg-transparent border-white/20 rounded-xl text-white hover:bg-white/5 hover:text-white hover:border-white/40 transition-all"
                                            >
                                                <span className="text-base font-medium">{countryCode}</span>
                                                <ChevronDown className="w-4 h-4 text-gray-500 ml-2 opacity-70" />
                                            </Button>
                                        </DropdownMenuTrigger>

                                        <DropdownMenuContent
                                            className="w-[300px] p-0 bg-[#1a1c24] border-white/10 text-white z-50 shadow-2xl rounded-xl"
                                            align="start"
                                            sideOffset={8}
                                        >
                                            <div className="p-3 border-b border-white/5 bg-[#1a1c24] rounded-t-xl sticky top-0 z-10">
                                                <div className="flex items-center px-3 h-10 bg-[#0f1117] rounded-lg border border-white/5 transition-colors focus-within:border-white/20">
                                                    <Search className="w-4 h-4 text-gray-500 mr-2" />
                                                    <input
                                                        className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-gray-600"
                                                        placeholder="Search country..."
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        onKeyDown={(e) => e.stopPropagation()}
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>

                                            <div className="overflow-y-auto max-h-[240px] p-1.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none]">
                                                {filteredCountries.map((c) => (
                                                    <DropdownMenuItem
                                                        key={c.code}
                                                        onClick={() => {
                                                            setCountryCode(c.dial_code);
                                                            setSearchQuery("");
                                                            setIsDropdownOpen(false);
                                                        }}
                                                        className="cursor-pointer py-2.5 px-3 rounded-lg text-sm hover:bg-white/5 focus:bg-white/5 text-gray-200 focus:text-white flex items-center justify-between group transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <span className="text-gray-500 font-mono text-xs w-10 text-right shrink-0 group-hover:text-gray-400 transition-colors">
                                                                {c.dial_code}
                                                            </span>
                                                            <span className="truncate font-medium">
                                                                {c.name}
                                                            </span>
                                                        </div>
                                                        {countryCode === c.dial_code && (
                                                            <Check className="w-4 h-4 text-[#FF8800]" />
                                                        )}
                                                    </DropdownMenuItem>
                                                ))}
                                                {filteredCountries.length === 0 && (
                                                    <div className="py-8 text-center text-sm text-gray-500">
                                                        No country found
                                                    </div>
                                                )}
                                            </div>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
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
                                                placeholder={method === 'phone' ? "Enter mobile number here..." : "Enter email address here..."}
                                                className="h-12 bg-transparent border-white/20 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-white/40 shadow-none"
                                            />
                                        </FormControl>
                                        <FormMessage className="text-xs text-red-400" />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 w-full">
                        <Button
                            type="submit"
                            disabled={isLoading || !form.formState.isValid}
                            className="flex-1 rounded-full bg-[#1a1c24] hover:bg-[#252833] py-6 text-sm font-medium text-gray-200 transition-all border border-white/5"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {isLoading ? 'Sending...' : 'Verify'}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeModal}
                            disabled={isLoading}
                            className="flex-1 rounded-full border-[#FF8800] py-6 text-sm font-bold text-[#FF8800] hover:bg-[#FF8800]/10 hover:text-[#FF8800] bg-transparent transition-all"
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Form>

            <div className="pt-6 w-full flex justify-center mb-6">
                <div className="flex items-center w-full max-w-[200px]">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="px-3 text-xs text-gray-500">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 mx-auto items-center justify-center w-full">
                <Button
                    variant="link"
                    type="button"
                    onClick={() => setMethod(method === 'phone' ? 'email' : 'phone')}
                    className="text-xs text-white/90 hover:no-underline hover:text-white h-auto p-0 flex items-center gap-2"
                >
                    {method === 'phone' ? <Mail className="w-4 h-4 text-white" /> : <Phone className="w-4 h-4 text-white" />}
                    <span className="text-center">{mode === 'login' ? 'Login' : 'Signup'} with {method === 'phone' ? 'Email' : 'Phone'}</span>
                </Button>

                {/* Separator for desktop */}
                <div className="hidden sm:block w-px h-4 bg-white/20" />

                <div className="relative w-max">
                    <Button
                        variant="link"
                        className="text-xs text-white/90 hover:no-underline hover:text-white h-auto p-0 flex items-center gap-2"
                    >
                        <img src={GoogleLogo} alt="Google" className="w-4 h-4" />
                        <span className="text-center">{mode === 'login' ? 'Login' : 'Signup'} with Google</span>
                    </Button>
                    <div className="absolute inset-0 z-10 opacity-0 overflow-hidden cursor-pointer">
                        <GoogleLogin
                            onSuccess={(credentialResponse) => {
                                if (credentialResponse.credential) {
                                    authenticate({
                                        url: '/auth/google',
                                        payload: {
                                            idToken: credentialResponse.credential,
                                        }
                                    });
                                }
                            }}
                            onError={() => toast.error("Google Signup Failed")}
                            theme="filled_black"
                            shape="rectangular"
                            size="medium"
                            width="200"
                            text="signup_with"
                        />
                    </div>
                </div>
            </div>
        </StepWrapper>
    );
};

// --- 3. OTP STEP ---
const StepOTP = () => {
    const { setStep, identifier, method, countryCode } = useSignUpStore();
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(58);
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

        // Only process if it's a 6-digit number
        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split('');
            setOtp(digits);
            // Focus the last input
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
            payload: payload
        }, {
            onSuccess: () => {
                setStep('age');
            },
            onError: () => {
                setError("Invalid OTP or expired.");
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
        } catch (e) {
            toast.error("Failed to resend OTP");
        }
    }

    return (
        <StepWrapper title="">
            {/* Custom Title to match specific layout of OTP screen */}
            <div className="mb-8">
                <p className="text-gray-400 text-lg flex items-center justify-center gap-2">
                    OTP sent to  <span className="text-white font-semibold text-xl">{method === 'phone' ? `${countryCode}-${identifier}` : identifier}</span>
                    <button onClick={() => setStep('input')} className="text-blue-500 hover:text-blue-400 cursor-pointer ml-1">
                        <Pencil className="w-4 h-4" />
                    </button>
                </p>
            </div>

            <div className="flex gap-3 justify-center mb-8">
                {otp.map((digit, i) => (
                    <Input
                        key={i}
                        ref={(el) => { if (el) inputRefs.current[i] = el }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        onPaste={handlePaste}
                        disabled={isLoading}
                        className={cn(
                            "w-12 h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl font-normal text-white transition-all bg-transparent rounded-xl",
                            error
                                ? "border-red-500 text-red-500 focus-visible:ring-0"
                                : "border-white/20 focus-visible:ring-0 focus-visible:border-white/50"

                        )}
                    />
                ))}
            </div>

            {error && <p className="text-red-500 text-sm mb-6">{error}</p>}

            <div className='mb-8 text-sm text-gray-400'>
                An OTP has been sent on your {method === 'email' ? 'email' : 'number'} <br />
                in <span className="text-white font-mono">{resendCooldown < 10 ? `0${resendCooldown}` : resendCooldown} sec</span>{' '}
                <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-blue-500 hover:text-blue-400 disabled:text-gray-600 disabled:cursor-not-allowed ml-1"
                >
                    Resend OTP
                </button>
            </div>

            <div className="flex gap-4 w-full">
                <Button
                    onClick={handleSubmit}
                    disabled={otp.some(d => !d) || isLoading}
                    className="flex-1 rounded-full bg-[#FF8800] py-6 text-sm font-bold text-black hover:bg-[#ff9922] transition-transform active:scale-95 disabled:bg-white/10 disabled:text-gray-500"
                >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => setStep('input')}
                    disabled={isLoading}
                    className="flex-1 rounded-full border-[#FF8800] py-6 text-sm font-bold text-[#FF8800] hover:bg-[#FF8800]/10 bg-transparent hover:text-[#FF8800]"
                >
                    Cancel
                </Button>
            </div>

            <p className="mt-12 text-xs text-gray-500">
                by logging in you agree to our <span className="text-blue-500 cursor-pointer">terms & conditions</span> & <span className="text-blue-500 cursor-pointer">privacy policy</span>
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
            if (isAdult) {
                // Update age consent via PUT endpoint only if 18+
                await authService.updateAgeConsent(true);
            }

            // Update local auth store so the user state is fresh
            useAuthStore.getState().updateUser({ eighteenPlus: isAdult });

            if (isAdult) {
                if (onAgeVerified) {
                    onAgeVerified();
                    closeModal();
                    reset();
                } else {
                    // Default flow for signup: continue to profile details
                    setStep('details');
                }
            } else {
                // If they say no, skip PUT request and move to next step automatically
                if (onAgeVerified) {
                    // If user was trying to go live, they can't. Close modal.
                    closeModal();
                    reset();
                } else {
                    // In signup flow, just move to details
                    setStep('details');
                }
            }
        } catch (error: any) {
            console.error('Failed to update age consent:', error);
            toast.error(error.response?.data?.message || "Failed to update age consent");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <StepWrapper title="Age Confirmation">
            <p className="text-gray-400 text-sm md:text-base mb-12 leading-relaxed max-w-sm mx-auto">
                Before entering this website, you must confirm the following information.
            </p>

            <div className="bg-transparent mb-12 max-w-sm mx-auto">
                <p className="text-gray-400 text-sm leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer sed venenatis est. Cras sagittis luctus erat, nec dignissim dui fermentum quis. Fusce pharetra sit amet.
                </p>
            </div>

            <div className="flex gap-4 w-full">
                <Button
                    onClick={() => handleAgeSelection(true)}
                    disabled={isLoading}
                    className="flex-1 rounded-full bg-[#FF8800] py-6 text-sm font-bold text-black hover:bg-[#ff9922]"
                >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Yes, I agree let me in
                </Button>
                <Button
                    variant="outline"
                    onClick={() => handleAgeSelection(false)}
                    disabled={isLoading}
                    className="flex-1 rounded-full border-[#FF8800] py-6 text-sm font-bold text-[#FF8800] hover:bg-[#FF8800]/10 bg-transparent hover:text-[#FF8800]"
                >
                    Disagree, I am under 18
                </Button>
            </div>

            <p className="mt-12 text-xs text-gray-500">
                by logging in you agree to our <span className="text-blue-500 cursor-pointer">terms & conditions</span> & <span className="text-blue-500 cursor-pointer">privacy policy</span>
            </p>
        </StepWrapper>
    );
};

// --- 5. DETAILS STEP (FIXED TWO-COLUMN LAYOUT) ---
const detailsSchema = z.object({
    fullName: z.string({ message: "Full name is required" }).min(2, "Min 2 chars"),
    location: z.string({ message: "Please select a location" }).min(2, "Please select a location"),
    bio: z.string().max(100).nullable().optional(),
});

type DetailsFormData = z.infer<typeof detailsSchema>;

const generateAvatarFile = async (name: string): Promise<File> => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Make it rounded
    ctx.beginPath();
    ctx.arc(200, 200, 200, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Background
    const colors = ['#FF8800', '#FF5500', '#FFAA00', '#FF3300', '#FFCC00'];
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.fillRect(0, 0, 400, 400);

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 200px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((name[0] || '?').toUpperCase(), 200, 200);

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
    const user = useAuthStore((s) => s.user);
    const isAdult = isAdultProp ?? store.isAdult;

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(initialValues?.profileImage ?? null);
    const [profileImageKey, setProfileImageKey] = useState<string | null>(initialValues?.profileImage ?? null);
    const [isUploading, setIsUploading] = useState(false);
    const [cameraMenuOpen, setCameraMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Setup React Hook Form
    const form = useForm<DetailsFormData>({
        resolver: zodResolver(detailsSchema),
        defaultValues: {
            fullName: initialValues?.fullName ?? "",
            location: initialValues?.location ?? "India",
            bio: initialValues?.bio ?? "",
        },
        mode: 'onChange'
    });

    // Username Availability Check with Debounce
    useEffect(() => {
        if (mode !== 'signup') return;
        if (!username || username.length < 3) {
            setIsUsernameAvailable(null);
            return;
        }

        // Don't check availability if username contains spaces
        if (/\s/.test(username)) {
            setIsUsernameAvailable(false);
            setUsernameError('Spaces are not allowed');
            return;
        }

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

        // Validation
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            toast.error("Please upload a JPEG or PNG image only");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Image size must be less than 2MB");
            return;
        }

        setIsUploading(true);
        try {
            const extension = file.name.split('.').pop() || 'png';
            const { uploadUrl, fullUrl } = await mediaService.generatePresignedUrl('PROFILE_IMAGE', extension);

            await mediaService.uploadFileToS3(uploadUrl, file);

            setProfileImage(fullUrl);
            setProfileImageKey(fullUrl);
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
            toast.success("Profile photo removed");
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete image");
        }
    };

   const onSubmit = async (data: DetailsFormData) => {
        if (mode === 'signup') {
            if (username.length < 3) { 
                setUsernameError('Min 3 chars'); 
                return; 
            }
            if (isUsernameAvailable === false) return;
        }

        setIsLoading(true);
        try {
            let currentProfileImageKey = profileImageKey;

            // Avatar generation logic
            if (!currentProfileImageKey) {
                try {
                    const file = await generateAvatarFile(data.fullName);
                    const { uploadUrl, fullUrl } = await mediaService.generatePresignedUrl('PROFILE_IMAGE', 'png');
                    await mediaService.uploadFileToS3(uploadUrl, file);
                    currentProfileImageKey = fullUrl;
                } catch (err) {
                    console.error("Failed to generate/upload default avatar", err);
                    // Fallback if generation/upload fails
                    currentProfileImageKey = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.fullName)}&background=random`;
                }
            }

            // --- UPDATED MUTATION CALL ---
            await updateProfileMutation({
                data: {
                    ...data,
                    username: mode === 'signup' ? username : (initialValues?.username ?? ''),
                    bio: data.bio ?? "",
                    eighteenPlus: isAdult,
                    profileImage: currentProfileImageKey || ""
                }
            });
            // ------------------------------

            if (mode === 'signup') {
                useAuthStore.setState({ isNewUser: false });
                toast.success("Account created successfully!");
                onSuccess?.();
                store.closeModal();
                store.reset();
                navigate({ to: '/for-you' });
            } else {
                toast.success("Profile updated successfully!");
                onSuccess?.();
            }
        } catch (error: any) {
            console.error("Profile update error:", error);
            toast.error(error.response?.data?.message || "Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    const title = mode === 'edit' ? 'Edit Profile' : 'Almost There!';
    const subtitle = mode === 'edit' ? 'Update your profile details below.' : 'Welcome, Please fill the missing fields.';
    const submitLabel = mode === 'edit' ? 'Save' : 'Enter PulseLive';

    const identifierPill = mode === 'signup'
        ? (store.identifier?.includes('@')
            ? store.identifier
            : (store.identifier && store.method === 'phone' && store.countryCode
                ? `${store.countryCode} ${store.identifier}`
                : (store.identifier || useAuthStore.getState().user?.email || '')))
        : initialValues?.identifier;

    return (
        <div className="flex h-full w-full overflow-y-auto custom-scrollbar items-start p-5">

            {/* ── Left Card ── */}
            <div className="flex flex-col items-center gap-8 bg-[#1D1F20] rounded-xl py-16.5 px-8 w-97.5 h-full shrink-0 border border-white/5 self-start">

                {/* Verified identifier pill */}
                {identifierPill && (
                    <div className="w-full rounded-lg border border-blue-500/50 bg-transparent h-12 px-5 py-7 flex justify-between items-center gap-8">
                        <span className="text-gray-300 text-[16px] truncate">{identifierPill}</span>
                        <div className="shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                        </div>
                    </div>
                )}

                {/* Avatar with gradient ring */}
                <div className="relative mt-1">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/jpeg,image/png"
                        onChange={handleFileChange}
                    />
                    <div className="size-33 rounded-full p-0.75"
                        style={{ background: 'linear-gradient(135deg, #6366f1 0%, #3b3bd6 50%, #ef4444 100%)' }}
                    >
                        <div className="w-full h-full rounded-full bg-[#1c1e27] p-0.5">
                            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-4xl font-bold text-white">
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
                        <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => setCameraMenuOpen(o => !o)}
                            className="bg-white rounded-full p-1.5 cursor-pointer shadow-lg hover:scale-110 transition-transform flex items-center justify-center border-2 border-[#1D1F20]"
                        >
                            <Camera className="w-4 h-4 text-black" />
                        </button>
                        {cameraMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    style={{ background: 'transparent' }}
                                    onClick={() => setCameraMenuOpen(false)}
                                />
                                <div className="absolute bottom-full -right-20 mb-2 z-50 min-w-[130px] bg-[#1a1c24] border border-white/10 rounded-xl p-1 shadow-2xl">
                                    <button
                                        type="button"
                                        onClick={() => { fileInputRef.current?.click(); setCameraMenuOpen(false); }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white cursor-pointer hover:bg-white/5 rounded-lg"
                                    >
                                        {profileImage ? 'Change Photo' : 'Add Photo'}
                                    </button>

                                    {profileImage && (
                                        <>
                                            <div className="my-1 border-t border-white/10" />
                                            <button
                                                type="button"
                                                onClick={() => { handleDeletePhoto(); setCameraMenuOpen(false); }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white cursor-pointer hover:bg-red-400/5 rounded-lg"
                                            >
                                                Delete Photo
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Name Input */}
                <div className="w-full">
                    <label className="block text-xs text-gray-400 mb-2">Your name</label>
                    <Form {...form}>
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            className="h-12 bg-[#111213] border-white/20 rounded-lg text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:border-white/40 text-[16px] px-5 py-7"
                                            placeholder="No Name"
                                            style={{ border: '1px solid var(--Grey-Grey-5, #959A9D)' }}
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />
                    </Form>
                </div>

                <p className="text-xs text-gray-600 text-center leading-relaxed">
                    You can edit your profile picture or upload a new one (JPG or PNG)
                </p>
            </div>

            {/* Right Column - Form Fields */}
            <div className="flex flex-col flex-1 justify-start px-8 py-4 min-w-0">

                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-1">{title}</h2>
                <p className="text-gray-400 text-sm mb-7">{subtitle}</p>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">

                        {/* Username & Location Row */}
                        <div className="grid grid-cols-2 gap-4 items-start">
                            {/* Username */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between" style={{ height: '20px' }}>
                                    <label className="text-xs text-gray-400">User name</label>
                                    {mode === 'signup' && isCheckingUsername && <Loader2 className="w-3 h-3 animate-spin text-gray-500" />}
                                    {mode === 'signup' && isUsernameAvailable === true && !isCheckingUsername && <Check className="w-3 h-3 text-green-500" />}
                                </div>
                                {mode === 'signup' ? (
                                    <>
                                        <input
                                            value={username}
                                            onChange={(e) => {
                                                setUsername(e.target.value);
                                                setUsernameError('');
                                                setIsUsernameAvailable(null);
                                            }}
                                            placeholder="Enter your user name"
                                            className={cn(
                                                "w-full bg-[#111213] border rounded-xl text-white text-sm placeholder:text-gray-600 outline-none transition-colors px-5 py-7",
                                                "border-white/20 focus:border-white/40",
                                                isUsernameAvailable === false && "border-red-500/70",
                                                isUsernameAvailable === true && "border-green-500/40"
                                            )}
                                            style={{ height: '48px', border: '1px solid var(--Grey-Grey-5, #959A9D)' }}
                                        />
                                        {usernameError && <p className="text-[10px] text-red-400 mt-0.5">{usernameError}</p>}
                                    </>
                                ) : (
                                    <input
                                        value={initialValues?.username ?? ''}
                                        readOnly
                                        tabIndex={-1}
                                        className="w-full bg-white/3 border border-white/10 rounded-lg text-gray-500 cursor-not-allowed text-sm select-none outline-none px-5 py-7"
                                        style={{ height: '48px', border: '1px solid var(--Grey-Grey-5, #959A9D)' }}
                                    />
                                )}
                            </div>

                            {/* Location */}
                            <FormField
                                control={form.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col gap-1.5">
                                        <label className="text-xs text-gray-400" style={{ height: '20px', display: 'flex', alignItems: 'center' }}>Location</label>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger
                                                    className="bg-[#111213] border-white/20 rounded-lg text-white
                                                                focus:ring-0 focus:border-white/40
                                                                text-sm w-full px-5 py-7 h-12
                                                                [&>svg]:text-white!
                                                                [&>svg]:opacity-100!
                                                                [&>svg]:w-5
                                                                [&>svg]:h-5"
                                                    style={{ border: '1px solid var(--Grey-Grey-5, #959A9D)' }}
                                                >
                                                    <SelectValue placeholder="Select Location" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent
                                                className="bg-[#1a1c24] border-white/10 text-white max-h-60"
                                                position="popper"
                                            >
                                                {countryCodes.map(c => (
                                                    <SelectItem key={c.code} value={c.name} className="focus:bg-white/10 focus:text-white cursor-pointer text-[16px]">
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Bio */}
                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                    <label className="text-xs text-gray-400">Bio</label>
                                    <FormControl>
                                        <div className="relative">
                                            <Textarea
                                                {...field}
                                                value={field.value ?? ""}
                                                className="bg-[#111213] border-white/20 rounded-lg text-white placeholder:text-gray-600 focus-visible:ring-0 focus-visible:border-white/40 resize-y min-h-[100px] py-3 text-[16px]"
                                                placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                                                maxLength={100}
                                                style={{ border: '1px solid var(--Grey-Grey-5, #959A9D)' }}
                                            />
                                            <span className="absolute bottom-2 right-3 text-[10px] text-gray-500">
                                                {field.value?.length || 0}/100
                                            </span>
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        {/* Submit Button */}
                        <div className="flex gap-3 mt-8">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="rounded-full bg-[#FF8800] h-12 px-18 text-sm font-bold text-black hover:bg-[#ff9922] transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                                {isLoading
                                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                                    : submitLabel
                                }
                            </Button>

                            {onCancel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={isLoading}
                                    className="rounded-full border-[#FF8800] h-12 px-18 text-sm font-bold text-[#FF8800] hover:bg-[#FF8800]/10 bg-transparent hover:text-[#FF8800] cursor-pointer"
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>

                        <p className="text-xs text-gray-500 mt-4">
                            By continuing, I agree to{' '}
                            <span className="text-blue-500 cursor-pointer hover:underline">terms & conditions</span>
                            {' '}&{' '}
                            <span className="text-blue-500 cursor-pointer hover:underline">privacy policy</span>
                        </p>
                    </form>
                </Form>
            </div>


        </div>
    );
};



// --- MAIN EXPORT ---
export const SignUpModal = () => {
    const { isOpen, currentStep, closeModal, openModal, setStep, isAdult, identifier, method, countryCode } = useSignUpStore();
    const { isNewUser, isAuthenticated, isHydrated } = useAuthStore();

    useEffect(() => {
        if (isHydrated && isAuthenticated && isNewUser && !isOpen) {
            const step = currentStep;
            if (step === 'welcome' || step === 'input' || step === 'otp') {
                setStep('age');
            }
            openModal();
        }
    }, [isHydrated, isAuthenticated, isNewUser]);

    if (!isOpen) return null;

    const handleClose = () => {
        if (isAuthenticated && isNewUser) return;
        closeModal();
    };

    const verifiedIdentifier = method === 'phone' && countryCode
        ? `${countryCode} ${identifier}`
        : identifier;

    return (
        <AuthModalBackdrop onClose={handleClose} size={currentStep === 'details' ? 'large' : 'default'}>
            {currentStep === 'welcome' && <StepWelcome />}
            {currentStep === 'input' && <StepInput />}
            {currentStep === 'otp' && <StepOTP />}
            {currentStep === 'age' && <StepAge />}
            {currentStep === 'details' && (
                <StepDetails
                    mode="signup"
                    isAdult={isAdult}
                    initialValues={{ identifier: verifiedIdentifier }}
                />
            )}
        </AuthModalBackdrop>
    );
};
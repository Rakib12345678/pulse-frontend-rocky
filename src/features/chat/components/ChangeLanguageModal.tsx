import { useEffect, useState, useRef } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { chatService } from '../services/chat.service';
import type { Language } from '../types/chat.types';

const DEFAULT_LANGUAGE = 'en';

interface ChangeLanguageModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const ChangeLanguageModal = ({
    onClose, onSuccess,
}: ChangeLanguageModalProps) => {
    const { user, updateUser } = useAuthStore();
    const [languages, setLanguages] = useState<Language[]>([]);
    const [selected, setSelected] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fetchErr, setFetchErr] = useState(false);
    const backdropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLoading(true);
        chatService.getLanguages()
            .then(langs => {
                setLanguages(langs);
                const match = user?.preferredLanguage && langs.find(l => l.code === user.preferredLanguage);
                if (match) { setSelected(match.code); }
                else {
                    const en = langs.find(l => l.code === DEFAULT_LANGUAGE);
                    setSelected(en?.code ?? langs[0]?.code ?? '');
                }
            })
            .catch(() => setFetchErr(true))
            .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleConfirm = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await chatService.updateUserLanguage(selected);
            updateUser({ preferredLanguage: selected });
            onSuccess();
            onClose();
        } catch {
            toast.error('Failed to update language');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            ref={backdropRef}
            onClick={e => { if (e.target === backdropRef.current) onClose(); }}
            className="fixed inset-0 z-600 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        >
            <div className="relative w-full max-w-md bg-[#111213] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-900/20 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 px-8 pt-7 pb-7 flex flex-col gap-6">
                    <div className="flex items-center justify-center">
                        <h2 className="text-white font-bold text-lg tracking-wide">Change Language</h2>
                    </div>
                    <p className="text-center text-gray-400 text-sm leading-relaxed">
                        Select the language you want messages translated into.
                    </p>
                    {loading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 className="w-5 h-5 animate-spin text-[#FF7700]" />
                        </div>
                    ) : fetchErr ? (
                        <p className="text-center text-red-400 text-sm">Failed to load languages. Please try again.</p>
                    ) : (
                        <div className="relative">
                            <select
                                value={selected}
                                onChange={e => setSelected(e.target.value)}
                                className="w-full h-12 pl-4 pr-10 rounded-full text-sm text-white bg-transparent border border-white/20 focus:border-white/40 focus:outline-none appearance-none cursor-pointer transition-colors"
                            >
                                {languages.map((lang: Language) => (
                                    <option key={lang.code} value={lang.code} className="bg-[#1a1c23] text-white">
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    )}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={handleConfirm}
                            disabled={saving || loading || fetchErr || !selected}
                            className={cn(
                                'flex-1 h-11 rounded-full text-sm font-semibold transition-all active:scale-95 flex items-center justify-center gap-2',
                                saving || loading || fetchErr || !selected
                                    ? 'bg-[#FF7700]/50 text-black/60 cursor-not-allowed'
                                    : 'bg-[#FF7700] text-black hover:bg-[#ff9922]',
                            )}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Change
                        </button>
                        <button
                            onClick={onClose}
                            disabled={saving}
                            className="flex-1 h-11 rounded-full border border-[#FF7700] text-[#FF7700] text-sm font-semibold hover:bg-[#FF7700]/10 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

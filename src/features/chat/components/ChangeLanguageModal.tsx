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
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-300"
        >
            <div 
                className="relative w-full max-w-[400px] rounded-[32px] shadow-2xl overflow-hidden p-10 flex flex-col items-center text-center backdrop-blur-[354px]"
                style={{ 
                    background: 'linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), rgba(18, 18, 18, 0.9)' 
                }}
            >
                <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">Change Language</h2>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-[240px]">
                    Select the language you want messages translated into.
                </p>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[#FF7700]" />
                    </div>
                ) : fetchErr ? (
                    <p className="text-center text-red-400 text-sm py-4">Failed to load languages. Please try again.</p>
                ) : (
                    <div className="w-full mb-10">
                        <select
                            value={selected}
                            onChange={e => setSelected(e.target.value)}
                            className="w-full h-12 pl-5 pr-12 rounded-full text-sm text-white bg-white/5 border border-white/10 focus:border-[#FF7700]/50 focus:outline-none appearance-none cursor-pointer transition-all"
                        >
                            {languages.map((lang: Language) => (
                                <option key={lang.code} value={lang.code} className="bg-[#1a1c23] text-white">
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                )}

                <div className="flex items-center gap-4 w-full justify-center">
                    <button
                        onClick={handleConfirm}
                        disabled={saving || loading || fetchErr || !selected}
                        className={cn(
                            'flex-1 h-14 rounded-full font-extrabold text-base transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer',
                            saving || loading || fetchErr || !selected
                                ? 'bg-[#FF7700]/30 text-black/40 cursor-not-allowed'
                                : 'bg-[#FF7700] text-black hover:opacity-90 shadow-lg shadow-orange-500/20',
                        )}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        Change
                    </button>
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 h-14 rounded-full border-2 border-[#FF7700] text-[#FF7700] font-extrabold text-base hover:bg-[#FF7700]/5 transition-all active:scale-95 cursor-pointer bg-transparent"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>

    );
};

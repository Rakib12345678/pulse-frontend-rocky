import { useEffect, useState, useMemo } from 'react';
import { Loader2, Check, Search, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { chatService } from '../services/chat.service';
import type { Language } from '../types/chat.types';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from '@/components/ui/drawer';

const DEFAULT_LANGUAGE = 'en';

interface TranslateDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export const TranslateDrawer = ({
    open,
    onOpenChange,
    onSuccess,
}: TranslateDrawerProps) => {
    const { user, updateUser } = useAuthStore();
    const [languages, setLanguages] = useState<Language[]>([]);
    const [selected, setSelected] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [fetchErr, setFetchErr] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!open) return;
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
    }, [open, user?.preferredLanguage]);

    const filteredLanguages = useMemo(() => {
        if (!searchQuery.trim()) return languages;
        return languages.filter(l =>
            l.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [languages, searchQuery]);

    const handleConfirm = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            await chatService.updateUserLanguage(selected);
            updateUser({ preferredLanguage: selected });
            onSuccess();
            onOpenChange(false);
        } catch {
            toast.error('Failed to update language');
        } finally {
            setSaving(false);
        }
    };

    const selectedLanguageName = languages.find(l => l.code === selected)?.name ?? 'Select Language...';

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className="bg-[#121212] border-none rounded-t-[32px] p-6 pb-10 max-h-[90vh] flex flex-col">
                <div className="mx-auto w-12 h-1.5 bg-white/20 rounded-full mb-6 shrink-0" />

                <DrawerHeader className="items-center text-center p-0 mb-6 flex-shrink-0">
                    <DrawerTitle className="text-2xl font-bold text-white mb-2">Translate Chat</DrawerTitle>
                    <DrawerDescription className="text-gray-400 text-sm leading-relaxed max-w-[320px]">
                        Select the language you want messages translated into.
                    </DrawerDescription>
                </DrawerHeader>

                {loading ? (
                    <div className="flex justify-center py-12 flex-1">
                        <Loader2 className="w-8 h-8 animate-spin text-[#FF7700]" />
                    </div>
                ) : fetchErr ? (
                    <p className="text-center text-red-400 text-sm py-4 flex-1">Failed to load languages. Please try again.</p>
                ) : (
                    <div className="flex flex-col mb-8 overflow-hidden transition-all duration-300">
                        {/* Searchable Dropdown Trigger (matching desktop pattern) */}
                        <div
                            onClick={() => setIsOpen(!isOpen)}
                            className="w-full h-14 pl-5 pr-12 rounded-full text-base text-white bg-white/5 border border-white/10 flex items-center cursor-pointer transition-all hover:bg-white/10 relative shrink-0 mb-4"
                        >
                            <span className="truncate">{selectedLanguageName}</span>
                            <ChevronDown className={cn("absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 transition-transform duration-200 pointer-events-none", isOpen && "rotate-180")} />
                        </div>

                        {/* Search + List (visible when isOpen is true) */}
                        {isOpen && (
                            <div className="flex flex-col min-h-0 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Search Input */}
                                <div className="relative mb-4 shrink-0">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search language..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-12 pl-11 pr-11 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-gray-500 focus:outline-none focus:border-[#FF7700]/50 transition-colors"
                                        autoFocus
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Language List - Half height as requested */}
                                <div className="h-[200px] overflow-y-auto scrollbar-hide bg-[#1A1C1E] rounded-2xl border border-white/10">
                                    {filteredLanguages.length > 0 ? (
                                        <div className="divide-y divide-white/5">
                                            {filteredLanguages.map((lang: Language) => (
                                                <div
                                                    key={lang.code}
                                                    onClick={() => {
                                                        setSelected(lang.code);
                                                        setIsOpen(false);
                                                    }}
                                                    className={cn(
                                                        "px-6 py-4 flex items-center justify-between cursor-pointer transition-colors",
                                                        selected === lang.code ? "bg-[#FF7700] text-black" : "text-gray-300 hover:bg-white/5"
                                                    )}
                                                >
                                                    <span className="text-base font-medium">{lang.name}</span>
                                                    {selected === lang.code && <Check className="w-5 h-5 font-bold" />}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-10 text-center text-gray-500 text-sm">
                                            No results for "{searchQuery}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex flex-row gap-4 w-full shrink-0 mt-auto">
                    <button
                        onClick={handleConfirm}
                        disabled={saving || loading || fetchErr || !selected}
                        className={cn(
                            'flex-1 h-15 rounded-full font-semibold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer',
                            saving || loading || fetchErr || !selected
                                ? 'bg-white/10 text-gray-400 cursor-not-allowed border border-white/5'
                                : 'bg-[#FF7700] text-black hover:opacity-90 shadow-lg shadow-orange-500/20',
                        )}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {user?.preferredLanguage ? 'Change' : 'Translate'}
                    </button>
                    <button
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                        className="flex-1 h-15 rounded-full border-2 border-[#FF7700] text-[#FF7700] font-semibold text-lg hover:bg-[#FF7700]/5 transition-all active:scale-95 cursor-pointer bg-transparent"
                    >
                        Cancel
                    </button>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

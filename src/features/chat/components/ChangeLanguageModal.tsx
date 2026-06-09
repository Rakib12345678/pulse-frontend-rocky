import { useEffect, useState, useRef, useMemo } from "react";
import { Loader2, ChevronDown, Search, X, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth/stores/authStore";
import { chatService } from "../services/chat.service";
import type { Language } from "../types/chat.types";

const DEFAULT_LANGUAGE = "en";

interface ChangeLanguageModalProps {
	onClose: () => void;
	onSuccess: () => void;
}

export const ChangeLanguageModal = ({
	onClose,
	onSuccess,
}: ChangeLanguageModalProps) => {
	const { user, updateUser } = useAuthStore();
	const [languages, setLanguages] = useState<Language[]>([]);
	const [selected, setSelected] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [fetchErr, setFetchErr] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const backdropRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setLoading(true);
		chatService
			.getLanguages()
			.then((langs) => {
				setLanguages(langs);
				const match =
					user?.preferredLanguage &&
					langs.find((l) => l.code === user.preferredLanguage);
				if (match) {
					setSelected(match.code);
				} else {
					const en = langs.find((l) => l.code === DEFAULT_LANGUAGE);
					setSelected(en?.code ?? langs[0]?.code ?? "");
				}
			})
			.catch(() => setFetchErr(true))
			.finally(() => setLoading(false));

		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const filteredLanguages = useMemo(() => {
		if (!searchQuery.trim()) return languages;
		return languages.filter((l) =>
			l.name.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [languages, searchQuery]);

	const handleConfirm = async () => {
		if (!selected) return;
		setSaving(true);
		try {
			await chatService.updateUserLanguage(selected);
			updateUser({ preferredLanguage: selected });
			onSuccess();
			onClose();
		} catch {
			toast.error("Failed to update language");
		} finally {
			setSaving(false);
		}
	};

	const selectedLanguageName =
		languages.find((l) => l.code === selected)?.name ?? "Select Language...";

	return (
		<div
			ref={backdropRef}
			onClick={(e) => {
				if (e.target === backdropRef.current) onClose();
			}}
			className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-300"
		>
			<div
				className="relative w-full max-w-[500px] rounded-[32px] shadow-2xl p-10 flex flex-col items-center text-center backdrop-blur-[354px]"
				style={{
					background:
						"linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), rgb(17, 18, 19)",
				}}
			>
				<h2 className="text-2xl font-bold text-white mb-4 tracking-tight">
					Change Language
				</h2>
				<p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-[240px]">
					Select the language you want messages translated into.
				</p>

				{loading ? (
					<div className="flex justify-center py-8">
						<Loader2 className="w-6 h-6 animate-spin text-[#FF7700]" />
					</div>
				) : fetchErr ? (
					<p className="text-center text-red-400 text-sm py-4">
						Failed to load languages. Please try again.
					</p>
				) : (
					<div className="w-full mb-10 relative" ref={dropdownRef}>
						{/* Custom Searchable Dropdown Trigger */}
						<div
							onClick={() => setIsOpen(!isOpen)}
							className="w-full h-12 pl-5 pr-12 rounded-full text-sm text-white bg-white/5 border border-white/10 focus-within:border-[#FF7700]/50 flex items-center cursor-pointer transition-all hover:bg-white/10 relative"
						>
							<span className="truncate">{selectedLanguageName}</span>
							<ChevronDown
								className={cn(
									"absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform duration-200 pointer-events-none",
									isOpen && "rotate-180",
								)}
							/>
						</div>

						{/* Dropdown Menu */}
						{isOpen && (
							<div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1C23] border border-white/10 rounded-2xl shadow-2xl z-[10001] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
								<div className="p-3 border-b border-white/5 relative">
									<Search className="absolute left-6 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
									<input
										type="text"
										placeholder="Search language..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										onClick={(e) => e.stopPropagation()}
										className="w-full h-10 pl-10 pr-10 bg-white/5 border border-white/5 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF7700]/30 transition-all"
										autoFocus
									/>
									{searchQuery && (
										<button
											onClick={(e) => {
												e.stopPropagation();
												setSearchQuery("");
											}}
											className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
										>
											<X className="w-3.5 h-3.5" />
										</button>
									)}
								</div>
								<div className="max-h-[220px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
									{filteredLanguages.length > 0 ? (
										filteredLanguages.map((lang: Language) => (
											<div
												key={lang.code}
												onClick={(e) => {
													e.stopPropagation();
													setSelected(lang.code);
													setIsOpen(false);
												}}
												className={cn(
													"px-5 py-3 flex items-center justify-between cursor-pointer transition-colors text-sm",
													selected === lang.code
														? "bg-[#FF7700] text-black"
														: "text-gray-300 hover:bg-white/5",
												)}
											>
												<span>{lang.name}</span>
												{selected === lang.code && (
													<Check className="w-4 h-4" />
												)}
											</div>
										))
									) : (
										<div className="p-5 text-center text-gray-500 text-xs">
											No languages found
										</div>
									)}
								</div>
							</div>
						)}
					</div>
				)}

				<div className="flex items-center gap-4 w-full justify-center">
					<button
						onClick={handleConfirm}
						disabled={saving || loading || fetchErr || !selected}
						className={cn(
							"flex-1 h-14 rounded-full font-extrabold text-base transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer",
							saving || loading || fetchErr || !selected
								? "bg-[#FF7700]/30 text-black/40 cursor-not-allowed"
								: "bg-[#FF7700] text-black hover:opacity-90 shadow-lg shadow-orange-500/20",
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

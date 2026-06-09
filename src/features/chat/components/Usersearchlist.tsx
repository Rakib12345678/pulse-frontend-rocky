import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, Search, UserSearch } from "lucide-react";
import { getStreamClient } from "@/features/chat/stream/streamClient";
import { UserAvatar } from "@/components/UserAvatar";
import {
	getDisplayName,
	capitalizeName,
} from "@/features/chat/utils/ChatUtils";
import { toAbsoluteUrl } from "@/features/chat/utils/chat";

export interface StreamUser {
	id: string;
	username?: string;
	name?: string;
	image: string;
	isOnline: boolean;
	isLive: boolean;
	callId: string | null;
}

interface UserSearchListProps {
	placeholder?: string;
	actionLabel: string;
	emptyMessage?: string;
	onSelectUser: (user: StreamUser) => void;
	isProcessing?: boolean;
	inlineSuccess?: string | null;
	listClassName?: string;
	showInitialList?: boolean;
	hideListInitially?: boolean;
	hideSearchBar?: boolean;
	onQueryChange?: (query: string) => void;
}

export const UserSearchList = ({
	placeholder = "Search user...",
	actionLabel,
	emptyMessage = "Search to find users",
	onSelectUser,
	isProcessing = false,
	inlineSuccess = null,
	listClassName = "max-h-60",
	showInitialList = false,
	hideListInitially = false,
	hideSearchBar = false,
	initialUsers,
	isLoadingInitial = false,
	onQueryChange,
}: UserSearchListProps & {
	initialUsers?: StreamUser[];
	isLoadingInitial?: boolean;
}) => {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<StreamUser[]>([]);
	const [searching, setSearch] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		onQueryChange?.(query);
	}, [query, onQueryChange]);

	const [hasLoadedInitial, setHasLoadedInitial] = useState(false);
	const isInitialListSupplied = initialUsers !== undefined;

	// Sync results with initialUsers if provided and no query
	useEffect(() => {
		if (!query.trim() && isInitialListSupplied) {
			setResults(initialUsers);
			setHasLoadedInitial(true);
		}
	}, [initialUsers, query, isInitialListSupplied]);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);

		if (!query.trim()) {
			if (showInitialList && !isInitialListSupplied) {
				// Only fetch if no external list provided AT ALL
				const fetchInitial = async () => {
					setSearch(true);
					try {
						const client = getStreamClient();
						const resp = await client.queryUsers(
							{
								id: { $nin: [client.userID!] },
								name: { $exists: true },
							} as any,
							{ last_active: -1 },
							{ limit: 20 },
						);
						setResults(
							resp.users.map((u) => {
								const raw = u as any;
								const username =
									u.username ||
									(u.name && !/^\d+$/.test(u.name) ? u.name : undefined);
								return {
									id: u.id,
									username,
									name: raw.fullName ?? raw.full_name ?? u.name ?? u.id,
									image: toAbsoluteUrl(raw.image ?? ""),
									isOnline: raw.online,
									isLive: raw.isLive || false,
									callId: raw.callId || null,
								};
							}),
						);
					} catch {
						setResults([]);
					} finally {
						setSearch(false);
						setHasLoadedInitial(true);
					}
				};
				fetchInitial();
			} else if (isInitialListSupplied) {
				setResults(initialUsers);
			} else {
				setResults([]);
			}
			return;
		}

		let stale = false;
		debounceRef.current = setTimeout(async () => {
			setSearch(true);
			try {
				const client = getStreamClient();

				const resp = await client.queryUsers(
					{
						name: { $autocomplete: query.trim() },
						id: { $nin: [client.userID!] },
					} as any,
					{},
					{ limit: 30 },
				);

				if (!stale) {
					setResults(
						resp.users
							.filter((u) => !u.id.startsWith("recording-egress-") && u.name)
							.map((u) => {
								const raw = u as any;
								const username =
									u.username ||
									(u.name && !/^\d+$/.test(u.name) ? u.name : undefined);
								return {
									id: u.id,
									username,
									name: raw.fullName ?? raw.full_name ?? u.name ?? u.id,
									image: toAbsoluteUrl(raw.image ?? ""),
									isOnline: raw.online,
									isLive: raw.isLive || false,
									callId: raw.callId || null,
								};
							}),
					);
				}
			} catch {
				if (!stale) setResults([]);
			} finally {
				if (!stale) setSearch(false);
			}
		}, 300);

		return () => {
			stale = true;
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query]);

	const shouldHideSearch =
		hideSearchBar ||
		(showInitialList &&
			hasLoadedInitial &&
			results.length === 0 &&
			!query.trim());

	return (
		<>
			{!shouldHideSearch && (
				<div className="flex items-center gap-2 px-4 h-11 border border-white/15 rounded-full bg-white/3 focus-within:border-white/30 transition-colors overflow-hidden shrink-0">
					<input
						autoFocus
						className="flex-1 min-w-0 bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-gray-500"
						placeholder={placeholder}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						style={{ fontSize: "16px" }}
					/>
					{searching ? (
						<Loader2 className="w-4 h-4 text-gray-500 shrink-0 animate-spin" />
					) : (
						<Search className="w-4 h-4 text-gray-500 shrink-0 ml-auto" />
					)}
				</div>
			)}

			{isLoadingInitial && results.length === 0 && (
				<div className="flex items-center justify-center py-6">
					<Loader2 className="w-5 h-5 animate-spin text-gray-500" />
				</div>
			)}

			<div
				className={`flex flex-col gap-0.5 overflow-y-auto [&::-webkit-scrollbar]:hidden ${listClassName}`}
			>
				{inlineSuccess && (
					<p className="text-center text-green-400 text-sm py-4">
						{inlineSuccess}
					</p>
				)}
				{!inlineSuccess &&
					results.length === 0 &&
					query.trim() &&
					!searching && (
						<div className="flex flex-col items-center justify-center py-10 px-4 text-center">
							<div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
								<UserSearch className="w-8 h-8 text-gray-500" />
							</div>
							<p className="text-white font-bold text-xl mb-2">
								User doesn't exist
							</p>
							<p className="text-gray-500 text-[15px] mb-8 max-w-[260px] leading-relaxed">
								We couldn't find any creator with this name.
							</p>
							<button
								onClick={() => navigate({ to: "/explore" })}
								className="px-8 py-2.5 bg-[#FF7700] text-black font-bold rounded-full active:scale-95 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
							>
								Find Creator
							</button>
						</div>
					)}
				{!inlineSuccess &&
					results.length === 0 &&
					!query.trim() &&
					!searching &&
					!hideListInitially && (
						<p className="text-center text-gray-500 text-sm py-4">
							{emptyMessage}
						</p>
					)}
				{!inlineSuccess &&
					results.map((user) => {
						const displayName = capitalizeName(getDisplayName(user));
						return (
							<button
								key={user.id}
								onClick={() => onSelectUser(user)}
								disabled={isProcessing}
								className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left disabled:opacity-60 cursor-pointer"
							>
								<UserAvatar
									src={user.image || ""}
									alt={displayName}
									isLive={user.isLive}
									callId={user.callId}
									username={user.username}
									size="md"
									clickable={true}
									showBadge={false}
								/>
								<div className="flex flex-col min-w-0">
									<span className="text-white text-sm font-semibold truncate leading-tight">
										{displayName}
									</span>
									<span className="text-[#FF7700] text-[10px] mt-0.5 font-medium">
										{actionLabel}
									</span>
								</div>
								{isProcessing && (
									<Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-auto shrink-0" />
								)}
							</button>
						);
					})}
			</div>
		</>
	);
};

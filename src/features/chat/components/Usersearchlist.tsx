import { useState, useEffect, useRef } from 'react';
import { Loader2, Search } from 'lucide-react';
import { getStreamClient } from '@/features/chat/stream/streamClient';
import { Avatar } from './Avatar';
import { getDisplayName, capitalizeName } from '@/features/chat/utils/ChatUtils';
import { toAbsoluteUrl } from '@/features/chat/utils/chat';

export interface StreamUser {
    id: string;
    name?: string;
    image?: string;
    isOnline?: boolean;
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
}

export const UserSearchList = ({
    placeholder = 'Search user...',
    actionLabel,
    emptyMessage = 'Search to find users',
    onSelectUser,
    isProcessing = false,
    inlineSuccess = null,
    listClassName = 'max-h-60',
    showInitialList = false,
    hideListInitially = false,
    hideSearchBar = false,
}: UserSearchListProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<StreamUser[]>([]);
    const [searching, setSearch] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        
        if (!query.trim()) {
            if (showInitialList) {
                const fetchInitial = async () => {
                    setSearch(true);
                    try {
                        const client = getStreamClient();
                        const resp = await client.queryUsers({ 
                            id: { $nin: [client.userID!] },
                            name: { $exists: true }
                        } as any, { last_active: -1 }, { limit: 20 });

                        setResults(resp.users
                            .filter(u => !u.id.startsWith('recording-egress-'))
                            .map(u => ({
                                id: u.id,
                                name: u.name ?? u.id,
                                image: toAbsoluteUrl((u as any).image ?? ''),
                                isOnline: (u as any).online
                            })));
                    } catch {
                        setResults([]);
                    } finally {
                        setSearch(false);
                        setHasLoadedInitial(true);
                    }
                };
                fetchInitial();
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
                        id: { $nin: [client.userID!] }
                    } as any,
                    {},
                    { limit: 30 },
                );

                if (!stale) {
                    setResults(
                        resp.users
                            .filter(u => !u.id.startsWith('recording-egress-') && u.name)
                            .map(u => ({
                                id:    u.id,
                                name:  u.name ?? u.id,
                                image: toAbsoluteUrl((u as any).image ?? ''),
                                isOnline: (u as any).online
                            })),
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

    const shouldHideSearch = hideSearchBar || (showInitialList && hasLoadedInitial && results.length === 0 && !query.trim());

    return (
        <>
            {!shouldHideSearch && (
                <div className="flex items-center gap-2 px-4 h-11 border border-white/15 rounded-full bg-white/3 focus-within:border-white/30 transition-colors">
                    <input
                        autoFocus
                        className="flex-1 bg-transparent border-none text-sm text-white focus:outline-none placeholder:text-gray-500"
                        placeholder={placeholder}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        style={{ fontSize: '16px' }}
                    />
                    {searching
                        ? <Loader2 className="w-4 h-4 text-gray-500 shrink-0 animate-spin" />
                        : <Search className="w-4 h-4 text-gray-500 shrink-0" />
                    }
                </div>
            )}

            <div className={`flex flex-col gap-0.5 overflow-y-auto [&::-webkit-scrollbar]:hidden ${listClassName}`}>
                {inlineSuccess && (
                    <p className="text-center text-green-400 text-sm py-4">{inlineSuccess}</p>
                )}
                {!inlineSuccess && results.length === 0 && query.trim() && !searching && (
                    <p className="text-center text-gray-500 text-sm py-4">No users found</p>
                )}
                {!inlineSuccess && results.length === 0 && !query.trim() && !searching && !hideListInitially && (
                    <p className="text-center text-gray-500 text-sm py-4">{emptyMessage}</p>
                )}
                {!inlineSuccess && results.map(user => {
                    const displayName = capitalizeName(getDisplayName(user));
                    return (
                        <button
                            key={user.id}
                            onClick={() => onSelectUser(user)}
                            disabled={isProcessing}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-left disabled:opacity-60 cursor-pointer"
                        >
                            <Avatar src={user.image || ''} alt={displayName} className="w-10 h-10" />
                            <div className="flex flex-col min-w-0">
                                <span className="text-white text-sm font-semibold truncate leading-tight">{displayName}</span>
                                <span className="text-gray-500 text-[10px] mt-0.5 font-medium">{actionLabel}</span>
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
import React from 'react';
import { Loader2, WifiOff, SquarePen, X, Pin, Trash2, ChevronLeft, BellOff, Bell, SquareArrowDown, SquareArrowUp, Plus, UserSearch, Flag } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Conversation, MessageStatus } from '../types/chat.types';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useTranslationPreference } from '../hooks/useTranslationPreference';
import { PINNED_STORAGE_KEY } from '@/features/chat/utils/chatConstants';
import { Avatar } from '@/features/chat/components/Avatar';
import { UserSearchList, type StreamUser } from '@/features/chat/components/Usersearchlist';
import { useFollowers } from '@/features/profile/services/profile.service';
import { useAuthStore } from '@/features/auth/stores/authStore';
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { capitalizeName, getDisplayName, formatRelativeTime } from '@/features/chat/utils/ChatUtils';
import { toAbsoluteUrl } from '@/features/chat/utils/chat';
import { chatService } from '../services/chat.service';
import { useIsMobile } from '@/hooks/use-mobile';
import chatGroup from '@/assets/chatGroup.svg';
import SearchIcon from '@/assets/Search.svg';
import { getStreamClient } from '../stream/streamClient';
import { useSubmitReport } from '@/features/report/services/report.service';
import { ReportChatModal } from '@/components/internal/ReasonModal';

// TickIcon

export const TickIcon = ({ status }: { status?: MessageStatus }) => {
    if (status === 'pending') return (
        <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
    if (status === 'sent') return (
        <svg className="w-3.5 h-3.5 text-white/40 shrink-0" viewBox="0 0 16 10" fill="none">
            <path d="M1 5l4 4L15 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    if (status === 'delivered') return (
        <svg className="w-4 h-3.5 text-white/40 shrink-0" viewBox="0 0 20 10" fill="none">
            <path d="M1 5l4 4L15 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 5l4 4L20 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    if (status === 'read') return (
        <svg className="w-4 h-3.5 text-blue-500 shrink-0" viewBox="0 0 20 10" fill="none">
            <path d="M1 5l4 4L15 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6 5l4 4L20 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
    return null;
};

// relative time ticker

const useRelativeTicker = () => {
    const [, setTick] = React.useState(0);
    React.useEffect(() => {
        const id = setInterval(() => setTick(n => n + 1), 30_000);
        return () => clearInterval(id);
    }, []);
};

// pinned helpers

const getPinned = (): string[] => {
    try { return JSON.parse(sessionStorage.getItem(PINNED_STORAGE_KEY) ?? '[]'); } catch { return []; }
};
const setPinned = (ids: string[]) => sessionStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(ids));

const NewChatModal = ({
    onClose, onStartChat, isStarting, conversations, isMobile, userId
}: {
    onClose: () => void;
    onStartChat: (user: StreamUser) => void;
    isStarting: boolean;
    conversations: Conversation[];
    isMobile: boolean;
    userId: number;
}) => {
    const { data: followersData, isLoading: isLoadingFollowers } = useFollowers(userId);
    const followers = followersData?.pages.flatMap(p => p.data) || [];
    const isLoading = isLoadingFollowers;

    const uniqueRecent = conversations
        .map(c => c.participant)
        .filter((p, i, self) => self.findIndex(s => s.id === p.id) === i)
        .slice(0, 10);

    const content = (
        <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar space-y-6">
            {/* Search Bar */}
            <div className="px-6 pt-2">
                <UserSearchList
                    placeholder="Search Creator Name Here..."
                    actionLabel="Tap to Chat"
                    emptyMessage="Type a name to search"
                    onSelectUser={onStartChat}
                    isProcessing={isStarting}
                    hideListInitially={true}
                />
            </div>

            {/* Recently Contacted */}
            {uniqueRecent.length > 0 && (
                <div className="px-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3 ml-1">Recently Contacted</h3>
                    <div className="bg-white/5 rounded-[32px] overflow-hidden p-2">
                        {uniqueRecent.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => onStartChat({
                                    id: p.id,
                                    name: p.name,
                                    image: p.avatar,
                                    isOnline: p.isOnline || false,
                                    isLive: false,
                                    callId: null
                                })}
                                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-all text-left group cursor-pointer"
                            >
                                <div className="relative shrink-0">
                                    <Avatar src={p.avatar} alt={p.name} className="w-12 h-12" />
                                    {p.isOnline && (
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1b1c]" />
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-white text-[15px] font-bold truncate">
                                        {capitalizeName(p.name)}
                                    </span>
                                    <span className="text-gray-500 text-[12px] truncate mt-0.5">
                                        Tap to continue your conversation...
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* All Followers */}
            <div className="px-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3 ml-1">All Followers</h3>
                <div className="bg-white/5 rounded-[32px] overflow-hidden p-2 min-h-[100px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-[#FF7700]" />
                        </div>
                    ) : followers.length > 0 ? (
                        <div className="flex flex-col">
                            {followers.map((f: any) => {
                                const fId = f.userId || f.id;
                                return (
                                    <button
                                        key={fId}
                                        onClick={() => onStartChat({
                                            id: String(fId),
                                            name: f.username,
                                            image: f.profileImage || '',
                                            isOnline: false,
                                            isLive: f.isLive || false,
                                            callId: f.callId || null
                                        })}
                                        disabled={isStarting}
                                        className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-all text-left disabled:opacity-60 cursor-pointer group"
                                    >
                                        <Avatar src={f.profileImage || ''} alt={f.username} className="w-12 h-12" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-white text-[15px] font-bold truncate">
                                            {capitalizeName(f.username)}
                                        </span>
                                        <span className="text-[#FF7700] text-[11px] font-bold mt-0.5 uppercase tracking-wide">
                                            Tap to Chat
                                        </span>
                                    </div>
                                    {isStarting && (
                                        <Loader2 className="w-4 h-4 animate-spin text-gray-400 ml-auto shrink-0" />
                                    )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                            <p className="text-gray-500 text-sm">No followers found yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <Drawer open onOpenChange={onClose}>
                <DrawerContent
                    className="bg-[#111213] border-none text-white h-[85vh] pb-8 overflow-hidden flex flex-col"
                    style={{ background: 'linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), rgba(18, 18, 18, 0.9)' }}
                >
                    <div className="mx-auto mt-2 h-1 w-12 shrink-0 rounded-full bg-white/20" />
                    <DrawerHeader className="pb-1">
                        <DrawerTitle className="text-center text-lg font-bold text-white">New Chat</DrawerTitle>
                    </DrawerHeader>
                    {content}
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent
                className="bg-[#111213] border-white/10 text-white max-w-lg p-0 overflow-hidden flex flex-col h-[600px]"
                style={{ background: 'linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), rgba(18, 18, 18, 0.9)' }}
            >
                <DialogHeader className="p-6 pb-2 border-b border-white/5">
                    <DialogTitle className="text-xl font-bold text-white">New Chat</DialogTitle>
                </DialogHeader>
                {content}
            </DialogContent>
        </Dialog>
    );
};

// ConfirmDeleteModal

const ConfirmDeleteModal = ({
    name, onConfirm, onCancel, isDeleting,
}: {
    name: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDeleting: boolean;
}) => (

    <div
        onClick={onCancel}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-300 cursor-default"
    >
        <div
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-[400px] rounded-[32px] shadow-2xl overflow-hidden p-10 flex flex-col items-center text-center backdrop-blur-[354px]"
            style={{
                background: 'linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), rgba(18, 18, 18, 0.9)'
            }}
        >
            <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Delete Conversation?</h3>
            <p className="text-gray-400 text-sm mb-10 leading-relaxed max-w-[280px]">
                Are you sure you want to delete your conversation with{' '}
                <span className="text-white font-bold">{capitalizeName(name)}</span>. This cannot be undone.
            </p>

            <div className="flex items-center gap-4 w-full justify-center">
                <button
                    onClick={onConfirm}
                    disabled={isDeleting}
                    className="flex-1 h-14 rounded-full bg-[#FF7700] text-black font-extrabold text-base hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
                >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Delete
                </button>
                <button
                    onClick={onCancel}
                    disabled={isDeleting}
                    className="flex-1 h-14 rounded-full border-2 border-[#FF7700] text-[#FF7700] font-extrabold text-base hover:bg-[#FF7700]/5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer bg-transparent"
                >
                    Cancel
                </button>
            </div>
        </div>
    </div>
);


// ConversationDropdown

const ConversationDropdown = ({
    isPinned, isMuted, isArchived,
    onPin, onDelete, onMuteToggle, onArchiveToggle, onReport, onClose,
}: {
    isPinned: boolean;
    isMuted: boolean;
    isArchived: boolean;
    onPin: () => void;
    onDelete: () => void;
    onMuteToggle: () => void;
    onArchiveToggle: () => void;
    onReport: () => void;
    onClose: () => void;
}) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        const h = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        const t = setTimeout(() => document.addEventListener('mousedown', h), 80);
        return () => { clearTimeout(t); document.removeEventListener('mousedown', h); };
    }, [onClose]);

    return (
        <div ref={ref} className="absolute top-full left-2 mt-0.5 z-50 w-60 bg-[#1e2029] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
            <button
                onClick={e => { e.stopPropagation(); onPin(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/8 transition-colors cursor-pointer group"
            >
                <Pin className={cn("w-3.5 h-3.5 shrink-0 group-hover:text-white transition-colors", isPinned ? "text-[#FF7700]" : "text-gray-400")} />
                {isPinned ? 'Unpin' : 'Pin Chat'}
            </button>
            <button
                onClick={e => { e.stopPropagation(); onMuteToggle(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/8 transition-colors cursor-pointer"
            >
                {isMuted ? <Bell className="w-3.5 h-3.5 shrink-0 text-gray-400" /> : <BellOff className="w-3.5 h-3.5 shrink-0 text-gray-400" />}
                {isMuted ? 'Unmute' : 'Mute'}
            </button>
            <button
                onClick={e => { e.stopPropagation(); onArchiveToggle(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/8 transition-colors cursor-pointer group"
            >
                {isArchived ? (
                    <SquareArrowUp className="w-3.5 h-3.5 shrink-0 text-gray-400 group-hover:text-white transition-colors" />
                ) : (
                    <SquareArrowDown className="w-3.5 h-3.5 shrink-0 text-gray-400 group-hover:text-white transition-colors" />
                )}
                {isArchived ? 'Unarchive Chat' : 'Archive Chat'}
            </button>
            <button
                onClick={e => { e.stopPropagation(); onReport(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/8 transition-colors cursor-pointer"
            >
                <Flag className="w-3.5 h-3.5 shrink-0 text-gray-400" /> Report Chat
            </button>
            <div className="h-px bg-white/8 my-1" />
            <button
                onClick={e => { e.stopPropagation(); onDelete(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
                <Trash2 className="w-3.5 h-3.5 shrink-0" /> Delete Chat
            </button>
        </div>
    );
};

// ChatListItem

const ChatListItem = ({
    conversation, isSelected, isPinned, myId, translateEnabled, isMobile,
    onClick, onDeleteRequest, onPinToggle, onMuteToggle, onArchiveToggle, onReport, onSelectionToggle,
}: {
    conversation: Conversation;
    isSelected: boolean;
    isPinned: boolean;
    myId: string;
    translateEnabled: boolean;
    isMobile: boolean;
    onClick: () => void;
    onDeleteRequest: (c: Conversation) => void;
    onPinToggle: (c: Conversation) => void;
    onMuteToggle: (c: Conversation) => void;
    onArchiveToggle: (c: Conversation) => void;
    onReport: (c: Conversation) => void;
    onSelectionToggle: (id: string) => void;
}) => {
    const [open, setOpen] = React.useState(false);

    const isMine = conversation.lastMessageSenderId === myId;
    const preview = isMine
        ? (conversation.lastMessageOriginal || conversation.lastMessage)
        : (translateEnabled
            ? conversation.lastMessage
            : (conversation.lastMessageOriginal || conversation.lastMessage));

    return (
        <div
            className="relative"
            onDoubleClick={e => {
                e.preventDefault();
                if (isMobile) onSelectionToggle(conversation.id);
                else setOpen(v => !v);
            }}
            onContextMenu={e => {
                e.preventDefault();
                if (isMobile) onSelectionToggle(conversation.id);
                else setOpen(v => !v);
            }}
        >
            <button
                onClick={onClick}
                className={cn(
                    'w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left group cursor-pointer',
                    isSelected ? 'bg-white/5' : 'hover:bg-white/5',
                )}
            >
                <div className="relative shrink-0">
                    <Avatar
                        src={conversation.participant.avatar}
                        alt={capitalizeName(conversation.participant.name)}
                        className="w-[52px] h-[52px] sm:w-[56px] sm:h-[56px]"
                    />
                    {conversation.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-[#111213]" />
                    )}
                </div>
                <div className="flex-1 min-w-0 ml-1">
                    <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-white text-[16px] font-bold truncate">
                            {capitalizeName(conversation.participant.name)}
                        </span>
                        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-auto">
                            <span className="text-[10px] text-gray-500 font-medium">
                                {formatRelativeTime(conversation.lastMessageTime)}
                            </span>
                            <div className="flex items-center gap-1.5">
                                {(isPinned || conversation.isMuted) && (
                                    <div className="flex items-center gap-1.5 ">
                                        {conversation.isMuted && <BellOff className="w-3 h-3 text-gray-500" />}
                                        {isPinned && <Pin className="w-3 h-3 text-[#FF7700]" />}
                                    </div>
                                )}
                                {conversation.unreadCount > 0 && (
                                    <span className="shrink-0 w-4.5 h-4.5 rounded-full bg-[#FF7700] flex items-center justify-center text-[10px] font-black text-black">
                                        {conversation.unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                        {conversation.lastMessageStatus && (
                            <TickIcon status={conversation.lastMessageStatus} />
                        )}
                        <span className={cn(
                            'text-xs truncate font-medium',
                            conversation.lastMessageStatus === 'pending' ? 'text-yellow-400/70' : 'text-gray-400',
                            conversation.isGiftMessage && 'animate-bounce !text-[#FF7700] font-medium'
                        )}>
                            {preview}
                        </span>
                    </div>
                </div>
            </button>

            {open && (
                <ConversationDropdown
                    isPinned={isPinned}
                    isMuted={!!conversation.isMuted}
                    isArchived={!!conversation.isArchived}
                    onPin={() => onPinToggle(conversation)}
                    onMuteToggle={() => onMuteToggle(conversation)}
                    onArchiveToggle={() => onArchiveToggle(conversation)}
                    onReport={() => onReport(conversation)}
                    onDelete={() => { onDeleteRequest(conversation); setOpen(false); }}
                    onClose={() => setOpen(false)}
                />
            )}
        </div>
    );
};

// ChatSidebar
interface ChatSidebarProps {
    conversations: Conversation[];
    isLoading: boolean;
    activeConversationId: string | null;
    onReloadChannels: () => Promise<void>;
    onStartDirectChat: (targetUserId: number, targetName?: string, targetAvatar?: string) => Promise<Conversation>;
    onSelect: (conversation: Conversation) => void;
    onClose?: () => void;
    onConversationDeleted?: (conversationId: string) => void;
    onArchive: (id: string) => void;
    onUnarchive: (id: string) => void;
    onMute: (id: string) => void;
    onUnmute: (id: string) => void;
    className?: string;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    conversations, isLoading, activeConversationId,
    onStartDirectChat,
    onArchive, onUnarchive, onMute, onUnmute,
    onSelect, onClose, onConversationDeleted, className,
}) => {
    const { user } = useAuthStore();
    const myId = String(user?.id ?? '');
    const isOnline = useOnlineStatus();
    useRelativeTicker();

    const [view, setView] = React.useState<'normal' | 'archived'>('normal');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [showNewChat, setShowNewChat] = React.useState(false);
    const [confirmDelete, setConfirmDelete] = React.useState<Conversation | null>(null);
    const [confirmDeleteMultiple, setConfirmDeleteMultiple] = React.useState<boolean>(false);
    const [pendingDeleteIds, setPendingDeleteIds] = React.useState<string[]>([]);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [isStarting, setIsStarting] = React.useState(false);
    const [pinnedIds, setPinnedIds] = React.useState<string[]>(getPinned);
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [reportConversation, setReportConversation] = React.useState<Conversation | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const isMobile = useIsMobile();
    const navigate = useNavigate();
    const { translateEnabled } = useTranslationPreference(myId);
    const { mutate: submitReport, isPending: isReportPending } = useSubmitReport();


    React.useEffect(() => {
        if (selectedIds.length === 0) return;
        const h = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setSelectedIds([]);
            }
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [selectedIds]);

    React.useEffect(() => {
        const handleOpenNewChat = () => setShowNewChat(true);
        window.addEventListener('open-new-chat', handleOpenNewChat);
        return () => window.removeEventListener('open-new-chat', handleOpenNewChat);
    }, []);


    const handlePin = (conv: Conversation) => {
        const alreadyPinned = pinnedIds.includes(conv.id);
        const next = alreadyPinned ? pinnedIds.filter(id => id !== conv.id) : [...pinnedIds, conv.id];
        setPinnedIds(next);
        setPinned(next);
        toast.success(alreadyPinned ? 'Conversation unpinned' : 'Conversation pinned');
    };

    const handlePinMultiple = () => {
        const allPinned = selectedIds.every(id => pinnedIds.includes(id));
        const next = allPinned
            ? pinnedIds.filter(id => !selectedIds.includes(id))
            : [...new Set([...pinnedIds, ...selectedIds])];
        setPinnedIds(next);
        setPinned(next);
        toast.success(allPinned ? `${selectedIds.length} conversations unpinned` : `${selectedIds.length} conversations pinned`);
        setSelectedIds([]);
    };

    const handleMuteToggle = (conv: Conversation) => {
        if (conv.isMuted) onUnmute(conv.id);
        else onMute(conv.id);
        toast.success(conv.isMuted ? 'Chat unmuted' : 'Chat muted');
    };

    const handleArchiveToggle = (conv: Conversation) => {
        if (conv.isArchived) onUnarchive(conv.id);
        else onArchive(conv.id);
        toast.success(conv.isArchived ? 'Chat unarchived' : 'Chat archived');
    };

    const handleArchiveMultiple = () => {
        const allArchived = selectedIds.every(id => {
            const conv = conversations.find(c => c.id === id);
            return conv?.isArchived;
        });
        selectedIds.forEach(id => {
            if (allArchived) onUnarchive(id);
            else onArchive(id);
        });
        toast.success(allArchived ? `${selectedIds.length} conversations unarchived` : `${selectedIds.length} conversations archived`);
        setSelectedIds([]);
    };

    const handleDeleteMultipleConfirmed = async () => {
        const idsToDelete = pendingDeleteIds;
        setIsDeleting(true);
        try {
            await Promise.all(idsToDelete.map(id => chatService.hideOrDeleteConversation(id)));
            idsToDelete.forEach(id => onConversationDeleted?.(id));
            setConfirmDeleteMultiple(false);
            setPendingDeleteIds([]);
            toast.success(`${idsToDelete.length} conversations deleted`);
        } catch (e) {
            console.error('[ChatSidebar] Bulk delete failed:', e);
            toast.error('Failed to delete conversations');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteConfirmed = async (conv: Conversation) => {
        setIsDeleting(true);
        try {
            await chatService.hideOrDeleteConversation(conv.id);
            onConversationDeleted?.(conv.id);
            setConfirmDelete(null);
            toast.success('Chat deleted');
        } catch (e) {
            console.error('[ChatSidebar] Delete failed:', e);
            toast.error('Failed to delete chat');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleStartChat = async (streamUser: StreamUser) => {
        const targetId = parseInt(streamUser.id, 10);
        if (isNaN(targetId)) return;
        const displayName = capitalizeName(getDisplayName(streamUser));
        const avatar = toAbsoluteUrl((streamUser as any).image || '');

        // Close modal immediately for a better UX
        setShowNewChat(false);
        setIsStarting(true);
        try {
            const conversation = await onStartDirectChat(targetId, displayName, avatar);
            onSelect(conversation);
        } catch {
            toast.error('Failed to start chat');
        } finally {
            setIsStarting(false);
        }
    };

    const handleReportConfirm = async (reasonId: string, otherText?: string) => {
        if (!reportConversation) return;

        let lastMessages: { sender: string; text: string; sent_at: string }[] = [];

        try {
            // Fetch the channel and get the latest 20 messages
            const client = getStreamClient();
            const [type, id] = reportConversation.id.split(':');
            const channel = client.channel(type, id);
            await channel.watch();

            const channelMsgs = channel.state.messages;
            // Get at most the latest 20 messages
            const recentMessages = channelMsgs.slice(-20);

            lastMessages = recentMessages.map(m => ({
                sender: m.user?.id || m.user_id || '',
                text: m.text || '',
                sent_at: (m.created_at ? new Date(m.created_at).toISOString() : new Date().toISOString()),
            }));
        } catch (err) {
            console.error('[ChatSidebar] Failed to fetch recent messages for report:', err);
            // Proceed with empty last_messages — metadata is optional
        }

        submitReport(
            {
                reportedUserId: reportConversation.participant.id,
                contentType: 'CHAT_MESSAGE',
                contentId: reportConversation.id,
                reason: reasonId,
                note: otherText,
                contextMetadata: {
                    last_messages: lastMessages,
                },
            },
            {
                onSuccess: () => {
                    toast.success('Conversation reported successfully');
                    setReportConversation(null);
                },
                onError: () => {
                    toast.error('Failed to submit report');
                },
            }
        );
    };

    const handleSelectionToggle = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const archivedList = conversations.filter(c => c.isArchived);
    const normalList = conversations.filter(c => !c.isArchived);

    const currentList = view === 'archived' ? archivedList : normalList;

    const filtered = currentList
        .filter(c => {
            const matchesSearch =
                c.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.participant.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (c.participant.fullName || '').toLowerCase().includes(searchQuery.toLowerCase());

            if (searchQuery.trim()) return matchesSearch;

            if (c.id === activeConversationId) return true;
            if (!c.lastMessage && !c.lastMessageOriginal) return false;
            return true;
        })
        .sort((a, b) => {
            const aPin = pinnedIds.includes(a.id) ? 0 : 1;
            const bPin = pinnedIds.includes(b.id) ? 0 : 1;
            if (aPin !== bPin) return aPin - bPin;

            const aUnread = a.unreadCount > 0 ? 0 : 1;
            const bUnread = b.unreadCount > 0 ? 0 : 1;
            if (aUnread !== bUnread) return aUnread - bUnread;

            return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

    const selectedConversations = selectedIds
        .map(id => conversations.find(c => c.id === id))
        .filter((c): c is Conversation => !!c);

    return (
        <>
            <div ref={containerRef} className={cn('flex flex-col h-full overflow-hidden', className)}>

                {/* Header */}
                <div className="shrink-0 flex flex-col gap-3">
                    {selectedIds.length > 0 ? (
                        <div className="relative flex items-center justify-between py-1 px-1">
                            <button
                                onClick={() => setSelectedIds([])}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-white hover:bg-white/8 transition-colors cursor-pointer"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-5">
                                {/* Mute — only when exactly 1 selected */}
                                {selectedIds.length === 1 && (
                                    <button
                                        onClick={() => {
                                            const conv = selectedConversations[0];
                                            if (conv) {
                                                handleMuteToggle(conv);
                                                setSelectedIds([]);
                                            }
                                        }}
                                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                                        title={selectedConversations[0]?.isMuted ? "Unmute" : "Mute"}
                                    >
                                        {selectedConversations[0]?.isMuted ? (
                                            <Bell className="w-4.5 h-4.5" />
                                        ) : (
                                            <BellOff className="w-4.5 h-4.5" />
                                        )}
                                    </button>
                                )}
                                {/* Pin — always visible for any selection */}
                                <button
                                    onClick={handlePinMultiple}
                                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    title="Pin/Unpin"
                                >
                                    <Pin className="w-4.5 h-4.5" />
                                </button>
                                {/* Archive — always visible for any selection */}
                                <button
                                    onClick={handleArchiveMultiple}
                                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                                    title="Archive/Unarchive"
                                >
                                    <SquareArrowDown className="w-4.5 h-4.5" />
                                </button>
                                {/* Report — only when exactly 1 selected */}
                                {selectedIds.length === 1 && (
                                    <button
                                        onClick={() => {
                                            const conv = selectedConversations[0];
                                            if (conv) {
                                                setReportConversation(conv);
                                                setSelectedIds([]);
                                            }
                                        }}
                                        className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                                        title="Report"
                                    >
                                        <Flag className="w-4.5 h-4.5" />
                                    </button>
                                )}
                                {/* Delete — always visible for any selection */}
                                <button
                                    onClick={() => {
                                        if (selectedIds.length === 1) {
                                            const conv = selectedConversations[0];
                                            if (conv) {
                                                setConfirmDelete(conv);
                                                setSelectedIds([]);
                                            }
                                        } else {
                                            setPendingDeleteIds(selectedIds);
                                            setSelectedIds([]);
                                            setConfirmDeleteMultiple(true);
                                        }
                                    }}
                                    className="text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4.5 h-4.5" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="relative flex md:flex items-center justify-between py-1 hidden md:flex">
                            <div className="flex items-center gap-2">
                                {view === 'archived' && (
                                    <button
                                        onClick={() => setView('normal')}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                )}
                                <h2 className="text-white text-sm sm:text-base font-semibold tracking-wide">
                                    {view === 'archived' ? 'Archived Chats' : 'Chats'}
                                </h2>
                            </div>

                            <div className="flex items-center gap-1">
                                {view === 'normal' && (
                                    <button
                                        onClick={() => setShowNewChat(true)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                                        title="New Chat"
                                    >
                                        <SquarePen className="w-4 h-4" />
                                    </button>
                                )}
                                {onClose && (
                                    <button
                                        onClick={onClose}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="h-px w-full bg-white/8 hidden md:block" />

                    {view === 'normal' && archivedList.length > 0 && (
                        <button
                            onClick={() => setView('archived')}
                            className="w-full h-15 flex items-center gap-4 px-5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-left cursor-pointer"
                        >
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                                <SquareArrowDown className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex-1 flex items-center justify-between min-w-0">
                                <span className="text-white text-sm font-semibold">Archive Chats</span>
                                <span className="w-5 h-5 rounded-full bg-[#FF7700] flex items-center justify-center text-[10px] font-bold text-black border border-black/10">
                                    {archivedList.length}
                                </span>
                            </div>
                        </button>
                    )}

                    {!isOnline && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                            <WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="text-red-400 text-xs">No internet connection</span>
                        </div>
                    )}

                    {view === 'normal' && (
                        <div className="flex items-center gap-2 px-4 h-15 border border-white/10 rounded-2xl bg-white/5 focus-within:border-white/20 transition-all overflow-hidden shrink-0 mt-2 md:mt-0 md:h-12 md:rounded-full">
                            <input
                                className="flex-1 min-w-0 bg-transparent border-none text-[15px] text-white focus:outline-none placeholder:text-gray-500 outline-none"
                                placeholder="Search Creator Here..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-white/5 md:bg-transparent">
                                <img src={SearchIcon} className="w-[18px] h-[18px] shrink-0 opacity-60" alt="Search" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="chat-list-container relative flex-1 min-h-0 overflow-y-auto mt-3 [&::-webkit-scrollbar]:hidden">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-5 h-5 animate-spin text-[#FF7700]" />
                        </div>
                    ) : (
                        <>
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                    {searchQuery.trim() ? (
                                        <>
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                                <UserSearch className="w-8 h-8 text-gray-500" />
                                            </div>
                                            <p className="text-white font-bold text-xl mb-2">User doesn't exist</p>
                                            <p className="text-gray-500 text-[15px] mb-8 max-w-[260px] leading-relaxed">We couldn't find any creator with this name.</p>
                                            <button
                                                onClick={() => setShowNewChat(true)}
                                                className="px-8 py-2.5 bg-[#FF7700] text-black font-bold rounded-full active:scale-95 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
                                            >
                                                Find Creator
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <img src={chatGroup} alt="No chats" className="w-14 h-14 object-contain opacity-80 mb-6" />
                                            <div className="flex flex-col gap-2 mb-8">
                                                <p className="text-white font-bold text-2xl">
                                                    {view === 'archived' ? 'No Archived Chats' : 'No Chat History'}
                                                </p>
                                                <p className="text-gray-500 text-[15px] leading-relaxed max-w-[280px]">
                                                    {view === 'archived'
                                                        ? 'You haven\'t archived any conversations yet.'
                                                        : 'You haven\'t started any conversations yet. Find a creator to chat with!'}
                                                </p>
                                            </div>
                                            {view === 'normal' && (
                                                <button
                                                    onClick={() => setShowNewChat(true)}
                                                    className="px-6 py-2.5 bg-[#FF7700] hover:bg-[#ff9922] text-black text-sm font-bold rounded-full transition-all active:scale-95 cursor-pointer shadow-lg shadow-orange-500/20"
                                                >
                                                    Find Creator to Chat
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                filtered.map(conv => (
                                    <ChatListItem
                                        key={conv.id}
                                        conversation={conv}
                                        isSelected={selectedIds.includes(conv.id)}
                                        isPinned={pinnedIds.includes(conv.id)}
                                        myId={myId}
                                        translateEnabled={translateEnabled}
                                        isMobile={isMobile}
                                        onClick={() => {
                                            if (selectedIds.length > 0) {
                                                handleSelectionToggle(conv.id);
                                                return;
                                            }
                                            onSelect(conv);
                                        }}
                                        onDeleteRequest={c => setConfirmDelete(c)}
                                        onReport={c => setReportConversation(c)}
                                        onPinToggle={c => handlePin(c)}
                                        onMuteToggle={c => handleMuteToggle(c)}
                                        onArchiveToggle={c => handleArchiveToggle(c)}
                                        onSelectionToggle={handleSelectionToggle}
                                    />
                                ))
                            )}
                        </>
                    )}
                </div>
            </div>

            {showNewChat && (
                <NewChatModal
                    onClose={() => setShowNewChat(false)}
                    onStartChat={handleStartChat}
                    isStarting={isStarting}
                    conversations={conversations}
                    isMobile={isMobile}
                    userId={Number(myId)}
                />
            )}
            {confirmDelete && (
                <ConfirmDeleteModal
                    name={confirmDelete.participant.name}
                    onConfirm={() => handleDeleteConfirmed(confirmDelete)}
                    onCancel={() => setConfirmDelete(null)}
                    isDeleting={isDeleting}
                />
            )}
            {confirmDeleteMultiple && (
                <div
                    onClick={() => { setConfirmDeleteMultiple(false); setPendingDeleteIds([]); }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4 animate-in fade-in duration-300 cursor-default"
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="relative w-full max-w-[400px] rounded-[32px] shadow-2xl overflow-hidden p-10 flex flex-col items-center text-center backdrop-blur-[354px]"
                        style={{
                            background: 'linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), rgba(18, 18, 18, 0.9)'
                        }}
                    >
                        <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Delete Conversations?</h3>
                        <p className="text-gray-400 text-sm mb-10 leading-relaxed max-w-[280px]">
                            Are you sure you want to delete {pendingDeleteIds.length} conversations? This cannot be undone.
                        </p>

                        <div className="flex items-center gap-4 w-full justify-center">
                            <button
                                onClick={handleDeleteMultipleConfirmed}
                                disabled={isDeleting}
                                className="flex-1 h-14 rounded-full bg-[#FF7700] text-black font-extrabold text-base hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/20"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Delete
                            </button>
                            <button
                                onClick={() => { setConfirmDeleteMultiple(false); setPendingDeleteIds([]); }}
                                disabled={isDeleting}
                                className="flex-1 h-14 rounded-full border-2 border-[#FF7700] text-[#FF7700] font-extrabold text-base hover:bg-[#FF7700]/5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer bg-transparent"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {reportConversation && (
                <ReportChatModal
                    isOpen={!!reportConversation}
                    username={reportConversation.participant.name}
                    isLoading={isReportPending}
                    onCancel={() => setReportConversation(null)}
                    onConfirm={handleReportConfirm}
                />
            )}

        </>
    );
};
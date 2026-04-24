import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search, X, Loader2, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  useFollowers,
  useFollowing,
  useSearchCreators,
  useToggleFollow,
  useBlockUser,
} from '../services/profile.service';
import type { FollowUser } from '../services/profile.types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { ConfirmModal, BlockUserModal } from '@/components/internal/ConfirmModal';

interface FollowersFollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'followers' | 'following';
  userId?: number;
}

export const FollowersFollowingModal = ({
  isOpen,
  onClose,
  type,
  userId,
}: FollowersFollowingModalProps) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmRemove, setConfirmRemove] = useState<FollowUser | null>(null);
  const [confirmUnfollow, setConfirmUnfollow] = useState<FollowUser | null>(null);

  // Reset states when modal closes to prevent "sticky" confirmations or old search
  useEffect(() => {
    if (!isOpen) {
      setConfirmRemove(null);
      setConfirmUnfollow(null);
      setSearchQuery('');
    }
  }, [isOpen]);

  // Fetch data base on type
  const {
    data: followersData,
    isLoading: isLoadingFollowers,
    fetchNextPage: fetchNextFollowers,
    hasNextPage: hasMoreFollowers
  } = useFollowers(userId);

  const {
    data: followingData,
    isLoading: isLoadingFollowing,
    fetchNextPage: fetchNextFollowing,
    hasNextPage: hasMoreFollowing
  } = useFollowing(userId);

  const { data: searchResults, isLoading: isSearching } = useSearchCreators(searchQuery);

  const { mutate: toggleFollow } = useToggleFollow();
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();

  const currentList = useMemo(() => {
    if (searchQuery) return searchResults || [];
    const data = type === 'followers' ? followersData : followingData;
    const users = data?.pages.flatMap((page) => page.data) || [];

    if (type === 'following') {
      return users.map(u => ({ ...u, isFollowing: u.isFollowing ?? true }));
    }
    return users;
  }, [searchQuery, searchResults, type, followersData, followingData]);

  const isLoading = searchQuery ? isSearching : (type === 'followers' ? isLoadingFollowers : isLoadingFollowing);

  const handleToggleFollow = (user: FollowUser) => {
    if (user.isFollowing) {
      setConfirmUnfollow(user);
    } else {
      toggleFollow({ targetUserId: user.userId, followedByMe: false });
    }
  };

  const handleConfirmUnfollow = () => {
    if (!confirmUnfollow) return;
    toggleFollow(
      { targetUserId: confirmUnfollow.userId, followedByMe: true },
      {
        onSuccess: () => {
          setConfirmUnfollow(null);
          toast.success(`Unfollowed @${confirmUnfollow.username}`);
        }
      }
    );
  };

  const handleConfirmBlock = () => {
    if (!confirmRemove) return;
    blockUser(
      { targetUserId: confirmRemove.userId, blockedByMe: false },
      {
        onSuccess: () => {
          setConfirmRemove(null);
          toast.success(`User @${confirmRemove.username} blocked and removed`);
        },
        onError: () => toast.error('Failed to block user'),
      }
    );
  };

  const handleUserClick = (targetUsername: string) => {
    if (targetUsername && !/^\d+$/.test(targetUsername)) {
      onClose();
      navigate({ to: `/profile/${targetUsername}` as any });
    }
  };

  const ModalWrapper = isMobile ? Drawer : Dialog;
  const ContentWrapper = isMobile ? DrawerContent : DialogContent;
  const HeaderWrapper = isMobile ? DrawerHeader : DialogHeader;
  const TitleWrapper = isMobile ? DrawerTitle : DialogTitle;

  const content = (
    <>
      <HeaderWrapper className={cn(
        "flex flex-row items-center justify-between border-b border-zinc-800/30",
        isMobile ? "p-6 pb-4" : "p-8 pb-4"
      )}>
        <TitleWrapper className="text-2xl font-bold text-white capitalize tracking-tight text-left">
          {type}
        </TitleWrapper>
        {!isMobile && (
          <button
            onClick={onClose}
            className="w-7 h-7 bg-[#FF0000] rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4 text-white stroke-[3px]" />
          </button>
        )}
      </HeaderWrapper>

      <div className={cn("px-8 py-4", isMobile && "px-6")}>
        <div className="relative flex items-center bg-[#1D1F20] rounded-2xl px-5 py-4 border border-zinc-800 focus-within:border-[#FF7700]/50 transition-all group shadow-inner">
          <Search className="w-5 h-5 text-gray-500 mr-3 group-focus-within:text-[#FF7700] transition-colors" />
          <input
            className="bg-transparent border-none text-base text-white focus:outline-none placeholder:text-gray-500 w-full font-medium"
            placeholder={`Search ${type === 'followers' ? 'Followers' : 'Following'} Here...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className={cn(
        "flex-1 overflow-y-auto custom-scrollbar px-8 py-4",
        isMobile ? "px-6 min-h-[400px] max-h-[80vh]" : "h-[500px]"
      )}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[#FF7700]" />
            <p className="text-gray-500 font-medium">Loading {type}...</p>
          </div>
        ) : currentList.length > 0 ? (
          <div className="flex flex-col gap-8 pb-8">
            {currentList.map((user) => (
              <div key={user.userId} className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-14 h-14 border border-zinc-50">
                      <AvatarImage src={user.profileImage} className="object-cover" />
                      <AvatarFallback className="bg-zinc-800 text-lg font-bold text-white">
                        {user.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-col">
                    <span 
                      className="text-white font-bold text-base group-hover:text-[#FF7700] transition-colors line-clamp-1 cursor-pointer"
                      onClick={() => handleUserClick(user.username)}
                    >
                      {user.username}
                    </span>
                    {type === 'followers' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmRemove(user); }}
                        className="text-red-500 text-xs font-bold hover:text-red-400 transition-colors text-left mt-1 cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleFollow(user); }}
                  className={cn(
                    "px-8 py-2.5 rounded-full text-sm font-bold transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap",
                    user.isFollowing
                      ? "bg-[#1D1F20] text-gray-400 border border-zinc-700 hover:bg-zinc-800"
                      : "bg-[#FF7700] text-[#111213] hover:bg-[#ff8c2b]"
                  )}
                >
                  {user.isFollowing ? 'Following' : (type === 'followers' ? 'Follow Back' : 'Follow')}
                </button>
              </div>
            ))}

            {(type === 'followers' ? hasMoreFollowers : hasMoreFollowing) && (
              <button
                onClick={() => type === 'followers' ? fetchNextFollowers() : fetchNextFollowing()}
                className="w-full py-4 text-[#FF7700] font-bold text-sm hover:underline cursor-pointer"
              >
                Load More
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-gray-600 mb-6">
              <div className="w-24 h-24 mx-auto mb-6 bg-zinc-800/30 rounded-full flex items-center justify-center shadow-2xl">
                <UserPlus className="w-10 h-10 opacity-20 text-[#FF7700]" />
              </div>
              <p className="text-2xl font-extrabold text-white mb-2">Opss! No One {type === 'followers' ? 'Following' : 'Followed by'} you</p>
              <p className="text-gray-500 font-medium">Start connecting with other creators!</p>
            </div>
          </div>
        )}
      </div>

      {/* Stacked Confirmation Modals */}
      <BlockUserModal
        isOpen={!!confirmRemove}
        username={confirmRemove?.username || ''}
        avatarUrl={confirmRemove?.profileImage}
        isLoading={isBlocking}
        onConfirm={handleConfirmBlock}
        onCancel={() => setConfirmRemove(null)}
      />

      <ConfirmModal
        isOpen={!!confirmUnfollow}
        title={`Unfollow @${confirmUnfollow?.username}?`}
        descriptionPrefix="Are you sure you want to unfollow"
        username={confirmUnfollow?.username || ''}
        avatarUrl={confirmUnfollow?.profileImage}
        confirmLabel="Unfollow"
        confirmClassName="bg-red-600 text-white hover:bg-red-700"
        onConfirm={handleConfirmUnfollow}
        onCancel={() => setConfirmUnfollow(null)}
      />
    </>
  );

  return (
    <ModalWrapper open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ContentWrapper
        showCloseButton={false}
        className={cn(
          "border-none text-white p-0 overflow-hidden flex flex-col shadow-2xl",
          isMobile
            ? "bg-[#111213] rounded-t-[40px] h-[90vh]"
            : "max-w-lg h-[700px] rounded-[40px]"
        )}
        style={!isMobile ? { background: 'linear-gradient(228deg, rgba(69, 26, 26, 0.5) 0%, rgba(26, 28, 30, 0.15) 42%), #111213' } : {}}
      >
        {content}
      </ContentWrapper>
    </ModalWrapper>
  );
};

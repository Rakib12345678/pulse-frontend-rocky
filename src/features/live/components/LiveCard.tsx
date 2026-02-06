import React from 'react';
import { Link } from '@tanstack/react-router';
import { Users, Heart } from 'lucide-react';

interface LiveCardProps {
  index: string | number;
  thumbnailUrl: string;
  avatarUrl: string;
  streamerName: string;
  viewerCount: string | number;
  followersCount: string;
  category: string;
  collaboratorAvatarUrl?: string;
}

export const LiveCard: React.FC<LiveCardProps> = ({
  index,
  thumbnailUrl,
  avatarUrl,
  streamerName,
  viewerCount,
  followersCount,
  category,
  collaboratorAvatarUrl,
}) => {
  return (
    <Link
      to="/live/$id"
      params={{ id: String(index) }}
      className="group relative aspect-[3/4.5] overflow-hidden rounded-3xl bg-neutral-900 transition-all hover:ring-2 hover:ring-primary cursor-pointer block shadow-lg"
    >
      {/* Background Image */}
      <img
        src={thumbnailUrl}
        alt={streamerName}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Overlays */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-black/20" />

      {/* Top Left: Viewers Pill */}
      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-[#FFE9C0] px-3 py-1.5 text-xs font-bold text-[#8B5E3C] shadow-sm">
        <Users className="h-3.5 w-3.5 fill-[#8B5E3C]" />
        <span>{viewerCount}</span>
      </div>

      {/* Top Right: Collaborator */}
      {collaboratorAvatarUrl && (
        <div className="absolute right-3 top-3">
          <div className="relative">
            <img
              src={collaboratorAvatarUrl}
              alt="Collaborator"
              className="h-10 w-10 rounded-full border-2 border-white object-cover"
            />
            <div className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FFE9C0] border border-white">
              <Heart className="h-2.5 w-2.5 fill-[#8B5E3C] text-[#8B5E3C]" />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Info Section */}
      <div className="absolute bottom-4 left-3 right-3 flex items-end justify-between">
        <div className="flex items-center gap-3">
          {/* Streamer Avatar with Live Badge */}
          <div className="relative">
            <img
              src={avatarUrl}
              alt={streamerName}
              className="h-12 w-12 rounded-full border-2 border-white object-cover"
            />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-md bg-red-600 px-1 py-0.5 text-[8px] font-bold text-white uppercase ring-1 ring-white">
              Live
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="text-sm font-bold text-white">@{streamerName}</h3>
            <p className="text-[11px] font-medium text-gray-300">
              {followersCount} Followers
            </p>
          </div>
        </div>

        {/* Category Badge */}
        <div className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
          {category}
        </div>
      </div>
    </Link>
  );
};
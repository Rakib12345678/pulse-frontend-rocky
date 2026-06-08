import { Heart, MessageCircle, Eye } from 'lucide-react';
import '../styles/landing.css';
import marinNature from '@/assets/marinNature.png';
import bunnyTeacher from '@/assets/bunnyTeacher.png';
import classicalDancer from '@/assets/classicalDancer.png';
import singerPopular from '@/assets/singerPopular.png';

/* -------------------------------------------------------------------------- */
/*                                    TYPES                                   */
/* -------------------------------------------------------------------------- */

type ChatMessage = {
  id: string;
  username: string;
  message: string;
  highlight?: boolean;
};

const CARD_R = 'rounded-[24px]';

/* -------------------------------------------------------------------------- */
/*                              STAT CARD                                     */
/* -------------------------------------------------------------------------- */

const StatCard = ({
  value,
  label,
  gradientClass
}: {
  value: string;
  label: string;
  gradientClass: string;
}) => (
  <div className={`relative flex h-[344px] w-[302px] shrink-0 flex-col justify-center ${CARD_R} p-6 shadow-2xl ${gradientClass} transition-transform hover:scale-[1.02] overflow-hidden group`}>
    <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl transition-transform group-hover:scale-150" />
    <h3 className="relative z-10 mb-2 text-[32px] font-bold leading-none text-white tracking-tight">{value}</h3>
    <p className="relative z-10 text-[18px] font-bold leading-[30px] text-white/90">{label}</p>
  </div>
);

/* -------------------------------------------------------------------------- */
/*                              LIVESTREAM CARD                               */
/* -------------------------------------------------------------------------- */

const LivestreamCard = ({
  streamImage,
  username,
  viewers,
  chatMessages = [],
  height = "h-[466px]",
  showOverlay = true
}: {
  streamImage: string;
  username: string;
  viewers?: string;
  chatMessages?: ChatMessage[];
  height?: string;
  showOverlay?: boolean;
}) => {
  return (
    <div
      className={`relative w-[302px] shrink-0 overflow-hidden ${CARD_R} bg-gray-900 shadow-2xl transition-transform duration-500 hover:scale-[1.02] ${height}`}
    >
      <img
        src={streamImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-black/80" />

      {/* Header */}
      <div className="absolute top-6 left-5 right-5 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
            className="h-8 w-8 rounded-full border border-white/20 bg-white/10"
            alt={username}
          />
          <div>
            <p className="text-xs font-bold text-white shadow-black drop-shadow-md">{username}</p>
            {viewers && <span className="text-[10px] font-medium text-white/80">LIVE</span>}
          </div>
        </div>
        {viewers && (
          <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 backdrop-blur-md border border-white/5">
            <Eye className="h-3 w-3 text-yellow-400" />
            <span className="text-[10px] font-bold text-white">{viewers}</span>
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="absolute bottom-20 left-4 right-4 z-10 flex flex-col items-start gap-2">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 backdrop-blur-md border border-white/10
            ${msg.highlight ? 'bg-pink-500/80' : 'bg-black/60'}`}
          >
            <span className="text-[11px] font-bold text-white">{msg.username}:</span>
            <span className="text-[11px] font-medium text-white/90 leading-none pb-px">{msg.message}</span>
          </div>
        ))}
      </div>

      {/* Footer Controls */}
      {showOverlay && (
        <div className="absolute bottom-5 left-4 right-4 z-10 flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 backdrop-blur-md">
            <MessageCircle className="h-4 w-4 text-white/70" />
            <span className="text-xs font-medium text-white/50">Add a comment...</span>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20">
            <Heart className="h-4 w-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               COLUMN SET                                   */
/* -------------------------------------------------------------------------- */

export const ColumnSet = () => (
  <div className="flex h-[800px] items-center gap-8 px-4">

    {/* COL 2: Stack (Blue Stat + Nature) */}
    <div className="flex flex-col gap-7">
      <LivestreamCard
        height="h-[344px]"
        streamImage={marinNature}
        viewers='1.2K'
        username="marin_nature"
        chatMessages={[{ id: '1', username: 'alex', message: 'So calming 🌿' }]}
      />
      <StatCard
        value="Create. Stream. Connect."
        label="Go live instantly and build real connections with your audience."
        gradientClass="bg-gradient-to-tr from-[#5351E5] to-[#CFCEFF]"
      />
    </div>

    {/* COL 3: HERO CENTER */}
    <div data-hero-column>
      <LivestreamCard
        height="h-[466px]"
        streamImage={bunnyTeacher}
        username="bunny_teacher"
        viewers="8.2k"
        chatMessages={[{ id: '1', username: 'fan_1', message: 'Love this setup ❤️' }]}
      />
    </div>

    {/* COL 4: Stack (Orange Stat + Dance) */}
    <div className="flex flex-col gap-7">
      <StatCard
        value="Built for the Next Generation of Creators"
        label="Designed to make live streaming interactive, engaging, and fun."
        gradientClass="bg-gradient-to-tr from-[#FF7A00] via-[#FF9A6B] to-[#FFD0C4]"
      />
      <LivestreamCard
        height="h-[344px]"
        streamImage={classicalDancer}
        username="Classical_Dancer"
        viewers="8.2k"
        chatMessages={[{ id: '1', username: 'fan_1', message: 'Lets dance' }]}
      />
    </div>

    {/* COL 5: Right Edge */}
    <LivestreamCard
      height="h-[466px]"
      streamImage={singerPopular}
      username="Popular_Singer"
      viewers="8.2k"
      chatMessages={[{ id: '1', username: 'fan_1', message: 'Great vocals 🎵' }]}
    />

  </div>
);
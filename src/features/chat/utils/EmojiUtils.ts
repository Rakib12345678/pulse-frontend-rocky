
export interface QuickReaction {
    id: string;
    emoji: string;
}

const DEFAULT_REACTIONS: QuickReaction[] = [
    { id: 'love', emoji: '❤️' },
    { id: 'thumbsup', emoji: '👍' },
    { id: 'fire', emoji: '🔥' },
    { id: 'joy', emoji: '😂' },
    { id: 'wow', emoji: '😮' },
    { id: 'sad', emoji: '😢' },
];

const STORAGE_KEY = 'chat_recent_emojis';
const MAX_RECENT = 6;

export const getRecentEmojis = (): QuickReaction[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return DEFAULT_REACTIONS;
        const parsed = JSON.parse(stored) as QuickReaction[];
        if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_REACTIONS;
        return parsed;
    } catch (e) {
        console.error('Failed to load recent emojis', e);
        return DEFAULT_REACTIONS;
    }
};

export const saveRecentEmoji = (emojiObj: any) => {
    try {
        // Handle both string coming from handleReaction('❤️') 
        // and object coming from emoji-mart select { id: 'joy', native: '😂' }
        let emoji: string;
        let id: string;

        if (typeof emojiObj === 'string') {
            emoji = emojiObj;
            // Best guess for ID if we only have the emoji string
            id = emojiObj; 
        } else {
            emoji = emojiObj.native || emojiObj.emoji; // supports standard and custom emoji structures
            id = emojiObj.id || emoji;
        }

        if (!emoji) return;

        const current = getRecentEmojis();
        
        // Remove if exists to move to top
        const filtered = current.filter(r => r.emoji !== emoji);
        
        // Add to top
        const updated = [{ id, emoji }, ...filtered].slice(0, MAX_RECENT);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        
        // Dispatch custom event to notify other components (active message bubbles)
        window.dispatchEvent(new CustomEvent('recent_emojis_updated', { detail: updated }));
    } catch (e) {
        console.error('Failed to save recent emoji', e);
    }
};

import data from '@emoji-mart/data';

export interface QuickReaction {
    id: string;
    emoji: string;
}

export const getSafeEmojiId = (emoji: string, preferredId?: string): string => {
    if (preferredId && /^[a-zA-Z0-9_\-\.]+$/.test(preferredId)) return preferredId;
    if (/^[a-zA-Z0-9_\-\.]+$/.test(emoji)) return emoji;
    
    // Convert emoji char to safe hex string
    const hex = Array.from(emoji)
        .map(c => c.codePointAt(0)?.toString(16))
        .filter(Boolean)
        .join('_');
    return `emoji_${hex}`;
};

/**
 * Decodes a safe emoji ID back to its emoji character(s).
 * Handles:
 * 1. Hex-based IDs (emoji_1f44d)
 * 2. Descriptive IDs from emoji-mart (pleading_face)
 * 3. Custom mapped IDs (thumbsup)
 */
export const parseEmojiId = (id: string): string => {
    if (!id) return id;

    // 1. Handle hex-based IDs
    if (id.startsWith('emoji_')) {
        try {
            const hexParts = id.replace('emoji_', '').split('_');
            return hexParts
                .map(hex => {
                    const codePoint = parseInt(hex, 16);
                    return isNaN(codePoint) ? '' : String.fromCodePoint(codePoint);
                })
                .join('');
        } catch (e) {
            return id;
        }
    }

    // 2. Handle descriptive IDs from emoji-mart (e.g. "pleading_face")
    const emojiData = (data as any).emojis?.[id];
    if (emojiData && emojiData.skins && emojiData.skins[0]) {
        return emojiData.skins[0].native;
    }

    // 3. Fallback to manual check against DEFAULT_REACTIONS
    const manual = DEFAULT_REACTIONS.find(r => r.id === id);
    if (manual) return manual.emoji;

    return id;
};

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
        // Migration: Ensure all loaded IDs are safe
        return parsed.map(r => ({
            ...r,
            id: getSafeEmojiId(r.emoji, r.id)
        }));
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
            id = getSafeEmojiId(emojiObj); 
        } else {
            emoji = emojiObj.native || emojiObj.emoji; 
            id = getSafeEmojiId(emoji, emojiObj.id);
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

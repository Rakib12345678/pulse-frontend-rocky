export const capitalizeName = (name: string): string =>
    name.replace(/\b\w/g, c => c.toUpperCase());

export const getDisplayName = (user: Record<string, any> | null | undefined): string => {
    if (!user) return 'Unknown';

    const clean = (v: any) => (v ?? '').toString().trim();

    // camelCase custom field (set in connectStreamUser)
    if (clean(user.fullName))  return clean(user.fullName);

    // snake_case variant — some backends serialise it this way
    if (clean(user.full_name)) return clean(user.full_name);

    // Separate first/last name fields
    const first = clean(user.firstName || user.first_name);
    const last  = clean(user.lastName  || user.last_name);
    if (first || last) return `${first} ${last}`.trim();

    // Built-in Stream `name` field — usually the username/handle
    if (clean(user.name)) return clean(user.name);

    // Absolute fallback
    return clean(user.id) || 'Unknown';
};

export const formatMsgTime = (iso: string): string =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const safeDate = (iso: string): Date => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? new Date() : d;
};

export const getDateLabel = (iso: string): string => {
    const date   = safeDate(iso);
    const now    = new Date();
    const today  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const d = Math.round((today.getTime() - msgDay.getTime()) / 86_400_000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 7) return date.toLocaleDateString([], { weekday: 'long' });
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
};

export const getDayKey = (iso: string): string => safeDate(iso).toISOString().slice(0, 10);

export const formatLastSeen = (iso: string): string => {
    const date = new Date(iso);
    const now  = new Date();
    const s    = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (s < 60) return 'last seen just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `last seen ${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `last seen ${h}h ago`;
    const dd = Math.floor(h / 24);
    if (dd === 1) return 'last seen yesterday';
    return `last seen ${date.toLocaleDateString([], { day: '2-digit', month: 'short' })}`;
};

export const formatRelativeTime = (iso: string): string => {
    const date  = new Date(iso);
    const now   = new Date();
    const diffS = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffS < 60) return `${diffS}s ago`;
    const diffM = Math.floor(diffS / 60);
    if (diffM < 60) return `${diffM}m ago`;
    const diffH = Math.floor(diffM / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Yesterday';
    if (diffD < 7) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
};
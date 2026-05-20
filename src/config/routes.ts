/**
 * List of routes that do not require authentication.
 */
export const PUBLIC_ROUTES = [
    '/',        // Home
    '/explore', // Explore
    '/live',    // Live streams
    '/for-you', // For you
    '/live/:id',
    '/chats',
    '/privacy-policy',
    '/terms-conditions',
    '/refund-policy'
];

/**
 * Helper to determine if a specific path is public.
 */
export const isPublicRoute = (pathname: string): boolean => {
    // 1. Exact match check
    if (PUBLIC_ROUTES.includes(pathname)) return true;

    // 2. Dynamic route match check
    return PUBLIC_ROUTES.some(route => {
        if (!route.includes(':')) return false;

        const routeParts = route.split('/');
        const pathParts = pathname.split('/');

        if (routeParts.length !== pathParts.length) return false;

        return routeParts.every((part, i) => {
            return part.startsWith(':') || part === pathParts[i];
        });
    });
};
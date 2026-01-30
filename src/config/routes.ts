/**
 * List of routes that do not require authentication. Will add it router later
 */
export const PUBLIC_ROUTES = [
    '/login',
    '/register',
    '/forgot-password',
    '/about',
    '/tos',
    '/privacy',
    '/reset-password',
    '/',        // Home
    '/explore', // Explore
    '/live',    // Live streams
    '/coins'    // Coins page
];

/**
 * Helper to determine if a specific path is public.
 */
export const isPublicRoute = (pathname: string): boolean => {
    // 1. Exact match check
    if (PUBLIC_ROUTES.includes(pathname)) return true;

    return false;
};
/**
 * List of routes that do not require authentication.
 */
export const PUBLIC_ROUTES = [
    '/',        // Home
    '/explore', // Explore
    '/live',    // Live streams
    '/for-you', // For you
];

/**
 * Helper to determine if a specific path is public.
 */
export const isPublicRoute = (pathname: string): boolean => {
    // 1. Exact match check
    if (PUBLIC_ROUTES.includes(pathname)) return true;

    return false;
};
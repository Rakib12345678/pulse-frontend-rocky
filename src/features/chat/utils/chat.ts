export const BASE_URL = 'https://app.pulselive.zendot.in';

export const toAbsoluteUrl = (url: string | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BASE_URL}/${url.replace(/^\//, '')}`;
};
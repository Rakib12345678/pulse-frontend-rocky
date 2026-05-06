import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/features/auth/stores/authStore';

const baseURL = `${import.meta.env.VITE_API_URL}/api`;

const api = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    // This tells the browser not to send the Referer header with requests
    referrerPolicy: "no-referrer" 
} as any); // Type cast needed as referrerPolicy is a fetch option passed through axios

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise<string>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { refreshToken } = useAuthStore.getState();

                if (!refreshToken) {
                    // No session to refresh — propagate the original error so
                    // callers (e.g. useAuth) can inspect err.response correctly
                    // (e.g. to detect a 403 "suspended" response during sign-up).
                    isRefreshing = false;
                    return Promise.reject(error);
                }

                const { data } = await axios.post(
                    `${baseURL}/auth/refresh`, 
                    null,
                    { 
                        params: { refreshToken },
                        withCredentials: true 
                    }
                );

                const newToken = data.accessToken;
                const newRefreshToken = data.refreshToken;
                const user = data.user;
                useAuthStore.getState().setAuth({
                    accessToken: newToken,
                    refreshToken: newRefreshToken || refreshToken,
                    user: user,
                    wallet: data.wallet,
                    newUser: false
                });

                processQueue(null, newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                useAuthStore.getState().clearAuth();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const token = useAuthStore.getState().accessToken;

      // Do not auto-logout demo accounts when offline or mock requests return 401
      if (token && token.startsWith('demo-')) {
        return Promise.reject(error);
      }

      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken && !refreshToken.startsWith('demo-')) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          const { access_token, refresh_token: newRefresh, role } = res.data;
          const user = useAuthStore.getState().user;

          if (user) {
            useAuthStore.getState().setAuth(access_token, newRefresh, role, user);
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return apiClient(originalRequest);
          }
        } catch {
          useAuthStore.getState().logout();
        }
      } else {
        if (!token?.startsWith('demo-')) {
          useAuthStore.getState().logout();
        }
      }
    }
    return Promise.reject(error);
  }
);

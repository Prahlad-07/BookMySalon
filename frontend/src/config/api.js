/**
 * @author Prahlad Yadav
 * @version 2.0
 * @since 2026-02-13
 */

import axios from 'axios';
import { API_BASE_URL } from './apiBaseUrl';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  persistAuthSession,
} from '../utils/authSession';

let refreshPromise = null;

// Render's free tier can cold-start for 30-60s, so give requests generous headroom
// and retry idempotent (GET) calls once on a transient network/timeout error.
const REQUEST_TIMEOUT_MS = 25000;
const MAX_GET_RETRIES = 1;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

const AUTH_ENDPOINT_PREFIX = '/api/auth/';

const isAuthEndpoint = (url = '') => url.includes(AUTH_ENDPOINT_PREFIX);

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && !isAuthEndpoint(config.url || '')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const isRetriableNetworkError = (error) =>
  error.code === 'ECONNABORTED' ||
  error.code === 'ERR_NETWORK' ||
  (!error.response && Boolean(error.request));

api.interceptors.response.use(
  (response) => {
    if (response.data && Object.prototype.hasOwnProperty.call(response.data, 'data')) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    // Retry transient failures for safe methods (typically a backend cold start).
    if (
      originalRequest &&
      isRetriableNetworkError(error) &&
      String(originalRequest.method || 'get').toLowerCase() === 'get'
    ) {
      originalRequest._retryCount = originalRequest._retryCount || 0;
      if (originalRequest._retryCount < MAX_GET_RETRIES) {
        originalRequest._retryCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 1200 * originalRequest._retryCount));
        return api(originalRequest);
      }
    }

    const isAuthRequest =
      requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/signup') ||
      requestUrl.includes('/api/auth/register') ||
      requestUrl.includes('/api/auth/oauth/exchange') ||
      requestUrl.includes('/api/auth/refresh-token') ||
      requestUrl.includes('/api/auth/forgot-password') ||
      requestUrl.includes('/api/auth/reset-password');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          if (!refreshPromise) {
            refreshPromise = axios
              .post(
                `${API_BASE_URL}/api/auth/refresh-token`,
                { refreshToken },
                {
                  timeout: REQUEST_TIMEOUT_MS,
                  headers: { 'Content-Type': 'application/json' },
                }
              )
              .then((response) => response.data?.data || response.data)
              .finally(() => {
                refreshPromise = null;
              });
          }

          const session = await refreshPromise;
          if (session?.token) {
            persistAuthSession(session);
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${session.token}`;
            return api(originalRequest);
          }
        } catch (_) {
          refreshPromise = null;
        }
      }

      clearAuthSession();
      if (!window.location.pathname.startsWith('/login')) {
        const message = encodeURIComponent('Your session expired. Please sign in again.');
        window.location.assign(`/login?error=${message}`);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

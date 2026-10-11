export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const GOOGLE_AUTH_URL = `${API_BASE_URL}/oauth2/authorization/google`;

export const buildWebSocketUrl = (path, params = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  return `${url.pathname}${url.search}`;
};

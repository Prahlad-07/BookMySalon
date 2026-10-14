export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const GOOGLE_AUTH_URL = `${API_BASE_URL}/oauth2/authorization/google`;

export const buildWebSocketUrl = (path, params = {}) => {
  const url = new URL(`${API_BASE_URL}${path}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      url.searchParams.set(key, value);
    }
  });
  // Keep the API host when it differs from the page's (e.g. Vercel frontend + Render API);
  // returning only the path would point SockJS at the frontend's own domain.
  return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
};

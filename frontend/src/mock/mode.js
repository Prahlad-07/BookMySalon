/**
 * Decides, once per page load, whether API calls go to the real backend or the
 * in-browser demo API (src/mock). Configure with VITE_API_MODE:
 *
 *   real  – always the real backend (use for production once it is reliable)
 *   mock  – always the demo API (offline demos, UI work without a backend)
 *   auto  – (default) probe the backend's health endpoint; fall back to demo mode
 *           only if it doesn't answer, e.g. a sleeping or failed free-tier server.
 *
 * Demo mode is always announced in the UI (DemoModeBanner); nothing simulated is
 * ever sent to, or presented as coming from, the real backend.
 */
import { API_BASE_URL } from '../config/apiBaseUrl';

const CONFIGURED = String(import.meta.env.VITE_API_MODE || 'auto').toLowerCase();
const PROBE_TIMEOUT_MS = 8000;
const SESSION_KEY = 'bms.apiMode';

let resolved = null;

const probe = async () => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/health`, { signal: ctrl.signal, cache: 'no-store' });
    return res.ok ? 'real' : 'mock';
  } catch {
    return 'mock';
  } finally {
    clearTimeout(timer);
  }
};

const decide = async () => {
  if (CONFIGURED === 'mock' || CONFIGURED === 'real') return CONFIGURED;
  // Keep one answer per tab so a slow backend can't flip the app mid-session.
  try {
    const cached = sessionStorage.getItem(SESSION_KEY);
    if (cached === 'real' || cached === 'mock') return cached;
  } catch {
    /* storage unavailable */
  }
  const mode = await probe();
  try {
    sessionStorage.setItem(SESSION_KEY, mode);
  } catch {
    /* storage unavailable */
  }
  return mode;
};

export const apiModeReady = decide().then((mode) => {
  resolved = mode;
  return mode;
});

/** Synchronous check; only meaningful after apiModeReady has resolved. */
export const isMockMode = () => resolved === 'mock';

/** Lets someone in demo mode re-check the real backend (e.g. after it wakes up). */
export const retryRealBackend = () => {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
  window.location.reload();
};

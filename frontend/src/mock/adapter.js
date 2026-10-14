/**
 * axios adapter that answers requests from the demo API instead of the network.
 * Responses use the backend's envelope ({ success, message, data, error }) so the
 * normal interceptors unwrap them exactly as they do for real responses.
 */
import { HttpError, routes } from './handlers';

const latency = () => new Promise((r) => setTimeout(r, 120 + Math.random() * 220));

const parse = (config) => {
  const url = new URL(config.url, 'http://demo.local');
  const params = { ...Object.fromEntries(url.searchParams), ...(config.params || {}) };
  let body = config.data;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      /* leave as string */
    }
  }
  const auth = config.headers?.Authorization || config.headers?.authorization || '';
  return {
    method: String(config.method || 'get').toUpperCase(),
    path: url.pathname,
    params,
    body,
    token: String(auth).replace(/^Bearer\s+/i, ''),
  };
};

const response = (config, status, payload) => ({
  data: payload,
  status,
  statusText: String(status),
  headers: { 'content-type': 'application/json' },
  config,
  request: {},
});

export default async function demoAdapter(config) {
  await latency();
  if (config.signal?.aborted) {
    const err = new Error('canceled');
    err.name = 'CanceledError';
    err.code = 'ERR_CANCELED';
    err.__CANCEL__ = true;
    err.config = config;
    throw err;
  }
  const req = parse(config);
  const route = routes.find(([method, pattern]) => method === req.method && pattern.test(req.path));
  try {
    if (!route) throw new HttpError(404, `Demo API has no handler for ${req.method} ${req.path}`);
    const match = req.path.match(route[1]).slice(1);
    const result = await route[2](req, match);
    return response(config, result.status, { success: true, message: result.message, data: result.data, error: null });
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    const body = { success: false, message: status >= 500 ? 'Unexpected error' : 'Request failed', data: null, error: e.error || e.message };
    const err = new Error(body.error);
    err.response = response(config, status, body);
    err.config = config;
    err.isAxiosError = true;
    if (status >= 500) console.error('[demo api]', e);
    throw err;
  }
}

import axios from 'axios';
import { clearToken, getToken, isTokenStorageError } from './tokenStorage';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!configuredApiUrl) throw new Error('EXPO_PUBLIC_API_URL is required. Set it in mobile/.env.');

// Keep the configured value as the server origin. Every application endpoint
// is mounted by Express below `/api`, including `/api/auth/login`.
export const apiBaseUrl = new URL(configuredApiUrl).origin;
export const api = axios.create({ baseURL: apiBaseUrl, timeout: 30_000 });
const activeRequests = new Map<string, number>();
const isDevelopment = __DEV__;

function requestTarget(url: string | undefined) {
  try {
    const target = new URL(url || '', apiBaseUrl);
    return { url: target.toString(), host: target.host, path: target.pathname };
  } catch {
    return { url: url || '/', host: 'unknown', path: url || '/' };
  }
}

function apiPath(url: string | undefined) {
  if (!url || /^[a-z][a-z\d+.-]*:/i.test(url) || url.startsWith('/api/')) return url;
  return url.startsWith('/') ? `/api${url}` : `/api/${url}`;
}

api.interceptors.request.use(async config => {
  config.url = apiPath(config.url);
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const target = requestTarget(config.url), method = config.method?.toUpperCase() || 'GET', key = `${method} ${target.path}`;
  const count = activeRequests.get(key) || 0;
  activeRequests.set(key, count + 1);
  (config as any).metadata = { startedAt: Date.now(), key };
  if (isDevelopment) console.info('[SeniorLearn API] request', { method, url: target.url, timeoutMs: config.timeout, duplicate: count > 0 });
  return config;
});

function complete(config: any, status: number | null, error?: unknown) {
  const target = requestTarget(config?.url), metadata = config?.metadata || {}, durationMs = metadata.startedAt ? Date.now() - metadata.startedAt : undefined, key = metadata.key;
  if (key) { const count = activeRequests.get(key) || 1; count <= 1 ? activeRequests.delete(key) : activeRequests.set(key, count - 1); }
  return { method: config?.method?.toUpperCase() || 'GET', url: target.url, status, durationMs, timeout: (error as any)?.code === 'ECONNABORTED', network: !!error && !(error as any)?.response };
}

api.interceptors.response.use(response => {
  if (isDevelopment) console.info('[SeniorLearn API] response', complete(response.config, response.status));
  return response;
}, async error => {
  const details = complete(error.config, error.response?.status ?? null, error);
  if (isDevelopment) console.warn('[SeniorLearn API] error', { ...details, code: error.code || null, name: error.name || 'Error', message: error.message || 'Unknown error' });
  if (error.response?.status === 401) await clearToken();
  return Promise.reject(error);
});

export const errorMessage = (e: unknown) => { const status = axios.isAxiosError(e) ? e.response?.status : undefined, message = axios.isAxiosError(e) ? e.response?.data?.error : (e as { response?: { data?: { error?: string } } })?.response?.data?.error; if (message) return message; if (isTokenStorageError(e)) return 'Your sign-in could not be saved on this device. Please try again.'; if (status === 402) return 'The payment confirmation was not completed.'; if (status && status >= 500) return "We couldn't renew your membership. Please try again."; if (axios.isAxiosError(e) && (!e.response || e.code === 'ECONNABORTED')) return 'Unable to reach SeniorLearn. Check your connection and try again.'; return 'Something went wrong. Please try again.'; };
export const loginErrorMessage = (e: unknown) => { if (isTokenStorageError(e)) return 'Your sign-in could not be saved on this device. Please try again.'; if (!axios.isAxiosError(e)) return 'Unable to sign in. Please try again.'; if (e.response?.status === 401) return 'Email or password is incorrect.'; if (e.response?.status === 429) return 'Too many sign-in attempts. Please wait and try again.'; if (e.response?.status === 503 || e.response?.data?.code === 'DATABASE_UNAVAILABLE') return 'SeniorLearn’s database is temporarily unavailable. Please try again shortly.'; if (e.code === 'ECONNABORTED' || /timeout/i.test(e.message || '')) return 'The server took too long to respond. Please try again.'; if (!e.response) return 'Unable to reach SeniorLearn. Check your connection and try again.'; if (e.response.status === 404) return 'SeniorLearn sign-in service was not found. Please check the app connection.'; if (e.response.status >= 500) return 'SeniorLearn is temporarily unavailable. Please try again later.'; return 'Unable to sign in. Please check your details and try again.'; };

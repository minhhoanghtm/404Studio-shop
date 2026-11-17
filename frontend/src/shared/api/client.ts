/**
 * ATELIER VÉRITÉ — Centralized HTTP API Client
 * Connects Frontend directly to Backend REST APIs
 * Fully handles Bearer Tokens, Refresh Tokens, and Graceful Error Handling
 */

const configuredBaseUrl = (import.meta.env.VITE_API_URL || '/api').trim().replace(/\/$/, '');
const API_BASE_URL = configuredBaseUrl.endsWith('/api')
  ? configuredBaseUrl
  : (configuredBaseUrl === '' ? '/api' : `${configuredBaseUrl}/api`);
const REQUEST_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15_000);

export interface ApiResponse<T = any> {
  success?: boolean;
  status?: string;
  data?: T;
  message?: string;
  error?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export type ApiErrorKind = 'unauthorized' | 'forbidden' | 'not-found' | 'validation' | 'rate-limited' | 'server' | 'network' | 'timeout';

export const getApiErrorKind = (error: unknown): ApiErrorKind => {
  if (!(error instanceof ApiError)) return 'network';
  if (error.status === 0) return 'network';
  if (error.status === 401) return 'unauthorized';
  if (error.status === 403) return 'forbidden';
  if (error.status === 404) return 'not-found';
  if (error.status === 422 || error.status === 400) return 'validation';
  if (error.status === 429) return 'rate-limited';
  return 'server';
};

// Memory token cache or fallback to localStorage
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

const isTrustedApiUrl = (url: string) => {
  if (!/^https?:\/\//i.test(url)) return true;
  try {
    const target = new URL(url);
    const base = /^https?:\/\//i.test(API_BASE_URL) ? new URL(API_BASE_URL) : null;
    return base?.origin === target.origin;
  } catch {
    return false;
  }
};

export const getAccessToken = (): string | null => {
  try {
    const authStorage = localStorage.getItem('atelier_patron_auth');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.token || parsed?.state?.accessToken || null;
    }
  } catch {
    // Ignore JSON parse errors
  }
  return null;
};

export const setAccessToken = (token: string) => {
  try {
    const authStorage = localStorage.getItem('atelier_patron_auth');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      parsed.state = { ...parsed.state, token, accessToken: token, isAuthenticated: true };
      localStorage.setItem('atelier_patron_auth', JSON.stringify(parsed));
    } else {
      localStorage.setItem(
        'atelier_patron_auth',
        JSON.stringify({ state: { token, accessToken: token, isAuthenticated: true } })
      );
    }
  } catch {
    // Ignore
  }
};

const refreshAccessToken = async (): Promise<string> => {
  if (!refreshPromise) {
    isRefreshing = true;
    refreshPromise = fetch(`${API_BASE_URL}/auth/refreshToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        const token = data?.data?.accessToken || data?.accessToken;
        if (!response.ok || !token) throw new ApiError(data?.message || 'Phiên đăng nhập đã hết hạn', response.status, data);
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  if (!isTrustedApiUrl(url)) throw new ApiError('Đích API không được tin cậy', 0);
  
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const signal = options.signal
    ? AbortSignal.any([options.signal, controller.signal])
    : controller.signal;

  try {
    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      signal,
    });

    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const newToken = await refreshAccessToken();
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(url, { ...options, headers, credentials: 'include', signal });
    }

    // Try parsing json
    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = data?.message || data?.error || `Yêu cầu thất bại với mã lỗi ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or connectivity issue
    const timedOut = controller.signal.aborted && !options.signal?.aborted;
    throw new ApiError(timedOut ? 'Yêu cầu đã hết thời gian chờ' : error.message || 'Không thể kết nối đến máy chủ Backend', 0, null);
  } finally {
    window.clearTimeout(timeout);
  }
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

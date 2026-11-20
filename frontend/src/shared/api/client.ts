/**
 * ATELIER VÉRITÉ — Centralized HTTP API Client
 * Connects Frontend directly to Backend REST APIs
 * Fully handles Bearer Tokens, Refresh Tokens, Single-Flight Queuing, and Auto-Logout
 */

import { broadcastAuthLogout, isJwtExpired } from '../utils/authSync';
import { useToastStore } from '../stores/useToastStore';

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
  code?: string;
  [key: string]: any;
}

export class ApiError extends Error {
  status: number;
  data: any;
  code?: string;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = data?.code || data?.error?.code;
  }
}

export type ApiErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'validation'
  | 'rate-limited'
  | 'server'
  | 'network'
  | 'timeout';

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

export const isAuthError = (err: any): boolean => {
  if (!err) return false;
  if (err.status === 401 || err.status === 403) return true;
  if (typeof err.code === 'string' && err.code.startsWith('REFRESH')) return true;
  if (typeof err.message === 'string') {
    const msg = err.message.toLowerCase();
    if (msg.includes('refresh') || msg.includes('hết hạn') || msg.includes('chưa đăng nhập')) {
      return true;
    }
  }
  return false;
};

// Memory token cache or fallback to localStorage
let refreshPromise: Promise<string> | null = null;
let lastSessionExpiredAt = 0;

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

export const getRefreshToken = (): string | null => {
  try {
    const authStorage = localStorage.getItem('atelier_patron_auth');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.refreshToken || null;
    }
  } catch {
    // Ignore
  }
  return null;
};

export const setAuthTokens = (accessToken: string, refreshToken?: string | null) => {
  try {
    const authStorage = localStorage.getItem('atelier_patron_auth');
    const existing = authStorage ? JSON.parse(authStorage) : {};
    const existingState = existing.state || {};
    const updatedState = {
      ...existingState,
      token: accessToken,
      accessToken,
      ...(refreshToken ? { refreshToken } : {}),
      isAuthenticated: true,
    };
    localStorage.setItem(
      'atelier_patron_auth',
      JSON.stringify({ ...existing, state: updatedState })
    );
  } catch {
    // Ignore storage write issues
  }
};

export const setAccessToken = (token: string) => {
  setAuthTokens(token);
};

export const clearAuthSession = () => {
  try {
    localStorage.removeItem('atelier_patron_auth');
  } catch {
    // Ignore
  }
};

/**
 * Handle session expiration: clears storage, broadcasts across tabs, shows toast, and redirects if on protected route.
 */
export const handleAuthSessionExpired = (message: string = 'Phiên đăng nhập đã hết hạn') => {
  const now = Date.now();
  if (now - lastSessionExpiredAt < 3000) {
    return; // Throttle duplicate logout actions
  }
  lastSessionExpiredAt = now;

  // 1. Clear local storage
  clearAuthSession();
  try {
    sessionStorage.setItem('atelier_session_expired', message);
  } catch {
    // Ignore
  }

  // 2. Broadcast logout to other tabs
  broadcastAuthLogout();

  // 3. Best-effort logout API call
  try {
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    }).catch(() => undefined);
  } catch {
    // Ignore
  }

  // 4. Show toast notification
  try {
    useToastStore.getState().addToast(message, 'error', 'Phiên Đăng Nhập');
  } catch {
    // Ignore toast store issue in test environments
  }

  // 5. If on protected route (/admin or /account or /orders), redirect to /login
  if (typeof window !== 'undefined' && window.location) {
    const pathname = window.location.pathname;
    const isProtected =
      pathname.startsWith('/admin') ||
      pathname.startsWith('/account') ||
      pathname.startsWith('/orders') ||
      pathname.startsWith('/my-coupons') ||
      pathname.startsWith('/loyalty');

    if (isProtected && !pathname.startsWith('/login')) {
      const returnUrl = encodeURIComponent(pathname + window.location.search);
      // Short delay so toast is rendered before redirect
      setTimeout(() => {
        window.location.href = `/login?redirect=${returnUrl}`;
      }, 150);
    }
  }
};

/**
 * Single-Flight Refresh Token Manager
 * Any concurrent 401s or proactive refreshes will wait for the exact same promise.
 */
export const refreshAccessToken = async (): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  const currentRefreshToken = getRefreshToken();

  refreshPromise = (async () => {
    try {
      // Call modern /auth/refresh (and fall back to /auth/refreshToken)
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(currentRefreshToken ? { refreshToken: currentRefreshToken } : {}),
      });

      const data = await res.json().catch(() => null);
      const token = data?.data?.accessToken || data?.accessToken;
      const newRefreshToken = data?.data?.refreshToken || data?.refreshToken;

      if (!res.ok || !token) {
        const errCode = data?.code || (res.status === 401 ? 'REFRESH_INVALID' : 'REFRESH_FAILED');
        const errMsg = 'Phiên đăng nhập đã hết hạn';
        handleAuthSessionExpired(errMsg);
        throw new ApiError(errMsg, res.status, { ...data, code: errCode });
      }

      setAuthTokens(token, newRefreshToken || currentRefreshToken);
      return token;
    } catch (err: any) {
      if (!(err instanceof ApiError)) {
        handleAuthSessionExpired('Phiên đăng nhập đã hết hạn');
      }
      throw err;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

const isAuthBypassEndpoint = (endpoint: string): boolean => {
  return (
    endpoint.includes('/auth/login') ||
    endpoint.includes('/auth/signUp') ||
    endpoint.includes('/auth/signIn') ||
    endpoint.includes('/auth/refresh') ||
    endpoint.includes('/auth/refreshToken') ||
    endpoint.includes('/auth/logout') ||
    endpoint.includes('/auth/signOut') ||
    endpoint.includes('/auth/verify-otp') ||
    endpoint.includes('/auth/register') ||
    endpoint.includes('/auth/password') ||
    endpoint.includes('/auth/otp')
  );
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

  // 1. Proactive Refresh: check if JWT is expired or expiring within 60 seconds
  let token = getAccessToken();
  if (token && !isAuthBypassEndpoint(endpoint)) {
    if (isJwtExpired(token, 60_000)) {
      try {
        token = await refreshAccessToken();
      } catch {
        // refreshAccessToken already handled auto-logout; rethrow
        throw new ApiError('Phiên đăng nhập đã hết hạn', 401, { code: 'REFRESH_EXPIRED' });
      }
    }
  }

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

    // 2. Reactive 401 Interception: Attempt single-flight refresh once, then retry
    if (response.status === 401 && !isAuthBypassEndpoint(endpoint)) {
      try {
        const newToken = await refreshAccessToken();
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(url, { ...options, headers, credentials: 'include', signal });
        if (response.status === 401 || response.status === 403) {
          handleAuthSessionExpired('Phiên làm việc không hợp lệ');
          throw new ApiError('Phiên đăng nhập đã hết hạn', response.status);
        }
      } catch (refreshErr) {
        throw refreshErr;
      }
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
      if (response.status === 403 && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('auth:forbidden', {
            detail: { message: errorMessage || 'Bạn không có đủ quyền thực hiện hành động này' },
          })
        );
      }
      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or connectivity issue
    const timedOut = controller.signal.aborted && !options.signal?.aborted;
    throw new ApiError(
      timedOut
        ? 'Yêu cầu đã hết thời gian chờ'
        : error.message || 'Không thể kết nối đến máy chủ Backend',
      0,
      null
    );
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

  patch: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

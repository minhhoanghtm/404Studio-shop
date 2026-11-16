/**
 * ATELIER VÉRITÉ — Centralized HTTP API Client
 * Connects Frontend directly to Backend REST APIs
 * Fully handles Bearer Tokens, Refresh Tokens, and Graceful Error Handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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

// Memory token cache or fallback to localStorage
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
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

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - attempt token refresh
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newToken = refreshData?.data?.accessToken || refreshData?.accessToken;
            if (newToken) {
              setAccessToken(newToken);
              processQueue(null, newToken);
              headers.set('Authorization', `Bearer ${newToken}`);
              response = await fetch(url, { ...options, headers });
            }
          } else {
            processQueue(new Error('Refresh failed'), null);
          }
        } catch (err) {
          processQueue(err, null);
        } finally {
          isRefreshing = false;
        }
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
      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or connectivity issue
    throw new ApiError(error.message || 'Không thể kết nối đến máy chủ Backend', 0, null);
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

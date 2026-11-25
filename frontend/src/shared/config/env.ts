const normalizeBase = (raw: string): string => raw.trim().replace(/\/$/, '');

export const getApiBaseUrl = (): string => {
  const raw =
    import.meta.env.VITE_API_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    (import.meta.env.MODE === 'test' ? '/api' : '');

  const normalized = normalizeBase(String(raw || ''));
  if (!normalized) {
    throw new Error('Missing VITE_API_URL or VITE_API_BASE_URL environment variable.');
  }

  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

export const getSocketServerUrl = (): string | undefined => {
  if (import.meta.env.DEV) return undefined;
  const raw = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_BACKEND_URL || '').trim();
  return raw ? raw.replace(/\/$/, '') : undefined;
};

export const getRequestTimeoutMs = (): number => {
  const parsed = Number(import.meta.env.VITE_API_TIMEOUT_MS || 15_000);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15_000;
};

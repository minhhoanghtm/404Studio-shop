/**
 * ATELIER VÉRITÉ — Multi-tab Auth & Permission Synchronization & JWT Utilities
 */

const AUTH_CHANNEL_NAME = 'atelier_auth_channel';
const AUTH_EVENT_KEY = 'atelier_auth_event';

export const decodeJwtPayload = (token: string): any | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const getJwtExpirationMs = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return null;
  return payload.exp * 1000;
};

export const isJwtExpired = (token: string, skewMs: number = 0): boolean => {
  const exp = getJwtExpirationMs(token);
  if (!exp) return false;
  return exp - Date.now() <= skewMs;
};

let sharedChannel: BroadcastChannel | null = null;
const getBroadcastChannel = (): BroadcastChannel | null => {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return null;
  if (!sharedChannel) {
    try {
      sharedChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    } catch {
      sharedChannel = null;
    }
  }
  return sharedChannel;
};

export const broadcastAuthLogout = () => {
  try {
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: 'logout', timestamp: Date.now() });
    }
    // Also use localStorage storage event as fallback across all browsers
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        AUTH_EVENT_KEY,
        JSON.stringify({ type: 'logout', timestamp: Date.now() })
      );
    }
  } catch {
    // Ignore cross-origin / private browsing restrictions
  }
};

export const broadcastPermissionsChanged = () => {
  try {
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage({ type: 'permissions_changed', timestamp: Date.now() });
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        AUTH_EVENT_KEY,
        JSON.stringify({ type: 'permissions_changed', timestamp: Date.now() })
      );
    }
  } catch {
    // Ignore cross-origin / private browsing restrictions
  }
};

if (typeof window !== 'undefined') {
  (window as any).__ATELIER_AUTH_SYNC__ = {
    broadcastAuthLogout,
    broadcastPermissionsChanged,
  };
}

export const setupMultiTabAuthSync = (
  onLogout: () => void,
  onPermissionsChanged?: () => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const channel = getBroadcastChannel();
  const handleMessage = (event: MessageEvent) => {
    if (event.data?.type === 'logout') {
      onLogout();
    } else if (event.data?.type === 'permissions_changed') {
      onPermissionsChanged?.();
    }
  };

  if (channel) {
    channel.addEventListener('message', handleMessage);
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === AUTH_EVENT_KEY && event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        if (data?.type === 'logout') {
          onLogout();
        } else if (data?.type === 'permissions_changed') {
          onPermissionsChanged?.();
        }
      } catch {
        // Ignore JSON error
      }
    }
    if (event.key === 'atelier_patron_auth' && !event.newValue) {
      onLogout();
    }
  };

  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener('storage', handleStorage);
    if (channel) {
      channel.removeEventListener('message', handleMessage);
    }
  };
};

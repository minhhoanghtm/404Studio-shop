import { CANONICAL_POLICY_VERSION, ConsentCategories, ConsentRecord, DEFAULT_CATEGORIES } from './types';

const STORAGE_KEY = 'atelier_privacy_consent';
const ANON_ID_KEY = 'atelier_anon_id';
const ANON_TOKEN_KEY = 'atelier_anon_token';

/**
 * Generate a cryptographically strong UUID v4
 */
export function getOrCreateAnonymousId(): { anonymousId: string; anonymousToken: string } {
  if (typeof window === 'undefined') {
    return { anonymousId: '00000000-0000-0000-0000-000000000000', anonymousToken: 'anon_token_fallback' };
  }

  let anonId = localStorage.getItem(ANON_ID_KEY);
  let anonToken = localStorage.getItem(ANON_TOKEN_KEY);

  if (!anonId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      anonId = crypto.randomUUID();
    } else {
      anonId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    }
    localStorage.setItem(ANON_ID_KEY, anonId);
  }

  if (!anonToken) {
    anonToken = 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem(ANON_TOKEN_KEY, anonToken);
  }

  return { anonymousId: anonId, anonymousToken: anonToken };
}

/**
 * Retrieve current stored consent. Returns null if never consented or policy version expired.
 */
export function loadConsentRecord(): ConsentRecord | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const record: ConsentRecord = JSON.parse(raw);

    // If version is outdated, require reconsent under new privacy regulations
    if (record.policyVersion !== CANONICAL_POLICY_VERSION) {
      return null;
    }

    // Ensure necessary category is strictly immutable true
    record.categories.necessary = true;
    return record;
  } catch {
    return null;
  }
}

/**
 * Persist consent record to localStorage and synched cookie
 */
export function saveConsentRecord(record: ConsentRecord): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));

    // Also write a lightweight cookie for server-side proxy awareness (Expires in 1 year)
    const maxAge = 365 * 24 * 60 * 60;
    const cookieVal = encodeURIComponent(
      JSON.stringify({
        choice: record.choice,
        a: record.categories.analytics ? 1 : 0,
        p: record.categories.personalization ? 1 : 0,
        m: record.categories.marketing ? 1 : 0,
        v: record.policyVersion,
      })
    );
    document.cookie = `${STORAGE_KEY}=${cookieVal}; path=/; max-age=${maxAge}; SameSite=Lax; secure`;
  } catch (err) {
    console.warn('[ConsentStorage] Failed to save consent:', err);
  }
}

/**
 * Clean up all optional tracking cookies matching prefixes
 */
export function deleteCookiesByPrefixes(prefixes: string[]): void {
  if (typeof document === 'undefined') return;

  const cookies = document.cookie.split(';');
  const hostname = window.location.hostname;
  const domainParts = hostname.split('.');

  for (const cookie of cookies) {
    const cookieName = cookie.split('=')[0].trim();
    const shouldDelete = prefixes.some((p) => cookieName === p || cookieName.startsWith(p));

    if (shouldDelete) {
      // Clear for current path and root
      document.cookie = `${cookieName}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

      // Clear for parent domains
      let currDomain = '';
      for (let i = domainParts.length - 1; i >= 0; i--) {
        currDomain = '.' + domainParts[i] + currDomain;
        document.cookie = `${cookieName}=; path=/; domain=${currDomain}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    }
  }
}

/**
 * Helper to remove all analytics and marketing storage keys
 */
export function clearNonEssentialStorage(): void {
  if (typeof window === 'undefined') return;

  // Tracking cookie prefixes
  deleteCookiesByPrefixes(['_ga', '_gid', '_gat', '_fbp', '_fbc', '_ttp', '_clck', '_clsk', 'sc_analytics', 'mkt_']);

  // Clear non-essential tracking keys from sessionStorage and localStorage
  try {
    const sessionKeysToDelete: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith('track_') || k.startsWith('ga_') || k.startsWith('meta_') || k.startsWith('session_event'))) {
        sessionKeysToDelete.push(k);
      }
    }
    sessionKeysToDelete.forEach((k) => sessionStorage.removeItem(k));

    // Clear local profiling signals
    const localKeys = [
      'atelier_recent_views',
      'atelier_recent_categories',
      'atelier_recent_searches',
      'atelier_category_counts',
      'atelier_product_click_counts',
    ];
    localKeys.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

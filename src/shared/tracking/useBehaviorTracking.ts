import { trackingApi } from '../api';
import { useConsentStore } from '../consent';
import { getOrCreateAnonymousId } from '../consent/ConsentStorage';

const STORAGE_KEYS = {
  RECENT_VIEWS: 'atelier_recent_views',
  RECENT_CATEGORIES: 'atelier_recent_categories',
  RECENT_SEARCHES: 'atelier_recent_searches',
  CATEGORY_COUNTS: 'atelier_category_counts',
  PRODUCT_CLICK_COUNTS: 'atelier_product_click_counts',
  SESSION_ID: 'atelier_session_id',
};

// Generate or retrieve current browser session ID
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'sess_default';
  let sessionId = sessionStorage.getItem(STORAGE_KEYS.SESSION_ID);
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    sessionStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
  }
  return sessionId;
}

// Clear all local behavior profiling data immediately (GDPR / Law 91 compliance)
export function clearLocalBehaviorSignals(): void {
  lastEventTimestamps.clear();
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.RECENT_VIEWS);
    localStorage.removeItem(STORAGE_KEYS.RECENT_CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
    localStorage.removeItem(STORAGE_KEYS.CATEGORY_COUNTS);
    localStorage.removeItem(STORAGE_KEYS.PRODUCT_CLICK_COUNTS);
  } catch {
    // Ignore
  }
}

export interface BehaviorSignals {
  recentViewedIds: string[];
  recentCategories: string[];
  recentSearches: string[];
  frequentCategories: Record<string, number>;
  productClickCounts: Record<string, number>;
}

// Retrieve client behavior signals if personalization consent is active
export function getLocalBehaviorSignals(): BehaviorSignals {
  const empty: BehaviorSignals = {
    recentViewedIds: [],
    recentCategories: [],
    recentSearches: [],
    frequentCategories: {},
    productClickCounts: {},
  };

  if (typeof window === 'undefined') return empty;

  // Strict check: if personalization consent is not granted, return empty
  const consentRecord = useConsentStore.getState().consentRecord;
  if (!consentRecord?.categories.personalization) {
    return empty;
  }

  try {
    const views = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_VIEWS) || '[]');
    const cats = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_CATEGORIES) || '[]');
    const searches = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES) || '[]');
    const catCounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORY_COUNTS) || '{}');
    const clickCounts = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCT_CLICK_COUNTS) || '{}');

    return {
      recentViewedIds: Array.isArray(views) ? views : [],
      recentCategories: Array.isArray(cats) ? cats : [],
      recentSearches: Array.isArray(searches) ? searches : [],
      frequentCategories: typeof catCounts === 'object' && catCounts !== null ? catCounts : {},
      productClickCounts: typeof clickCounts === 'object' && clickCounts !== null ? clickCounts : {},
    };
  } catch {
    return empty;
  }
}

// Last dispatched timestamp cache to prevent duplicate flood
const lastEventTimestamps = new Map<string, number>();

export async function sendBehaviorEvent(
  eventType: string,
  data: {
    productId?: string;
    categoryId?: string;
    searchTerm?: string;
    meta?: Record<string, unknown>;
  } = {}
): Promise<void> {
  if (typeof window === 'undefined') return;

  // 1. Consent Gate: strictly drop if personalization category is not granted
  const consentRecord = useConsentStore.getState().consentRecord;
  if (!consentRecord?.categories.personalization) {
    return;
  }

  // 2. Throttle repeated clicks on the exact same product/event within 1000ms
  const dedupeKey = `${eventType}_${data.productId || ''}_${data.searchTerm || ''}`;
  const now = Date.now();
  const lastTime = lastEventTimestamps.get(dedupeKey) || 0;
  if (now - lastTime < 1000) {
    return; // Drop spam clicks
  }
  lastEventTimestamps.set(dedupeKey, now);

  const { anonymousId } = getOrCreateAnonymousId();
  const sessionId = getOrCreateSessionId();

  // 3. Update local signal caches
  try {
    if (data.productId) {
      const views: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_VIEWS) || '[]');
      const filtered = views.filter((id) => id !== data.productId);
      filtered.unshift(data.productId);
      localStorage.setItem(STORAGE_KEYS.RECENT_VIEWS, JSON.stringify(filtered.slice(0, 10)));

      if (eventType === 'product_click') {
        const clickCounts: Record<string, number> = JSON.parse(
          localStorage.getItem(STORAGE_KEYS.PRODUCT_CLICK_COUNTS) || '{}'
        );
        clickCounts[data.productId] = (clickCounts[data.productId] || 0) + 1;
        localStorage.setItem(STORAGE_KEYS.PRODUCT_CLICK_COUNTS, JSON.stringify(clickCounts));
      }
    }

    if (data.categoryId) {
      const cats: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_CATEGORIES) || '[]');
      const filtered = cats.filter((c) => c !== data.categoryId);
      filtered.unshift(data.categoryId);
      localStorage.setItem(STORAGE_KEYS.RECENT_CATEGORIES, JSON.stringify(filtered.slice(0, 5)));

      const catCounts: Record<string, number> = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.CATEGORY_COUNTS) || '{}'
      );
      catCounts[data.categoryId] = (catCounts[data.categoryId] || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.CATEGORY_COUNTS, JSON.stringify(catCounts));
    }

    if (data.searchTerm) {
      const trimmed = data.searchTerm.trim();
      if (trimmed) {
        const searches: string[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES) || '[]');
        const filtered = searches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
        filtered.unshift(trimmed);
        localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(filtered.slice(0, 10)));
      }
    }
  } catch {
    // Local storage quota or parsing error fallback
  }

  // 4. Dispatch to backend /api/events
  try {
    const payload: Record<string, unknown> = {
      event_type: eventType,
      anonymous_id: anonymousId,
      session_id: sessionId,
      source: 'frontend_client',
      context: {
        pathname: window.location.pathname,
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
      },
      meta: data.meta || {},
    };

    if (data.productId) payload.product_id = data.productId;
    if (data.categoryId) payload.category_id = data.categoryId;

    await trackingApi.trackEvent(payload).catch(() => {
      // Graceful offline fallback
    });
  } catch {
    // Non-blocking
  }
}

export function useBehaviorTracking() {
  return {
    trackProductView: (productId: string, categoryId?: string, name?: string) =>
      sendBehaviorEvent('product_view', { productId, categoryId, meta: { name } }),

    trackProductClick: (productId: string, categoryId?: string, source?: string) =>
      sendBehaviorEvent('product_click', { productId, categoryId, meta: { source } }),

    trackCategoryView: (categoryId: string) =>
      sendBehaviorEvent('category_view', { categoryId }),

    trackSearch: (query: string) =>
      sendBehaviorEvent('search_performed', { searchTerm: query }),

    trackAddToCart: (productId: string, quantity: number = 1) =>
      sendBehaviorEvent('add_to_cart', { productId, meta: { quantity } }),

    trackWishlist: (productId: string) =>
      sendBehaviorEvent('product_favorite', { productId }),

    trackRecommendationImpression: (tab: string, productIds: string[]) =>
      sendBehaviorEvent('recommendation_impression', { meta: { tab, productIds } }),

    trackRecommendationClick: (productId: string, tab: string, position: number) =>
      sendBehaviorEvent('recommendation_clicked', { productId, meta: { tab, position } }),

    getSignals: getLocalBehaviorSignals,
    clearSignals: clearLocalBehaviorSignals,
  };
}

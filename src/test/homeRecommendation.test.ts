import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  adaptBackendProduct,
  rankProductsWithSignals,
} from '../pages/Home/hooks/useHomeRecommendations';
import { PRODUCTS } from '../shared/data/products';
import { useConsentStore } from '../shared/consent';
import {
  sendBehaviorEvent,
  getLocalBehaviorSignals,
  clearLocalBehaviorSignals,
} from '../shared/tracking/useBehaviorTracking';
import { useAuthStore } from '../shared/stores/useAuthStore';

describe('Personalized Home Product Recommendations Test Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearLocalBehaviorSignals();
    useConsentStore.setState({
      consentRecord: null,
      isBannerOpen: false,
      isPreferencesOpen: false,
      isInitialized: true,
    });
  });

  // ── SCENARIO A: Recent Searches ("áo") & Frequent Clicks ("quần") ──────────
  it('Scenario A: combines recent search keywords and frequent category interactions in hybrid ranking', async () => {
    // 1. Grant personalization consent
    useConsentStore.getState().acceptAll();

    // 2. Simulate recent search for "áo"
    await sendBehaviorEvent('search_performed', { searchTerm: 'áo' });

    // 3. Simulate frequent clicks on "quần"
    await sendBehaviorEvent('category_view', { categoryId: 'quần' });
    await sendBehaviorEvent('category_view', { categoryId: 'quần' });

    const signals = getLocalBehaviorSignals();
    expect(signals.recentSearches).toContain('áo');
    expect(signals.frequentCategories['quần']).toBeGreaterThanOrEqual(1);

    // 4. Run hybrid ranker
    const ranked = rankProductsWithSignals(PRODUCTS);
    expect(ranked.length).toBeGreaterThan(0);

    // Should prioritize items matching "áo" or "quần"
    const topItem = ranked[0];
    const matchesTopQuery =
      topItem.name.toLowerCase().includes('áo') ||
      topItem.name.toLowerCase().includes('quần') ||
      topItem.subCategory.toLowerCase().includes('áo') ||
      topItem.subCategory.toLowerCase().includes('quần');
    expect(matchesTopQuery).toBe(true);
  });

  // ── SCENARIO B: User Views Dresses ("váy/đầm") & Deduplication ─────────────
  it('Scenario B: proposes dresses and related pieces without duplicating product candidates', async () => {
    useConsentStore.getState().acceptAll();

    // Simulate viewing a dress
    const dressProduct = PRODUCTS.find((p) => p.name.includes('Đầm') || p.name.includes('Váy')) || PRODUCTS[1];
    await sendBehaviorEvent('product_view', { productId: dressProduct.id, categoryId: dressProduct.category });

    const ranked = rankProductsWithSignals(PRODUCTS);

    // Check no duplicate IDs in ranked list
    const ids = ranked.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  // ── SCENARIO C: New User with Cold-Start / No Behavior ──────────────────────
  it('Scenario C: new user with no behavior gets elegant fallback with in-stock products', () => {
    // Grant consent, but zero behavior logged
    useConsentStore.getState().acceptAll();

    const signals = getLocalBehaviorSignals();
    expect(signals.recentViewedIds.length).toBe(0);
    expect(signals.recentSearches.length).toBe(0);

    const ranked = rankProductsWithSignals(PRODUCTS);
    expect(ranked.length).toBe(PRODUCTS.length);
    // Best-selling / featured / in-stock are placed first
    expect(ranked[0].variants.some((v) => v.sizes.some((s) => s.inStock))).toBe(true);
  });

  // ── SCENARIO D: User Rejects Personalization ────────────────────────────────
  it('Scenario D: strictly blocks behavioral profiling and uses non-personalized catalog when personalization rejected', async () => {
    // User chooses "Reject Optional" / "Chỉ thiết yếu"
    useConsentStore.getState().rejectOptional();

    // Attempt to log events
    await sendBehaviorEvent('product_view', { productId: 'prod-w-01' });
    await sendBehaviorEvent('search_performed', { searchTerm: 'kimono' });

    // Local signals must remain strictly empty
    const signals = getLocalBehaviorSignals();
    expect(signals.recentViewedIds.length).toBe(0);
    expect(signals.recentSearches.length).toBe(0);

    // Ranker fallback should not utilize profiling
    const ranked = rankProductsWithSignals(PRODUCTS, {
      recentWeight: 0,
      frequentWeight: 0,
      popularityWeight: 0.6,
      recencyWeight: 0.4,
    });
    expect(ranked.length).toBeGreaterThan(0);
  });

  // ── SCENARIO E: User Withdraws Consent ──────────────────────────────────────
  it('Scenario E: immediately purges behavior signals when user withdraws consent', async () => {
    useConsentStore.getState().acceptAll();

    await sendBehaviorEvent('product_view', { productId: 'prod-w-02' });
    await sendBehaviorEvent('search_performed', { searchTerm: 'cashmere' });

    expect(getLocalBehaviorSignals().recentViewedIds.length).toBe(1);

    // User withdraws personalization consent
    useConsentStore.getState().withdrawConsent('personalization');

    // Signals must be completely purged
    const signalsAfterWithdraw = getLocalBehaviorSignals();
    expect(signalsAfterWithdraw.recentViewedIds.length).toBe(0);
    expect(signalsAfterWithdraw.recentSearches.length).toBe(0);
  });

  // ── SCENARIO F: User Logs Out ──────────────────────────────────────────────
  it('Scenario F: purges account behavior signals on user logout', async () => {
    useConsentStore.getState().acceptAll();
    useAuthStore.setState({ isAuthenticated: true, user: { id: 'usr_test', email: 'test@atelier.com', name: 'Test', vipTier: 'Gold', addresses: [] } });

    await sendBehaviorEvent('product_view', { productId: 'prod-m-01' });
    expect(getLocalBehaviorSignals().recentViewedIds).toContain('prod-m-01');

    // Logout
    useAuthStore.getState().logout();

    // Verify signals cleared
    expect(getLocalBehaviorSignals().recentViewedIds.length).toBe(0);
  });

  // ── SCENARIO G: In-Stock Prioritization ────────────────────────────────────
  it('Scenario G: prioritizes in-stock items over out-of-stock items in ranking', () => {
    const mockPool: typeof PRODUCTS = [
      {
        ...PRODUCTS[0],
        id: 'out-of-stock-item',
        name: 'Áo Hết Hàng Hoàn Toàn',
        variants: [{ id: 'v1', colorName: 'Đen', colorHex: '#000', sizes: [{ size: 'M', inStock: false, stockCount: 0 }], images: [] }],
      },
      {
        ...PRODUCTS[1],
        id: 'in-stock-item',
        name: 'Áo Còn Hàng Sẵn Có',
        variants: [{ id: 'v2', colorName: 'Trắng', colorHex: '#fff', sizes: [{ size: 'M', inStock: true, stockCount: 10 }], images: [] }],
      },
    ];

    const ranked = rankProductsWithSignals(mockPool);
    expect(ranked[0].id).toBe('in-stock-item');
  });

  // ── SCENARIO H: Backend Adapter Resiliency ──────────────────────────────────
  it('Scenario H: adaptBackendProduct safely handles sparse, missing, or raw backend responses', () => {
    const sparseRaw = {
      _id: 'mongo_12345',
      name: 'Áo Lụa Mỏng',
      price: 12000000,
      stock: 4,
    };

    const adapted = adaptBackendProduct(sparseRaw);
    expect(adapted.id).toBe('mongo_12345');
    expect(adapted.name).toBe('Áo Lụa Mỏng');
    expect(adapted.price).toBe(12000000);
    expect(adapted.featuredImage).toBeDefined();
    expect(adapted.variants.length).toBeGreaterThan(0);
    expect(adapted.variants[0].sizes.length).toBeGreaterThan(0);
    expect(adapted.inStock).toBe(true);
  });

  // ── SCENARIO I: Click Debouncing & Rate Limiting ────────────────────────────
  it('Scenario I: drops rapid repeated clicks on the same product within 1 second', async () => {
    useConsentStore.getState().acceptAll();

    // Send 3 immediate rapid clicks
    await sendBehaviorEvent('product_click', { productId: 'prod-w-03' });
    await sendBehaviorEvent('product_click', { productId: 'prod-w-03' });
    await sendBehaviorEvent('product_click', { productId: 'prod-w-03' });

    const signals = getLocalBehaviorSignals();
    // Only 1 event registered due to 1000ms debounce
    expect(signals.productClickCounts['prod-w-03']).toBe(1);
  });
});

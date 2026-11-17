import { useState, useEffect, useRef, useCallback } from 'react';
import { Product, ProductVariant } from '../../../shared/types';
import { PRODUCTS } from '../../../shared/data/products';
import { recommendationsApi, productsApi } from '../../../shared/api';
import { useConsentStore } from '../../../shared/consent';
import { getOrCreateAnonymousId } from '../../../shared/consent/ConsentStorage';
import { getLocalBehaviorSignals, clearLocalBehaviorSignals } from '../../../shared/tracking/useBehaviorTracking';
import { useAuthStore } from '../../../shared/stores/useAuthStore';

export type RecommendationTab = 'for-you' | 'trending' | 'new-arrivals' | 'best-sellers';

export interface RecommendationState {
  tab: RecommendationTab;
  products: Product[];
  mode: 'personalized' | 'popular' | 'fallback';
  algorithm: string;
  loading: boolean;
  error: string | null;
  hasPersonalizationConsent: boolean;
  totalCount: number;
}

// In-memory cache with 3-minute TTL
interface CacheEntry {
  products: Product[];
  mode: 'personalized' | 'popular' | 'fallback';
  algorithm: string;
  timestamp: number;
}
const recommendationCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3 * 60 * 1000;

// Transform backend product payload into full frontend Product type
export function adaptBackendProduct(raw: any): Product {
  const id = String(raw.id || raw._id || `p_${Math.random().toString(36).substring(2, 9)}`);
  const name = String(raw.name || 'Tác phẩm Haute Couture Atelier');
  const slug = String(raw.slug || id);
  const price = Number(raw.price || raw.new_price || 15000000);
  const originalPrice = raw.old_price || raw.oldPrice ? Number(raw.old_price || raw.oldPrice) : undefined;

  const displayImages: string[] = Array.isArray(raw.displayProduct) && raw.displayProduct.length > 0
    ? raw.displayProduct
    : raw.image
    ? [raw.image]
    : [
        'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=85',
        'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
      ];

  // Variants normalization
  let variants: ProductVariant[] = [];
  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    variants = raw.variants.map((v: any, vIdx: number) => ({
      id: String(v._id || v.id || `var_${id}_${vIdx}`),
      colorName: String(v.colorName || v.color || 'Đen Mã Não (Onyx)'),
      colorHex: String(v.colorHex || '#141416'),
      sizes: Array.isArray(v.sizes)
        ? v.sizes.map((s: any) => ({
            size: String(s.size || s),
            inStock: s.inStock !== false && (s.stockCount === undefined || s.stockCount > 0),
            stockCount: typeof s.stockCount === 'number' ? s.stockCount : 5,
          }))
        : [
            { size: '36 FR (S)', inStock: true, stockCount: 4 },
            { size: '38 FR (M)', inStock: true, stockCount: 6 },
            { size: '40 FR (L)', inStock: true, stockCount: 2 },
          ],
      images: Array.isArray(v.images) && v.images.length > 0 ? v.images : displayImages,
    }));
  } else {
    // Default fallback variant
    variants = [
      {
        id: `var_${id}_def`,
        colorName: 'Đen Mã Não (Onyx)',
        colorHex: '#121215',
        sizes: [
          { size: '36 FR (S)', inStock: true, stockCount: 4 },
          { size: '38 FR (M)', inStock: true, stockCount: 6 },
          { size: '40 FR (L)', inStock: true, stockCount: 3 },
        ],
        images: displayImages,
      },
    ];
  }

  // Derive category
  const rawCat = String(raw.category || raw.category_id?.name || '').toLowerCase();
  let category: Product['category'] = 'women';
  if (rawCat.includes('men') || rawCat.includes('nam')) category = 'men';
  else if (rawCat.includes('access') || rawCat.includes('phụ kiện') || rawCat.includes('da')) category = 'accessories';
  else if (rawCat.includes('couture') || rawCat.includes('dạ')) category = 'couture';

  return {
    id,
    slug,
    name,
    subtitle: raw.subtitle || 'Thiết kế độc quyền từ Maison Vérité Paris',
    price,
    originalPrice,
    category,
    subCategory: raw.subCategory || 'Ấn bản cao cấp',
    badge: raw.badge || (raw.sold && raw.sold > 20 ? 'Bán chạy nhất' : raw.isNewArrival ? 'Mùa mới' : 'Runway FW26'),
    description: raw.description || 'Chế tác từ chất liệu thượng hạng với các đường cắt kiến trúc tỉ mỉ.',
    details: Array.isArray(raw.details) ? raw.details : ['Đường cắt xéo tinh tế', 'Chất liệu lụa hoặc len nguyên chất', 'Gia công thủ công'],
    composition: raw.composition || '100% Sợi cao cấp tự nhiên',
    origin: raw.origin || 'Chế tác thủ công tại Paris, Pháp',
    careInstructions: raw.careInstructions || ['Chỉ giặt khô chuyên biệt'],
    variants,
    featuredImage: displayImages[0],
    galleryImages: displayImages,
    isFeatured: Boolean(raw.isFeatured || raw.is_featured),
    isNewArrival: Boolean(raw.isNewArrival),
    isTrending: Boolean(raw.isTrending || (raw.sold && raw.sold > 15)),
    inStock: raw.stock !== undefined ? raw.stock > 0 : true,
    rating: typeof raw.rating === 'number' ? raw.rating : 5,
    reviewCount: typeof raw.reviewCount === 'number' ? raw.reviewCount : (typeof raw.reviewsCount === 'number' ? raw.reviewsCount : 0),
  };
}

// Client-side Hybrid Ranking algorithm with configurable weights
export function rankProductsWithSignals(
  candidatePool: Product[],
  options: {
    recentWeight?: number;
    frequentWeight?: number;
    popularityWeight?: number;
    recencyWeight?: number;
  } = {}
): Product[] {
  const {
    recentWeight = 0.35,
    frequentWeight = 0.25,
    popularityWeight = 0.20,
    recencyWeight = 0.10,
  } = options;

  const signals = getLocalBehaviorSignals();
  const recentViewedSet = new Set(signals.recentViewedIds);
  const recentCategoriesSet = new Set(signals.recentCategories.map((c) => c.toLowerCase()));
  const recentSearches = signals.recentSearches.map((s) => s.toLowerCase());

  // Score each candidate
  const scored = candidatePool.map((product) => {
    let score = 0;

    // 1. Recent behavior (35%): recent view or category visit or search keyword match
    if (recentViewedSet.has(product.id)) {
      score += recentWeight * 0.8;
    }
    if (recentCategoriesSet.has(product.category.toLowerCase()) || recentCategoriesSet.has(product.subCategory.toLowerCase())) {
      score += recentWeight * 1.0;
    }
    const nameLower = product.name.toLowerCase();
    for (const term of recentSearches) {
      if (term && (nameLower.includes(term) || product.description.toLowerCase().includes(term))) {
        score += recentWeight * 1.2;
        break;
      }
    }

    // 2. Frequent behavior (25%): category click counts
    const catFrequency = signals.frequentCategories[product.category] || signals.frequentCategories[product.subCategory] || 0;
    if (catFrequency > 0) {
      score += frequentWeight * Math.min(catFrequency / 5, 1.0);
    }
    const productClicks = signals.productClickCounts[product.id] || 0;
    if (productClicks > 0) {
      score += frequentWeight * Math.min(productClicks / 4, 1.0);
    }

    // 3. Popularity / best-selling (20%): isFeatured or high rating
    if (product.isFeatured) {
      score += popularityWeight * 0.9;
    }
    if (product.badge?.includes('Bán chạy')) {
      score += popularityWeight * 1.0;
    }

    // 4. New arrivals (10%): isNewArrival
    if (product.isNewArrival) {
      score += recencyWeight * 1.0;
    }

    return { product, score };
  });

  // Sort descending by score, prioritizing in-stock items
  scored.sort((a, b) => {
    // Put in-stock first
    const aStock = a.product.variants.some((v) => v.sizes.some((s) => s.inStock)) ? 1 : 0;
    const bStock = b.product.variants.some((v) => v.sizes.some((s) => s.inStock)) ? 1 : 0;
    if (aStock !== bStock) return bStock - aStock;

    // Score sort
    if (b.score !== a.score) return b.score - a.score;

    // Stable fallback
    return a.product.name.localeCompare(b.product.name);
  });

  // Ensure diversity: do not allow all top items to be exclusively of one subCategory if pool has variety
  const diversified: Product[] = [];
  const subCategoryCounts = new Map<string, number>();

  for (const item of scored) {
    const sub = item.product.subCategory;
    const count = subCategoryCounts.get(sub) || 0;
    if (count < 3 || diversified.length >= scored.length - 2) {
      diversified.push(item.product);
      subCategoryCounts.set(sub, count + 1);
    }
  }

  // Backfill if needed
  if (diversified.length < scored.length) {
    for (const item of scored) {
      if (!diversified.some((p) => p.id === item.product.id)) {
        diversified.push(item.product);
      }
    }
  }

  return diversified;
}

export function useHomeRecommendations(initialTab: RecommendationTab = 'for-you') {
  const [tab, setTab] = useState<RecommendationTab>(initialTab);
  const [products, setProducts] = useState<Product[]>([]);
  const [mode, setMode] = useState<'personalized' | 'popular' | 'fallback'>('fallback');
  const [algorithm, setAlgorithm] = useState<string>('hybrid_ai_v1');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const consentRecord = useConsentStore((state) => state.consentRecord);
  const hasPersonalizationConsent = Boolean(consentRecord?.categories.personalization);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Active abort controller for request deduplication
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clear cache when consent state changes or on logout
  useEffect(() => {
    recommendationCache.clear();
  }, [hasPersonalizationConsent, isAuthenticated]);

  const fetchTabProducts = useCallback(async (currentTab: RecommendationTab) => {
    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const { anonymousId } = getOrCreateAnonymousId();
    const cacheKey = `tab_${currentTab}_consent_${hasPersonalizationConsent ? '1' : '0'}_auth_${isAuthenticated ? '1' : '0'}`;

    // Check memory cache
    const cached = recommendationCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      setProducts(cached.products);
      setMode(cached.mode);
      setAlgorithm(cached.algorithm);
      setLoading(false);
      return;
    }

    try {
      if (currentTab === 'for-you') {
        // Tab 1: "Dành riêng cho quý khách"
        if (!hasPersonalizationConsent) {
          // Without consent: strictly fallback to popular/curated collection
          const popularList = rankProductsWithSignals(PRODUCTS, {
            recentWeight: 0,
            frequentWeight: 0,
            popularityWeight: 0.6,
            recencyWeight: 0.4,
          }).slice(0, 8);

          setProducts(popularList);
          setMode('popular');
          setAlgorithm('unconsented_curated_v1');
          recommendationCache.set(cacheKey, {
            products: popularList,
            mode: 'popular',
            algorithm: 'unconsented_curated_v1',
            timestamp: Date.now(),
          });
        } else {
          // With consent: call backend recommendation API
          try {
            const res = await recommendationsApi.getRecommendations({
              limit: 8,
              anonymousId,
            });

            if (controller.signal.aborted) return;

            const recData = res.data || (res as any);
            const rawList = recData?.products || [];

            if (Array.isArray(rawList) && rawList.length > 0) {
              const adapted = rawList.map(adaptBackendProduct);
              const finalMode = recData.mode === 'personalized' ? 'personalized' : 'popular';
              setProducts(adapted);
              setMode(finalMode);
              setAlgorithm(recData.algorithm || 'backend_hybrid_v1');

              recommendationCache.set(cacheKey, {
                products: adapted,
                mode: finalMode,
                algorithm: recData.algorithm || 'backend_hybrid_v1',
                timestamp: Date.now(),
              });
            } else {
              // Fallback to client hybrid ranking with local signals
              const ranked = rankProductsWithSignals(PRODUCTS).slice(0, 8);
              setProducts(ranked);
              setMode('personalized');
              setAlgorithm('client_signals_hybrid_v1');
              recommendationCache.set(cacheKey, {
                products: ranked,
                mode: 'personalized',
                algorithm: 'client_signals_hybrid_v1',
                timestamp: Date.now(),
              });
            }
          } catch {
            if (controller.signal.aborted) return;
            // Safe fallback on network failure
            const ranked = rankProductsWithSignals(PRODUCTS).slice(0, 8);
            setProducts(ranked);
            setMode('fallback');
            setAlgorithm('offline_hybrid_fallback');
          }
        }
      } else if (currentTab === 'trending') {
        // Tab 2: "Kiểu dáng thịnh hành"
        try {
          const res = await productsApi.getProducts({ sort: 'rating', limit: 8 });
          if (controller.signal.aborted) return;
          const raw = res.data || (res as any);
          if (Array.isArray(raw) && raw.length > 0) {
            const adapted = raw.map(adaptBackendProduct);
            setProducts(adapted);
          } else {
            const trending = PRODUCTS.filter((p) => p.isTrending || p.isFeatured).slice(0, 8);
            setProducts(trending.length > 0 ? trending : PRODUCTS.slice(0, 8));
          }
        } catch {
          if (controller.signal.aborted) return;
          const trending = PRODUCTS.filter((p) => p.isTrending || p.isFeatured).slice(0, 8);
          setProducts(trending.length > 0 ? trending : PRODUCTS.slice(0, 8));
        }
        setMode('popular');
        setAlgorithm('trending_curation');
      } else if (currentTab === 'new-arrivals') {
        // Tab 3: "Tác phẩm mới ra mắt"
        try {
          const res = await productsApi.getProducts({ sort: 'newest', limit: 8 });
          if (controller.signal.aborted) return;
          const raw = res.data || (res as any);
          if (Array.isArray(raw) && raw.length > 0) {
            const adapted = raw.map(adaptBackendProduct);
            setProducts(adapted);
          } else {
            const newest = PRODUCTS.filter((p) => p.isNewArrival).slice(0, 8);
            setProducts(newest.length > 0 ? newest : PRODUCTS.slice(0, 8));
          }
        } catch {
          if (controller.signal.aborted) return;
          const newest = PRODUCTS.filter((p) => p.isNewArrival).slice(0, 8);
          setProducts(newest.length > 0 ? newest : PRODUCTS.slice(0, 8));
        }
        setMode('popular');
        setAlgorithm('new_arrivals_feed');
      } else if (currentTab === 'best-sellers') {
        // Tab 4: "Bán chạy nhất"
        try {
          const res = await productsApi.getProducts({ sort: 'curated', limit: 8 });
          if (controller.signal.aborted) return;
          const raw = res.data || (res as any);
          if (Array.isArray(raw) && raw.length > 0) {
            const adapted = raw.map(adaptBackendProduct);
            setProducts(adapted);
          } else {
            const best = PRODUCTS.filter((p) => p.badge?.includes('Bán chạy') || p.price > 40000000).slice(0, 8);
            setProducts(best.length > 0 ? best : PRODUCTS.slice(0, 8));
          }
        } catch {
          if (controller.signal.aborted) return;
          const best = PRODUCTS.filter((p) => p.badge?.includes('Bán chạy') || p.price > 40000000).slice(0, 8);
          setProducts(best.length > 0 ? best : PRODUCTS.slice(0, 8));
        }
        setMode('popular');
        setAlgorithm('best_sellers_feed');
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      setError(err?.message || 'Không thể tải danh sách tác phẩm.');
      setProducts(PRODUCTS.slice(0, 8));
      setMode('fallback');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [hasPersonalizationConsent, isAuthenticated]);

  useEffect(() => {
    fetchTabProducts(tab);
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [tab, fetchTabProducts]);

  return {
    tab,
    setTab,
    products,
    mode,
    algorithm,
    loading,
    error,
    hasPersonalizationConsent,
    totalCount: products.length,
    refresh: () => {
      recommendationCache.clear();
      fetchTabProducts(tab);
    },
    clearCache: () => {
      recommendationCache.clear();
      clearLocalBehaviorSignals();
    },
  };
}

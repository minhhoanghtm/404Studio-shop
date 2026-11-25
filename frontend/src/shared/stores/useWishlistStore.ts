import { create } from 'zustand';
import { Product } from '../types';
import { favoritesApi } from '../api';
import { getAccessToken } from '../api/client';
import { adaptBackendProduct } from '../utils/productAdapter';
import { useToastStore } from './useToastStore';

interface WishlistState {
  items: Product[];
  isSyncing: boolean;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (productId: string) => boolean;
  removeItem: (productId: string) => void;
  clearWishlist: () => void;
  refreshWishlist: () => Promise<void>;
}
const storageKey = 'atelier_wishlist';
const customerScope = (): string | null => {
  if (typeof window === 'undefined' || !getAccessToken()) return null;
  try {
    const user = JSON.parse(localStorage.getItem('atelier_patron_auth') || '{}')?.state?.user;
    const id = String(user?.id || user?._id || '');
    return user?.role !== 'admin' && /^[a-f\d]{24}$/i.test(id) ? id : null;
  } catch { return null; }
};
const keyFor = (scope: string | null) => scope ? storageKey + ':user:' + scope : storageKey;
const load = (scope: string | null): Product[] => {
  try { const value = JSON.parse(localStorage.getItem(keyFor(scope)) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
};
const save = (scope: string | null, items: Product[]) => { try { localStorage.setItem(keyFor(scope), JSON.stringify(items)); } catch { /* storage unavailable */ } };
const fromServer = (entries: any[]): Product[] => entries.filter((entry) => entry?.product_id?._id).map((entry) => {
  const raw = entry.product_id;
  const product = adaptBackendProduct(raw);
  if (!Array.isArray(raw.displayProduct) || raw.displayProduct.length === 0) { product.featuredImage = ''; product.galleryImages = []; }
  // Do not expose synthesized sizes when the server returned no variants.
  if (!Array.isArray(raw.variants) || raw.variants.length === 0) { product.variants = []; product.inStock = Number(raw.stock) > 0; }
  return product;
});
let activeScope = customerScope();
let revision = 0;
let pending: Promise<void> = Promise.resolve();
const enqueue = (operation: () => Promise<void>) => { pending = pending.then(operation, operation); };
const failure = () => useToastStore.getState().addToast('Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.', 'error');

export const useWishlistStore = create<WishlistState>((set, get) => {
  const apply = (scope: string | null, items: Product[]) => { if (scope === customerScope()) { save(scope, items); set({ items }); } };
  const ensureScope = (scope: string | null) => { if (scope !== activeScope) { activeScope = scope; revision++; set({ items: load(scope), isSyncing: Boolean(scope) }); } };
  return {
    items: load(activeScope),
    isSyncing: Boolean(activeScope),
    isInWishlist: (productId) => get().items.some((item) => item.id === productId),
    refreshWishlist: async () => {
      const scope = customerScope();
      ensureScope(scope);
      if (!scope) return;
      const current = ++revision;
      set({ isSyncing: true });
      try {
        const response = await favoritesApi.getFavorites();
        if (scope === customerScope() && current === revision) apply(scope, fromServer(response.data || []));
      } catch { if (scope === customerScope() && current === revision) failure(); }
      finally { if (scope === customerScope() && current === revision) set({ isSyncing: false }); }
    },
    toggleWishlist: (product) => {
      const scope = customerScope();
      ensureScope(scope);
      if (scope && get().isSyncing) return;
      if (!scope) {
        const exists = get().items.some((item) => item.id === product.id);
        apply(null, exists ? get().items.filter((item) => item.id !== product.id) : [...get().items, product]);
        useToastStore.getState().addToast(exists ? 'Đã bỏ khỏi danh sách yêu thích' : 'Đã lưu vào danh sách yêu thích', exists ? 'info' : 'success');
        return;
      }
      revision++;
      set({ isSyncing: true });
      enqueue(async () => {
        if (scope !== customerScope()) return;
        try {
          const exists = get().items.some((item) => item.id === product.id);
          const response = exists ? await favoritesApi.removeFavorite(product.id) : await favoritesApi.addFavorite(product.id);
          if (scope !== customerScope()) return;
          revision++;
          apply(scope, fromServer(response.data || []));
          useToastStore.getState().addToast(exists ? 'Đã bỏ khỏi danh sách yêu thích' : 'Đã lưu vào danh sách yêu thích', exists ? 'info' : 'success');
        } catch { if (scope === customerScope()) failure(); }
        finally { if (scope === customerScope()) set({ isSyncing: false }); }
      });
    },
    removeItem: (productId) => {
      const scope = customerScope();
      ensureScope(scope);
      if (scope && get().isSyncing) return;
      if (!scope) { apply(null, get().items.filter((item) => item.id !== productId)); return; }
      revision++;
      set({ isSyncing: true });
      enqueue(async () => { if (scope !== customerScope()) return; try { const response = await favoritesApi.removeFavorite(productId); if (scope === customerScope()) { revision++; apply(scope, fromServer(response.data || [])); } } catch { if (scope === customerScope()) failure(); } finally { if (scope === customerScope()) set({ isSyncing: false }); } });
    },
    clearWishlist: () => {
      const scope = customerScope();
      ensureScope(scope);
      if (scope && get().isSyncing) return;
      if (!scope) { apply(null, []); return; }
      revision++;
      set({ isSyncing: true });
      enqueue(async () => { if (scope !== customerScope()) return; try { await favoritesApi.clearFavorites(); if (scope === customerScope()) { revision++; apply(scope, []); } } catch { if (scope === customerScope()) failure(); } finally { if (scope === customerScope()) set({ isSyncing: false }); } });
    },
  };
});

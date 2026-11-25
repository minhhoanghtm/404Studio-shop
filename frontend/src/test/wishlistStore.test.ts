import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWishlistStore } from '@/shared/stores/useWishlistStore';
import { favoritesApi } from '@/shared/api';
import { PRODUCTS } from '@/shared/data/products';

describe('useWishlistStore', () => {
  beforeEach(() => {
    useWishlistStore.getState().clearWishlist();
  });

  it('should toggle an item into wishlist', () => {
    const product = PRODUCTS[0];
    const { toggleWishlist, isInWishlist } = useWishlistStore.getState();

    expect(isInWishlist(product.id)).toBe(false);

    toggleWishlist(product);
    expect(useWishlistStore.getState().isInWishlist(product.id)).toBe(true);
    expect(useWishlistStore.getState().items.length).toBe(1);

    toggleWishlist(product);
    expect(useWishlistStore.getState().isInWishlist(product.id)).toBe(false);
    expect(useWishlistStore.getState().items.length).toBe(0);
  });

  it('should remove specific item by id', () => {
    const { toggleWishlist, removeItem } = useWishlistStore.getState();
    toggleWishlist(PRODUCTS[0]);
    toggleWishlist(PRODUCTS[1]);

    expect(useWishlistStore.getState().items.length).toBe(2);
    removeItem(PRODUCTS[0].id);

    expect(useWishlistStore.getState().items.length).toBe(1);
    expect(useWishlistStore.getState().isInWishlist(PRODUCTS[0].id)).toBe(false);
  });

  it('does not fabricate images or variants for server favorites missing them', async () => {
    const id = '0123456789abcdef01234567';
    localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: 'test-only', user: { id, role: 'user' } } }));
    const api = vi.spyOn(favoritesApi, 'getFavorites').mockResolvedValue({ success: true, data: [{ product_id: { _id: id, name: 'No image', slug: 'no-image', displayProduct: [], variants: [], stock: 2 } }] } as any);
    try {
      await useWishlistStore.getState().refreshWishlist();
      expect(useWishlistStore.getState().items[0].featuredImage).toBe('');
      expect(useWishlistStore.getState().items[0].variants).toEqual([]);
      expect(useWishlistStore.getState().items[0].inStock).toBe(true);
    } finally {
      api.mockRestore(); localStorage.removeItem('atelier_patron_auth');
      await useWishlistStore.getState().refreshWishlist();
    }
  });

  it('blocks wishlist mutations while the account list is still loading', async () => {
    const id = '0123456789abcdef01234567';
    localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: 'test-only', user: { id, role: 'user' } } }));
    let finish!: (value: any) => void;
    const api = vi.spyOn(favoritesApi, 'getFavorites').mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
    try {
      const loading = useWishlistStore.getState().refreshWishlist();
      expect(useWishlistStore.getState().isSyncing).toBe(true);
      useWishlistStore.getState().toggleWishlist(PRODUCTS[0]);
      expect(useWishlistStore.getState().items.some((item) => item.id === PRODUCTS[0].id)).toBe(false);
      finish({ success: true, data: [] }); await loading;
      expect(useWishlistStore.getState().isSyncing).toBe(false);
    } finally {
      api.mockRestore(); localStorage.removeItem('atelier_patron_auth');
      await useWishlistStore.getState().refreshWishlist();
    }
  });
});

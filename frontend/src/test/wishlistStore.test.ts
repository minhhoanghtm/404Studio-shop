import { describe, it, expect, beforeEach } from 'vitest';
import { useWishlistStore } from '@/shared/stores/useWishlistStore';
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
});

import { describe, it, expect } from 'vitest';
import { PRODUCTS } from '@/shared/data/products';
import { COLLECTIONS } from '@/shared/data/collections';

describe('Catalog Data Integrity', () => {
  it('should have valid products with mandatory fields', () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(10);

    PRODUCTS.forEach((product) => {
      expect(product.id).toBeDefined();
      expect(product.slug).toBeDefined();
      expect(product.name).toBeDefined();
      expect(product.price).toBeGreaterThan(0);
      expect(product.category).toMatch(/^(men|women|accessories|couture)$/);
      expect(product.variants.length).toBeGreaterThan(0);
      expect(product.featuredImage).toBeTruthy();
      expect(product.description).toBeTruthy();
      expect(product.composition).toBeTruthy();
      expect(product.origin).toBeTruthy();

      // Check variant integrity
      product.variants.forEach((v) => {
        expect(v.id).toBeDefined();
        expect(v.colorName).toBeDefined();
        expect(v.colorHex).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(v.sizes.length).toBeGreaterThan(0);
      });
    });
  });

  it('should have valid runway collections', () => {
    expect(COLLECTIONS.length).toBeGreaterThanOrEqual(4);

    COLLECTIONS.forEach((col) => {
      expect(col.id).toBeDefined();
      expect(col.slug).toBeDefined();
      expect(col.title).toBeDefined();
      expect(col.heroImage).toBeTruthy();
      expect(col.lookbookImages.length).toBeGreaterThan(0);
    });
  });
});

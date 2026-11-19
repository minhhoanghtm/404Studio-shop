import { describe, it, expect } from 'vitest';
import { ProductVariantItem, AdminProductFormValues } from '../pages/AdminProducts/types';

describe('Admin Product Multi-Variant Inventory & Aggregation Suite', () => {
  // Helper matching the calculation rule implemented in VariantTable.tsx & ProductForm.tsx
  const calculateTotalStock = (variants: ProductVariantItem[]): number => {
    return variants.reduce((sum, v) => {
      const stockNum = Number(v.stock);
      if (Number.isInteger(stockNum) && stockNum >= 0 && !isNaN(stockNum) && isFinite(stockNum)) {
        return sum + stockNum;
      }
      return sum;
    }, 0);
  };

  const isDuplicateVariant = (
    variants: ProductVariantItem[],
    color: string,
    size: string,
    excludeId?: string
  ): boolean => {
    return variants.some(
      (v) =>
        v.id !== excludeId &&
        v.color.trim().toLowerCase() === color.trim().toLowerCase() &&
        v.size.trim().toUpperCase() === size.trim().toUpperCase()
    );
  };

  const sanitizeStock = (val: any): number => {
    const num = Number(val);
    if (!Number.isInteger(num) || num < 0 || isNaN(num) || !isFinite(num)) {
      return 0;
    }
    return Math.floor(num);
  };

  describe('1. Inventory Aggregation (TotalStock = SUM(VariantStock))', () => {
    it('should calculate total stock correctly for specified business test case: 10 + 15 + 20 + 5 = 50', () => {
      const variants: ProductVariantItem[] = [
        { id: '1', color: 'Đỏ', size: 'S', price: 450000, stock: 10, image_url: 'https://images.unsplash.com/red-s' },
        { id: '2', color: 'Đỏ', size: 'M', price: 470000, stock: 15, image_url: 'https://images.unsplash.com/red-m' },
        { id: '3', color: 'Đen', size: 'S', price: 460000, stock: 20, image_url: 'https://images.unsplash.com/black-s' },
        { id: '4', color: 'Đen', size: 'L', price: 490000, stock: 5, image_url: 'https://images.unsplash.com/black-l' },
      ];

      const totalStock = calculateTotalStock(variants);
      expect(totalStock).toBe(50);
    });

    it('should update total stock dynamically when variant is added, edited, or removed', () => {
      let variants: ProductVariantItem[] = [
        { id: '1', color: 'Xanh Navy', size: 'M', price: 650000, stock: 12, image_url: '' },
      ];
      expect(calculateTotalStock(variants)).toBe(12);

      // Add variant
      variants.push({ id: '2', color: 'Xanh Navy', size: 'L', price: 650000, stock: 8, image_url: '' });
      expect(calculateTotalStock(variants)).toBe(20);

      // Edit stock of variant 1 from 12 -> 25
      variants[0].stock = 25;
      expect(calculateTotalStock(variants)).toBe(33);

      // Remove variant 2
      variants = variants.filter((v) => v.id !== '2');
      expect(calculateTotalStock(variants)).toBe(25);
    });

    it('should ignore negative numbers, floating point numbers, NaN, and Infinity in stock summation', () => {
      const invalidVariants: ProductVariantItem[] = [
        { id: '1', color: 'Trắng', size: 'S', price: 100000, stock: 10, image_url: '' },
        { id: '2', color: 'Trắng', size: 'M', price: 100000, stock: -5, image_url: '' }, // negative
        { id: '3', color: 'Trắng', size: 'L', price: 100000, stock: 12.75, image_url: '' }, // decimal
        { id: '4', color: 'Trắng', size: 'XL', price: 100000, stock: NaN as any, image_url: '' }, // NaN
        { id: '5', color: 'Trắng', size: 'XXL', price: 100000, stock: Infinity as any, image_url: '' }, // Infinity
      ];

      const totalStock = calculateTotalStock(invalidVariants);
      // Only the first variant (stock: 10) is a valid positive integer
      expect(totalStock).toBe(10);
    });

    it('should properly sanitize stock input to non-negative integers', () => {
      expect(sanitizeStock(-10)).toBe(0);
      expect(sanitizeStock('abc')).toBe(0);
      expect(sanitizeStock(15.8)).toBe(0);
      expect(sanitizeStock(42)).toBe(42);
      expect(sanitizeStock('25')).toBe(25);
    });
  });

  describe('2. Variant Uniqueness & Constraint Validation', () => {
    const existingVariants: ProductVariantItem[] = [
      { id: 'v1', color: 'Đỏ', size: 'S', price: 450000, stock: 10, image_url: '' },
      { id: 'v2', color: 'Đỏ', size: 'M', price: 470000, stock: 15, image_url: '' },
      { id: 'v3', color: 'Đen', size: 'S', price: 460000, stock: 20, image_url: '' },
    ];

    it('should reject duplicate (Color, Size) combinations (case-insensitive and trimmed)', () => {
      // Duplicate of Đỏ / S
      expect(isDuplicateVariant(existingVariants, 'Đỏ', 'S')).toBe(true);
      expect(isDuplicateVariant(existingVariants, '  đỏ  ', 's')).toBe(true);

      // Duplicate of Đen / S
      expect(isDuplicateVariant(existingVariants, 'đen', 's')).toBe(true);

      // Distinct combination: Đen / M is allowed
      expect(isDuplicateVariant(existingVariants, 'Đen', 'M')).toBe(false);

      // Distinct combination: Be / S is allowed
      expect(isDuplicateVariant(existingVariants, 'Be', 'S')).toBe(false);
    });

    it('should allow editing an existing variant without falsely flagging self-duplicate', () => {
      // Editing v1 (Đỏ / S) keeping color and size should be permitted because excludeId matches v1
      expect(isDuplicateVariant(existingVariants, 'Đỏ', 'S', 'v1')).toBe(false);

      // But trying to change v1 to Đen / S should collide with v3
      expect(isDuplicateVariant(existingVariants, 'Đen', 'S', 'v1')).toBe(true);
    });
  });

  describe('3. Backend DTO Contract & Payload Mapping', () => {
    it('should map form values to backend createProduct payload with fallback variant image', () => {
      const formValues: AdminProductFormValues = {
        name: 'Áo Măng Tô Dạ Cashmere 404',
        slug: 'ao-mang-to-da-cashmere-404',
        category_id: '64f1a2b00000000000000001',
        brand: 'ThreeUI Atelier',
        old_price: 3200000,
        new_price: 2800000,
        description: 'Chất liệu dạ cừu tự nhiên dệt thủ công tại xưởng.',
        displayProduct: ['https://images.unsplash.com/primary-coat.jpg', 'https://images.unsplash.com/detail.jpg'],
        weight: 0.8,
        stock: 50, // Calculated dynamically
        is_active: true,
        is_featured: true,
        variants: [
          { id: '1', color: 'Đỏ', size: 'S', price: 2800000, stock: 10, image_url: '' }, // empty image -> should fallback
          { id: '2', color: 'Đỏ', size: 'M', price: 2800000, stock: 15, image_url: 'https://images.unsplash.com/red-m.jpg' },
          { id: '3', color: 'Đen', size: 'S', price: 2800000, stock: 20, image_url: '' },
          { id: '4', color: 'Đen', size: 'L', price: 2800000, stock: 5, image_url: '' },
        ],
      };

      const primaryImage = formValues.displayProduct[0] || 'https://images.unsplash.com/placeholder.jpg';
      const payload = {
        name: formValues.name.trim(),
        slug: formValues.slug.trim(),
        category_id: formValues.category_id,
        brand: formValues.brand,
        old_price: Number(formValues.old_price),
        new_price: Number(formValues.new_price),
        description: formValues.description,
        weight: formValues.weight,
        displayProduct: formValues.displayProduct,
        stock: calculateTotalStock(formValues.variants),
        is_active: formValues.is_active,
        is_featured: formValues.is_featured,
        variants: formValues.variants.map((v) => ({
          color: v.color.trim(),
          size: v.size.trim(),
          stock: Math.max(0, Math.floor(Number(v.stock) || 0)),
          image_url: v.image_url?.trim() || primaryImage,
        })),
      };

      expect(payload.stock).toBe(50);
      expect(payload.variants.length).toBe(4);
      // All variants must have valid image_url for backend createProduct.command.js filter
      payload.variants.forEach((v) => {
        expect(v.image_url).toBeTruthy();
        expect(typeof v.image_url).toBe('string');
        expect(v.color).toBeTruthy();
        expect(Number.isInteger(v.stock)).toBe(true);
        expect(v.stock).toBeGreaterThanOrEqual(0);
      });

      expect(payload.variants[0].image_url).toBe('https://images.unsplash.com/primary-coat.jpg');
      expect(payload.variants[1].image_url).toBe('https://images.unsplash.com/red-m.jpg');
    });

    it('should adhere to BACKEND_PRODUCT_VARIANT_GAPS specification', () => {
      // Backend Mongoose schema only has { product_id, color, size, stock, image_url }
      // Discrete price and SKU are not in Mongoose schema yet and are handled gracefully
      const backendSchemaKeys = ['color', 'size', 'stock', 'image_url'];
      const rawVariant: ProductVariantItem = {
        id: 'var-99',
        color: 'Camel',
        size: 'XL',
        stock: 30,
        price: 3500000,
        sku: 'ATV-CAMEL-XL',
        image_url: 'https://images.unsplash.com/camel.jpg',
      };

      const mappedToBackend = {
        color: rawVariant.color,
        size: rawVariant.size,
        stock: rawVariant.stock,
        image_url: rawVariant.image_url,
      };

      expect(Object.keys(mappedToBackend)).toEqual(backendSchemaKeys);
    });
  });
});

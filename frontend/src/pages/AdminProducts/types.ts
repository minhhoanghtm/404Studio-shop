export interface ProductVariantItem {
  id?: string;
  _id?: string;
  product_id?: string;
  color: string;
  color_code?: string;
  color_key?: string;
  size: string;
  stock: number;
  image_url: string;
  price?: number; // Optional UI display / override
  sku?: string;   // Virtual SKU display
  is_active?: boolean;
  position?: number;
}

export interface AdminProductFormValues {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  category_id: string;
  brand?: string;
  description: string;
  old_price: number;
  new_price: number;
  stock: number;
  weight: number;
  is_active: boolean;
  is_featured: boolean;
  displayProduct: string[];
  variants: ProductVariantItem[];
}

export interface CategoryOption {
  _id: string;
  id?: string;
  name: string;
  slug: string;
}

export const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FreeSize'];

export const DEFAULT_COLORS = [
  'Đen (Noir)',
  'Trắng (Ivory)',
  'Beige (Be)',
  'Đỏ Bordeaux',
  'Xanh Navy',
  'Nâu Đất (Camel)',
  'Xám Tro (Anthracite)',
  'Vàng Champagne',
];

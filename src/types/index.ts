export type Category = 'men' | 'women' | 'accessories' | 'couture';

export type ProductBadge = 'New Season' | 'Runway FW26' | 'Limited Edition' | 'Artisanal' | 'Bestseller' | 'Archive';

export interface ProductVariant {
  id: string;
  colorName: string;
  colorHex: string;
  sizes: {
    size: string;
    inStock: boolean;
    stockCount: number;
  }[];
  images: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  category: Category;
  subCategory: string;
  badge?: ProductBadge;
  description: string;
  details: string[];
  composition: string;
  origin: string;
  careInstructions: string[];
  variants: ProductVariant[];
  featuredImage: string;
  galleryImages: string[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isTrending?: boolean;
  collectionSlug?: string;
  rating: number;
  reviewCount: number;
}

export interface Collection {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  season: string;
  year: string;
  heroImage: string;
  editorialQuote: string;
  description: string;
  lookbookImages: string[];
  productSlugs: string[];
}

export interface CartItem {
  productId: string;
  productSlug: string;
  name: string;
  price: number;
  quantity: number;
  selectedColor: string;
  selectedColorHex: string;
  selectedSize: string;
  image: string;
}

export interface Coupon {
  code: string;
  discountPercentage: number;
  description: string;
  minimumSpend?: number;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: 'Processing' | 'Tailoring' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  vipTier: 'Member' | 'Atelier Privé' | 'Haute Circle';
  addresses: ShippingAddress[];
  savedCardLast4?: string;
}

export interface JournalArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: 'Atelier Note' | 'Exhibition' | 'Craftsmanship' | 'Campaign';
  author: string;
  date: string;
  readTime: string;
  coverImage: string;
  sections: {
    heading?: string;
    paragraph: string;
    image?: string;
    quote?: string;
  }[];
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error' | 'bag';
  title: string;
  message: string;
  productImage?: string;
}

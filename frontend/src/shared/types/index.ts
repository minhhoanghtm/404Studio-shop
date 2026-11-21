export type Category = 'women' | 'men' | 'accessories' | 'couture';

export type ProductBadge = 'Mùa mới' | 'Runway FW26' | 'Bản giới hạn' | 'Thủ công mỹ nghệ' | 'Bán chạy nhất' | 'Kho lưu trữ' | string;

export interface ProductSize {
  size: string;
  inStock: boolean;
  stockCount?: number;
  variantId?: string;
}

export interface ProductVariant {
  id: string;
  colorName: string;
  colorHex: string;
  sizes: ProductSize[];
  images: string[];
}

export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  price: number; // in VND
  originalPrice?: number;
  category: Category;
  subCategory: string;
  badge?: ProductBadge;
  description: string;
  details: string[];
  features?: string[];
  composition: string;
  origin: string;
  careInstructions: string[] | string;
  variants: ProductVariant[];
  sizes?: string[];
  featuredImage: string;
  galleryImages: string[];
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isTrending?: boolean;
  inStock?: boolean;
  collectionSlug?: string;
  rating: number;
  reviewCount: number;
  reviewsCount?: number;
  reviews?: ProductReview[];
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
  itemCount?: number;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  productSlug: string;
  name: string;
  price: number; // in VND
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
  id?: string;
  name?: string;
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
  status: 'Đang xử lý' | 'Đang may đo' | 'Đã xuất xưởng' | 'Đã giao hàng' | 'Đã hủy' | 'delivered' | 'shipped' | 'processing' | 'cancelled' | string;
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
  avatar?: string;
  googleId?: string;
  role?: 'admin' | 'user' | string;
  vipTier: 'Thành viên' | 'Atelier Privé' | 'Haute Circle' | string;
  addresses: ShippingAddress[];
  savedCardLast4?: string;
}

export interface JournalArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: 'Ghi chép Atelier' | 'Triển lãm' | 'Nghệ thuật thủ công' | 'Chiến dịch' | string;
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

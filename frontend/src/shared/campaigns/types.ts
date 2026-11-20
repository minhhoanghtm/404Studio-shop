export type CampaignType = 'flash_sale' | 'seasonal' | 'mega_sale' | 'clearance';

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended';

export type DestinationType =
  | 'product'
  | 'category'
  | 'collection'
  | 'lookbook'
  | 'voucher'
  | 'sale_page'
  | 'url'
  | 'external';

export type DisplayFrequency =
  | 'once_per_session'
  | 'once_per_day'
  | 'once_forever'
  | 'always';

export interface DiscountRule {
  scope: 'all' | 'categories' | 'products';
  categoryIds: string[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxDiscountAmount?: number | null;
}

export interface CampaignBanner {
  _id?: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  position?: string;
  targetType?: 'product' | 'category' | 'external' | 'lookbook';
  targetId?: string;
  linkUrl?: string;
  buttonText?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface CampaignProductItem {
  _id?: string;
  product_id: string | { _id: string; name: string; slug: string; image?: string; price?: number; new_price?: number };
  variant_id?: string | null;
  name?: string;
  slug?: string;
  image?: string;
  original_price?: number;
  sale_price: number;
  quota: number;
  sold?: number;
  remainingQuota?: number;
  per_user_limit?: number | null;
  discountPercentage?: number;
}

export interface Campaign {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  type: CampaignType;
  status: CampaignStatus;
  startAt: string;
  endAt: string;
  priority: number;
  bannerId?: string | CampaignBanner | null;
  pageId?: string | null;
  discountRule?: DiscountRule | null;
  remainingSeconds?: number;
  products?: CampaignProductItem[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { _id: string; fullName?: string; name?: string; email?: string };
  updatedBy?: { _id: string; fullName?: string; name?: string; email?: string };
}

export interface CampaignStats {
  totalItemsSold: number;
  totalRevenue: number;
  totalOrders: number;
  totalQuota: number;
  totalSold: number;
  totalRemainingQuota: number;
}

export interface CampaignDetailResponse {
  campaign: Campaign;
  products: CampaignProductItem[];
  stats?: CampaignStats;
}

export interface ActiveCampaignsResponse {
  serverTime: string;
  campaigns: Campaign[];
}

export interface CreateCampaignPayload {
  name: string;
  slug: string;
  type: 'flash_sale' | 'seasonal';
  status: 'draft' | 'scheduled' | 'active' | 'ended';
  startAt: string;
  endAt: string;
  priority?: number;
  bannerId?: string | null;
  pageId?: string | null;
  discountRule?: DiscountRule | null;
}

export interface UpdateCampaignPayload {
  name?: string;
  type?: 'flash_sale' | 'seasonal';
  status?: 'draft' | 'scheduled' | 'active' | 'ended';
  startAt?: string;
  endAt?: string;
  priority?: number;
  bannerId?: string | null;
  pageId?: string | null;
  discountRule?: DiscountRule | null;
}

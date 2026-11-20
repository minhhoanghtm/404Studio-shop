import { api, ApiResponse } from './client';

export * from './client';

// ============================================================================
// AUTH & USER APIs
// ============================================================================
export const authApi = {
  login: (credentials: { email: string; passWord: string }) =>
    api.post<ApiResponse<{ user: any; accessToken: string; refreshToken?: string }>>('/auth/login', credentials),

  register: (payload: { email: string; passWord: string; fullName: string; phone?: string; termsAccepted: true; privacyAccepted: true; marketingAccepted?: boolean; policyVersion: string }) =>
    api.post<ApiResponse<{ message: string; user?: any; accessToken?: string; refreshToken?: string }>>('/auth/signUp', payload),

  refresh: (refreshToken?: string) =>
    api.post<ApiResponse<{ accessToken: string; refreshToken: string; user: any }>>(
      '/auth/refresh',
      refreshToken ? { refreshToken } : {}
    ),

  sendOtp: (payload: { email?: string; phone?: string; purpose?: string }) =>
    api.post<ApiResponse<{ message: string }>>('/auth/register/send-otp', {
      purpose: 'register',
      ...payload,
    }),

  verifyOtp: (payload: { email?: string; phone?: string; otp: string; purpose?: string }) =>
    api.post<ApiResponse<{ token?: string; message: string }>>('/auth/verify-otp', {
      purpose: 'register',
      ...payload,
    }),

  forgotPassword: (payload: { email?: string; phone?: string }) =>
    api.post<ApiResponse<{ message: string }>>('/auth/password/forgot', payload),

  resetPassword: (payload: { email?: string; phone?: string; otp: string; newPassword: string }) =>
    api.post<ApiResponse<{ message: string }>>('/auth/password/reset', payload),

  logout: () => api.post<ApiResponse>('/auth/signOut'),

  updatePassword: (payload: { currentPassword?: string; newPassword: string }) =>
    api.put<ApiResponse<any>>('/user/updatePassword', payload),

  sendPhoneUpdateOtp: (payload: { phone: string }) =>
    api.put<ApiResponse<any>>('/user/phone/send-otp', payload),

  verifyAndUpdatePhone: (payload: { phone: string; otp: string }) =>
    api.put<ApiResponse<any>>('/user/phone/verify', payload),

  resendOtp: (payload: { identifier: string; purpose: string }) =>
    api.post<ApiResponse<any>>('/auth/otp/resend', payload),

  getMe: () => api.get<ApiResponse<any>>('/user/me'),

  getPermissions: () =>
    api.get<
      ApiResponse<{
        role: string;
        permissions: string[];
        overrides: { allow: string[]; deny: string[] };
      }>
    >('/auth/me/permissions'),

  updateProfile: (data: { fullName?: string; phone?: string; avatar_url?: string }) =>
    api.put<ApiResponse<any>>('/user/updateProfile', data),

  addAddress: (addressData: any) =>
    api.post<ApiResponse<any>>('/user/addresses', addressData),
};

// ============================================================================
// ROLES & RBAC MANAGEMENT APIs
// ============================================================================
export const rolesApi = {
  getRoles: () => api.get<ApiResponse<any[]>>('/admin/roles'),

  createRole: (data: {
    name: string;
    displayName: string;
    description?: string;
    permissions: string[];
  }) => api.post<ApiResponse<any>>('/admin/roles', data),

  updateRole: (
    id: string,
    data: {
      displayName?: string;
      description?: string;
      permissions?: string[];
    }
  ) => api.put<ApiResponse<any>>(`/admin/roles/${id}`, data),

  deleteRole: (id: string) => api.delete<ApiResponse<any>>(`/admin/roles/${id}`),

  getStandardPermissions: () =>
    api.get<
      ApiResponse<{
        groups: { group: string; items: { key: string; label: string; description?: string }[] }[];
        allPermissions: string[];
      }>
    >('/admin/permissions'),

  getRbacUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.role) query.set('role', params.role);
    if (params?.status) query.set('status', params.status);
    const qs = query.toString();
    return api.get<
      ApiResponse<{
        users: any[];
        total: number;
        page: number;
        totalPages: number;
      }>
    >(`/admin/rbac/users${qs ? `?${qs}` : ''}`);
  },

  getUsers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) => rolesApi.getRbacUsers(params),

  updateUserRoleAndOverrides: (
    userId: string,
    data: {
      role?: string;
      allow?: string[];
      deny?: string[];
    }
  ) => api.put<ApiResponse<any>>(`/admin/rbac/users/${userId}/role`, data),

  updateUserStatus: (userId: string, status: 'active' | 'locked' | 'blocked') =>
    api.put<ApiResponse<any>>(`/admin/rbac/users/${userId}/status`, { status }),

  getAuditLogs: (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString();
    return api.get<
      ApiResponse<{
        logs: any[];
        total: number;
        page: number;
        totalPages: number;
      }>
    >(`/admin/rbac/audit-logs${qs ? `?${qs}` : ''}`);
  },
};

// ============================================================================
// PRODUCTS & CATALOG APIs
// ============================================================================
export const productsApi = {
  getProducts: (params?: {
    category?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.sort) query.set('sort', params.sort);
    if (params?.minPrice) query.set('minPrice', params.minPrice.toString());
    if (params?.maxPrice) query.set('maxPrice', params.maxPrice.toString());
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('q', params.search);
    
    const qs = query.toString();
    return api.get<ApiResponse<any[]>>(`/products/catalog${qs ? `?${qs}` : ''}`);
  },

  searchProducts: (queryText: string, limit: number = 8) =>
    api.get<ApiResponse<any[]>>(`/products/search?search=${encodeURIComponent(queryText)}&limit=${limit}`),

  getProductBySlug: (slug: string) =>
    api.get<ApiResponse<any>>(`/products/${slug}`),

  getProductDetail: (id: string) =>
    api.get<ApiResponse<any>>(`/products/detail/${id}`),

  checkAvailability: (productId: string) =>
    api.get<ApiResponse<{ available: boolean; stock: number }>>(`/products/${productId}/availability`),

  getVariants: (productId: string) =>
    api.get<ApiResponse<any[]>>(`/product_variants/${productId}`),
};

// ============================================================================
// UPLOAD APIs
// ============================================================================
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<ApiResponse<{ url: string }> & { url?: string }>('/upload', formData);
  },
};

// ============================================================================
// CATEGORIES APIs
// ============================================================================
export const categoriesApi = {
  getCategories: () => api.get<ApiResponse<any[]>>('/categories'),
  getCategoryById: (id: string) => api.get<ApiResponse<any>>(`/categories/${id}`),
};

// ============================================================================
// CART APIs
// ============================================================================
export const cartApi = {
  getCart: () => api.get<ApiResponse<any>>('/cart'),
  addItem: (payload: { product_id: string; variant_id?: string; quantity: number }) =>
    api.post<ApiResponse<any>>('/cart_items', payload),
  updateItem: (id: string, quantity: number) =>
    api.put<ApiResponse<any>>(`/cart_items/${id}`, { quantity }),
  removeItem: (id: string) =>
    api.delete<ApiResponse<any>>(`/cart_items/${id}`),
};

// ============================================================================
// ORDERS APIs
// ============================================================================
export const ordersApi = {
  createOrder: (orderPayload: {
    items: Array<{ product_id: string; variant_id?: string; quantity: number; price?: number }>;
    shipping_address: Record<string, unknown>;
    payment_method: 'cod' | 'momo' | 'vnpay';
    voucher_code?: string;
    reservation_id?: string;
  }) => api.post<ApiResponse<any> & { order?: any }>('/order', orderPayload),

  getMyOrders: () => api.get<ApiResponse<any[]> & { orders?: any[] }>('/order'),

  getPaymentDetails: (id: string) => api.get<ApiResponse<any>>(`/order/${id}/payment`),

  lookupOrder: (orderCode: string, phone: string) =>
    api.get<ApiResponse<any>>(`/order/guest-lookup?orderCode=${encodeURIComponent(orderCode)}&phone=${encodeURIComponent(phone)}`),
};

// ============================================================================
// PAYMENTS APIs
// ============================================================================
export const paymentsApi = {
  createMomoPayment: (orderId: string) =>
    api.post<ApiResponse<{ paymentUrl: string }> & { paymentUrl?: string }>(`/payments/momo/create/${encodeURIComponent(orderId)}`),

  createVnpayPayment: (orderId: string) =>
    api.post<ApiResponse<{ paymentUrl: string }> & { paymentUrl?: string }>(`/payments/vnpay/create/${encodeURIComponent(orderId)}`),
};

// ============================================================================
// VOUCHERS APIs
// ============================================================================
export const vouchersApi = {
  getVouchers: () => api.get<ApiResponse<any[]>>('/vouchers'),
  getMyVouchers: () => api.get<ApiResponse<any[]>>('/vouchers/wallet'),
  saveVoucher: (voucherId: string) => api.post<ApiResponse<any>>('/vouchers/claim', { voucherId }),
  applyVoucher: (code: string, orderTotal: number) =>
    api.post<ApiResponse<{ discountAmount: number; finalTotal: number }>>('/vouchers/validate', {
      code,
      orderTotal,
    }),
};

// ============================================================================
// FAVORITES / WISHLIST APIs
// ============================================================================
export const favoritesApi = {
  getFavorites: () => api.get<ApiResponse<any[]>>('/favorites'),
  addFavorite: (productId: string) => api.post<ApiResponse<any>>('/favorites', { product_id: productId }),
  removeFavorite: (id: string) => api.delete<ApiResponse<any>>(`/favorites/${id}`),
};

// ============================================================================
// REVIEWS APIs
// ============================================================================
export const reviewsApi = {
  getProductReviews: (productId: string) => api.get<ApiResponse<any[]>>(`/reviews/${productId}`),
  createReview: (payload: { productId: string; rating: number; comment: string; orderId?: string }) =>
    api.post<ApiResponse<any>>('/reviews', payload),
};

// ============================================================================
// LOOKBOOKS & BANNERS APIs
// ============================================================================
export const lookbooksApi = {
  getLookbooks: () => api.get<ApiResponse<any[]>>('/lookbooks'),
  getBanners: () => api.get<ApiResponse<any[]>>('/banners'),
  getCampaigns: () => api.get<ApiResponse<any[]>>('/campaigns'),
  getSettings: () => api.get<ApiResponse<any>>('/settings'),
};

export const bannersApi = {
  getActiveBanners: () => api.get<ApiResponse<any[]>>('/banners/active'),
  getAllBanners: (params?: { page?: number; limit?: number; keyword?: string; position?: string; status?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.keyword) query.set('keyword', params.keyword);
    if (params?.position) query.set('position', params.position);
    if (params?.status !== undefined) query.set('status', params.status.toString());
    const qs = query.toString();
    return api.get<ApiResponse<{ items: any[]; pagination: any }>>(`/banners${qs ? `?${qs}` : ''}`);
  },
  getBannerById: (id: string) => api.get<ApiResponse<any>>(`/banners/${encodeURIComponent(id)}`),
  createBanner: (data: any) => api.post<ApiResponse<any>>('/banners', data),
  updateBanner: (id: string, data: any) => api.put<ApiResponse<any>>(`/banners/${encodeURIComponent(id)}`, data),
  deleteBanner: (id: string) => api.delete<ApiResponse<any>>(`/banners/${encodeURIComponent(id)}`),
  trackClick: (id: string) => api.post<ApiResponse<any>>(`/banners/${encodeURIComponent(id)}/click`, {}),
};

export const campaignsApi = {
  getActiveCampaigns: () =>
    api.get<ApiResponse<{ serverTime: string; campaigns: any[] }>>('/campaigns/active'),

  getCampaignBySlug: (slug: string, params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString();
    return api.get<ApiResponse<any>>(`/campaigns/${encodeURIComponent(slug)}${qs ? `?${qs}` : ''}`);
  },

  getAdminCampaigns: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.type) query.set('type', params.type);
    const qs = query.toString();
    return api.get<ApiResponse<{ campaigns: any[]; pagination: any }>>(`/admin/campaigns${qs ? `?${qs}` : ''}`);
  },

  getAdminCampaignDetail: (id: string) =>
    api.get<ApiResponse<any>>(`/admin/campaigns/${encodeURIComponent(id)}`),

  createCampaign: (data: any) =>
    api.post<ApiResponse<any>>('/admin/campaigns', data),

  updateCampaign: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/admin/campaigns/${encodeURIComponent(id)}`, data),

  deleteCampaign: (id: string) =>
    api.delete<ApiResponse<any>>(`/admin/campaigns/${encodeURIComponent(id)}`),

  addCampaignProduct: (campaignId: string, payload: {
    product_id: string;
    variant_id?: string | null;
    sale_price: number;
    quota: number;
    per_user_limit?: number | null;
  }) => api.post<ApiResponse<any>>(`/admin/campaigns/${encodeURIComponent(campaignId)}/products`, payload),

  updateCampaignProduct: (campaignId: string, productId: string, payload: {
    sale_price?: number;
    quota?: number;
    per_user_limit?: number | null;
  }) => api.put<ApiResponse<any>>(`/admin/campaigns/${encodeURIComponent(campaignId)}/products/${encodeURIComponent(productId)}`, payload),

  removeCampaignProduct: (campaignId: string, productId: string) =>
    api.delete<ApiResponse<any>>(`/admin/campaigns/${encodeURIComponent(campaignId)}/products/${encodeURIComponent(productId)}`),
};

// ============================================================================
// SHIPPING APIs
// ============================================================================
export const shippingApi = {
  calculateFee: (payload: { toDistrictId?: number; toWardCode?: string; weight?: number }) =>
    api.post<ApiResponse<{ totalFee: number; serviceFee?: number }>>('/shipping/fee', payload),
};

// ============================================================================
// RECOMMENDATIONS & BEHAVIORAL TRACKING APIs
// ============================================================================
export interface RecommendationResponse {
  mode: 'personalized' | 'popular' | 'empty';
  algorithm?: string;
  products: any[];
  experiment?: {
    experiment_id?: string;
    variant?: string;
    request_id?: string;
    reason?: string;
  };
}

export const recommendationsApi = {
  getRecommendations: (params?: { limit?: number; anonymousId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', params.limit.toString());
    if (params?.anonymousId) qs.set('anonymous_id', params.anonymousId);
    return api.get<ApiResponse<RecommendationResponse>>(`/recommendations${qs.toString() ? `?${qs.toString()}` : ''}`, {
      headers: params?.anonymousId ? { 'X-Anonymous-ID': params.anonymousId } : undefined,
    });
  },
};

export const trackingApi = {
  trackEvent: (eventPayload: Record<string, unknown>) =>
    api.post<ApiResponse<{ processed: number }>>('/events', eventPayload, {
      headers: eventPayload.anonymous_id ? { 'X-Anonymous-ID': String(eventPayload.anonymous_id) } : undefined,
    }),

  trackBatch: (events: Record<string, unknown>[]) =>
    api.post<ApiResponse<{ processed: number }>>('/events/batch', { events }),

  getSearchHistory: () =>
    api.get<ApiResponse<{ keywords: string[] }>>('/search/history'),

  clearMyData: (anonymousId?: string, anonymousToken?: string) =>
    api.delete<ApiResponse>('/events/me', {
      headers: {
        ...(anonymousId ? { 'X-Anonymous-ID': anonymousId } : {}),
        ...(anonymousToken ? { 'X-Anonymous-Token': anonymousToken } : {}),
      },
    }),
};

// ============================================================================
// AI SHOPPING ASSISTANT APIs
// ============================================================================
export const aiApi = {
  chat: (content: string, payload?: { conversationId?: string; metadata?: Record<string, unknown>; confirmAction?: unknown; cancelAction?: unknown }) =>
    api.post<ApiResponse<any>>('/ai/chat', { content, mode: 'agent', ...payload }),
};

// ============================================================================
// ADMIN APIs
// ============================================================================
export const adminApi = {
  getStats: () => api.get<ApiResponse<any>>('/order/admin/kpi'),
  getRevenue: (type: 'week' | 'month' | 'year' = 'month') =>
    api.get<ApiResponse<any>>(`/order/admin/revenue?type=${type}`),
  getOrderStats: (userId?: string) =>
    api.get<ApiResponse<any>>(`/order/admin/stats${userId ? `?userId=${userId}` : ''}`),
  getVoucherStats: () => api.get<ApiResponse<any>>('/vouchers/admin/stats'),
  getAllOrders: (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString();
    return api.get<ApiResponse<{ items: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>>(
      `/order/admin/orders${qs ? `?${qs}` : ''}`
    );
  },
  getOrderItems: (orderId: string) =>
    api.get<ApiResponse<any[]>>(`/order_items/${encodeURIComponent(orderId)}`),
  updateOrderStatus: (id: string, status: string) =>
    api.patch<ApiResponse<any>>(`/order/admin/orders/${id}/status`, { status }),
  getCustomers: (params?: any) => {
    const query = new URLSearchParams(params || {});
    return api.get<ApiResponse<any>>(`/user/admin/all${query.toString() ? `?${query.toString()}` : ''}`);
  },
  updateCustomerStatus: (id: string, status: string) =>
    api.put<ApiResponse<any>>(`/user/admin/${id}/status`, { status }),
  getConversations: () => api.get<ApiResponse<any[]>>('/admin/conversations'),
  getMessages: (conversationId: string) => api.get<ApiResponse<any[]>>(`/admin/messages/${conversationId}`),
  createProduct: (data: any) => api.post<ApiResponse<any>>('/products', data),
  updateProduct: (id: string, data: any) => api.put<ApiResponse<any>>(`/products/${id}`, data),
  createAdminFormProduct: (data: any) => api.post<ApiResponse<any>>('/products/admin-form', data),
  updateAdminFormProduct: (id: string, data: any) => api.put<ApiResponse<any>>(`/products/admin-form/${id}`, data),
  deleteProduct: (id: string) => api.delete<ApiResponse<any>>(`/products/${id}`),
  createProductVariant: (data: any) => api.post<ApiResponse<any>>('/product_variants', data),
  updateProductVariant: (id: string, data: any) => api.put<ApiResponse<any>>(`/product_variants/${id}`, data),
  deleteProductVariant: (id: string) => api.delete<ApiResponse<any>>(`/product_variants/${id}`),
  createCategory: (data: any) => api.post<ApiResponse<any>>('/categories', data),
  updateCategory: (id: string, data: any) => api.put<ApiResponse<any>>(`/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete<ApiResponse<any>>(`/categories/${id}`),
  createVoucher: (data: any) => api.post<ApiResponse<any>>('/vouchers', data),
  updateVoucher: (id: string, data: any) => api.put<ApiResponse<any>>(`/vouchers/${id}`, data),
  deleteVoucher: (id: string) => api.delete<ApiResponse<any>>(`/vouchers/${id}`),
  updateSettings: (data: any) => api.put<ApiResponse<any>>('/settings', data),

  // Product Excel with Embedded Images
  downloadProductTemplate: async () => {
    const res = await fetch('/api/products/excel/template', {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Không thể tải tệp mẫu Excel');
    return await res.blob();
  },

  exportProductsExcel: async (options: {
    scope?: 'all' | 'filtered' | 'selected';
    ids?: string[];
    category?: string;
    search?: string;
    includeImages?: boolean;
  }) => {
    const { getAccessToken } = await import('./client');
    const token = getAccessToken();
    const res = await fetch('/api/products/excel/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(options),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || 'Lỗi khi xuất tệp Excel');
    }
    return await res.blob();
  },

  previewProductsExcel: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<any>>('/products/excel/preview', formData);
  },

  confirmProductsExcel: (previewId: string) =>
    api.post<ApiResponse<any>>('/products/excel/confirm', { previewId }),

  downloadErrorReport: async (previewId: string) => {
    const { getAccessToken } = await import('./client');
    const token = getAccessToken();
    const res = await fetch(`/api/products/excel/error-report/${encodeURIComponent(previewId)}`, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Không thể tải tệp báo cáo lỗi');
    return await res.blob();
  },
};

// ============================================================================
// POLICY MANAGEMENT APIs (Admin & Public Synchronized)
// ============================================================================
export interface PolicySection {
  _id?: string;
  type: 'hero' | 'story' | 'gallery' | 'quote' | 'image_text' | 'products' | 'banner' | 'cta';
  order?: number;
  sortOrder?: number;
  isActive?: boolean;
  data: Record<string, any>;
}

export interface PolicyDocument {
  _id: string;
  title: string;
  slug: string;
  type: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  displayOrder?: number;
  publishedAt?: string | null;
  viewCount?: number;
  isFeatured?: boolean;
  sections?: PolicySection[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PolicyListResponse {
  pages: PolicyDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminPoliciesApi = {
  getPolicies: (params?: {
    type?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    query.set('type', params?.type || 'policy');
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return api.get<ApiResponse<PolicyListResponse>>(`/admin/pages?${query.toString()}`);
  },

  getPolicyById: (id: string) =>
    api.get<ApiResponse<PolicyDocument>>(`/admin/pages/${encodeURIComponent(id)}`),

  getPolicyDetail: (id: string) =>
    api.get<ApiResponse<{ page: PolicyDocument; sections: PolicySection[] }>>(`/admin/pages/${encodeURIComponent(id)}/detail`),

  createPolicy: (data: Partial<PolicyDocument> & { sections?: PolicySection[] }) =>
    api.post<ApiResponse<PolicyDocument>>('/admin/pages', {
      ...data,
      type: data.type || 'policy',
    }),

  updatePolicy: (id: string, data: Partial<PolicyDocument> & { sections?: PolicySection[] }) =>
    api.put<ApiResponse<PolicyDocument>>(`/admin/pages/${encodeURIComponent(id)}`, data),

  deletePolicy: (id: string) =>
    api.delete<ApiResponse<null>>(`/admin/pages/${encodeURIComponent(id)}`),

  toggleFeature: (id: string) =>
    api.put<ApiResponse<PolicyDocument>>(`/admin/pages/${encodeURIComponent(id)}/feature`, {}),
};

export const publicPoliciesApi = {
  getPublishedPolicies: (type: string = 'policy') =>
    api.get<ApiResponse<PolicyListResponse>>(`/pages?type=${encodeURIComponent(type)}&status=published`),

  getPolicyBySlug: (slug: string) =>
    api.get<ApiResponse<PolicyDocument>>(`/pages/${encodeURIComponent(slug)}`),

  incrementPageView: (slug: string) =>
    api.patch<ApiResponse<{ viewCount: number }>>(`/pages/${encodeURIComponent(slug)}/view`, {}),
};

// ============================================================================
// CMS PAGES & VISUAL PAGE BUILDER APIs
// ============================================================================
export const cmsPagesApi = {
  getPages: (params?: {
    type?: string;
    excludeType?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.excludeType) query.set('excludeType', params.excludeType);
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return api.get<ApiResponse<PolicyListResponse>>(`/admin/pages?${query.toString()}`);
  },

  getPageById: (id: string) =>
    api.get<ApiResponse<PolicyDocument>>(`/admin/pages/${encodeURIComponent(id)}`),

  getPageDetail: (id: string) =>
    api.get<ApiResponse<{ page: PolicyDocument; sections: any[] }>>(`/admin/pages/${encodeURIComponent(id)}/detail`),

  createPage: (data: Partial<PolicyDocument> & { sections?: any[] }) =>
    api.post<ApiResponse<PolicyDocument>>('/admin/pages', data),

  updatePage: (id: string, data: Partial<PolicyDocument> & { sections?: any[] }) =>
    api.put<ApiResponse<PolicyDocument>>(`/admin/pages/${encodeURIComponent(id)}`, data),

  deletePage: (id: string) =>
    api.delete<ApiResponse<null>>(`/admin/pages/${encodeURIComponent(id)}`),

  toggleFeature: (id: string) =>
    api.put<ApiResponse<PolicyDocument>>(`/admin/pages/${encodeURIComponent(id)}/feature`, {}),

  getPublicPages: (params?: { type?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.type) query.set('type', params.type);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    return api.get<ApiResponse<PolicyListResponse>>(`/pages?${query.toString()}`);
  },

  getPublicPageBySlug: (slug: string) =>
    api.get<ApiResponse<PolicyDocument & { sections: any[] }>>(`/pages/${encodeURIComponent(slug)}`),

  incrementViewCount: (slug: string) =>
    api.patch<ApiResponse<{ viewCount: number }>>(`/pages/${encodeURIComponent(slug)}/view`, {}),
};

export const pageSectionsApi = {
  getSectionsByPageId: (pageId: string) =>
    api.get<ApiResponse<any[]>>(`/admin/page-sections/${encodeURIComponent(pageId)}`),

  replaceSections: (pageId: string, sections: any[]) =>
    api.post<ApiResponse<any[]>>(`/admin/page-sections/${encodeURIComponent(pageId)}/replace`, { sections }),

  reorderSections: (pageId: string, sectionOrders: { id: string; sortOrder: number }[]) =>
    api.put<ApiResponse<any[]>>(`/admin/page-sections/${encodeURIComponent(pageId)}/reorder`, { sections: sectionOrders }),
};

// ============================================================================
// ADMIN TRACKING & BEHAVIORAL ANALYTICS APIs
// ============================================================================
export interface TrackingOverviewMetrics {
  totalEvents: number;
  activeUsersCount: number;
  activeSessionsCount: number;
  eventTypeStats: Record<string, number>;
  recommendationMetrics: {
    impressions: number;
    clicks: number;
    ctrPercentage: number;
  };
  aiMetrics: {
    recommendedCount: number;
    clickedCount: number;
    ctrPercentage: number;
    cartActionConfirmedCount: number;
  };
  topViewedProducts: Array<{
    _id: string;
    views: number;
    name: string;
    price: number;
    image?: string;
  }>;
  topSearches: Array<{
    query: string;
    count: number;
  }>;
}

export interface FunnelStage {
  stage: string;
  count: number;
  dropOffRate?: number;
  conversionRate?: number;
}

export interface FunnelAnalyticsResponse {
  sessionFunnel: FunnelStage[];
  userFunnel: FunnelStage[];
  rawStages: Record<string, number>;
}

export interface ActivityAnalyticsResponse {
  period: { start: string; end: string };
  pageAnalytics: Array<{
    pathname: string;
    views: number;
    avgDwellSec: number;
    avgActiveSec: number;
    avgIdleSec: number;
  }>;
  trafficSources: Array<{ source: string; count: number }>;
  apiMetrics: Array<{
    endpoint: string;
    count: number;
    avgLatencyMs: number;
    slowCount: number;
    errorCount: number;
  }>;
  checkoutFunnel: Record<string, number>;
}

export interface LiveSession {
  sessionId: string;
  userId?: string;
  isAnonymous: boolean;
  currentRoute?: string;
  status: 'active' | 'idle' | 'away' | 'background' | 'disconnected';
  lastSeen: string;
  deviceType?: string;
  tabCount: number;
}

export interface LivePresenceResponse {
  sessions: LiveSession[];
  counts: {
    total: number;
    active: number;
    idle: number;
    away: number;
    background: number;
    disconnected: number;
    guestCount?: number;
    authenticatedCount?: number;
  };
  redisConnected: boolean;
}

export const adminTrackingApi = {
  getOverview: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const qs = query.toString();
    return api.get<ApiResponse<TrackingOverviewMetrics>>(`/events/analytics/overview${qs ? `?${qs}` : ''}`);
  },

  getFunnel: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const qs = query.toString();
    return api.get<ApiResponse<FunnelAnalyticsResponse>>(`/events/analytics/funnel${qs ? `?${qs}` : ''}`);
  },

  getActivity: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams();
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    const qs = query.toString();
    return api.get<ApiResponse<ActivityAnalyticsResponse>>(`/events/analytics/activity${qs ? `?${qs}` : ''}`);
  },

  getLiveSessions: (params?: { statusFilter?: string; routeFilter?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.statusFilter) query.set('statusFilter', params.statusFilter);
    if (params?.routeFilter) query.set('routeFilter', params.routeFilter);
    if (params?.limit) query.set('limit', params.limit.toString());
    const qs = query.toString();
    return api.get<ApiResponse<LivePresenceResponse>>(`/events/presence/live${qs ? `?${qs}` : ''}`);
  },

  getSessionTimeline: (sessionId: string) =>
    api.get<ApiResponse<any>>(`/events/presence/session/${encodeURIComponent(sessionId)}`),

  getPolicyMetadata: () =>
    api.get<ApiResponse<{ version: string; effectiveDate: string }>>('/privacy/policy'),

  getDataSubjectRequests: () =>
    api.get<ApiResponse<any[]>>('/privacy/data-requests'),
};

export const loyaltyApi = {
  getProfile: () => api.get<ApiResponse<any>>('/loyalty/profile'),
  getTransactions: (params?: any) => {
    const query = new URLSearchParams(params || {});
    const qs = query.toString();
    return api.get<ApiResponse<any>>(`/loyalty/transactions${qs ? `?${qs}` : ''}`);
  },
  getTiers: () => api.get<ApiResponse<any>>('/loyalty/tiers'),
  getAdminStats: () => api.get<ApiResponse<any>>('/loyalty/admin/stats'),
  getAdminCustomers: (params?: any) => {
    const query = new URLSearchParams(params || {});
    const qs = query.toString();
    return api.get<ApiResponse<any>>(`/loyalty/admin/customers${qs ? `?${qs}` : ''}`);
  },
  getAdminTransactions: (params?: any) => {
    const query = new URLSearchParams(params || {});
    const qs = query.toString();
    return api.get<ApiResponse<any>>(`/loyalty/admin/transactions${qs ? `?${qs}` : ''}`);
  },
  updateTierSettings: (data: any) => api.put<ApiResponse<any>>('/loyalty/admin/tiers', data),
};

export * from './communicationApi';


import { api, ApiResponse } from './client';

export * from './client';

// ============================================================================
// AUTH & USER APIs
// ============================================================================
export const authApi = {
  login: (credentials: { email: string; passWord: string }) =>
    api.post<ApiResponse<{ user: any; accessToken: string }>>('/auth/login', credentials),

  register: (payload: { email: string; passWord: string; fullName: string; phone?: string }) =>
    api.post<ApiResponse<{ message: string; user?: any }>>('/auth/register', payload),

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

  logout: () => api.post<ApiResponse>('/auth/logout'),

  updatePassword: (payload: { currentPassword?: string; newPassword: string }) =>
    api.put<ApiResponse<any>>('/user/updatePassword', payload),

  sendPhoneUpdateOtp: (payload: { phone: string }) =>
    api.put<ApiResponse<any>>('/user/phone/send-otp', payload),

  verifyAndUpdatePhone: (payload: { phone: string; otp: string }) =>
    api.put<ApiResponse<any>>('/user/phone/verify', payload),

  resendOtp: (payload: { identifier: string; purpose: string }) =>
    api.post<ApiResponse<any>>('/auth/otp/resend', payload),

  getMe: () => api.get<ApiResponse<any>>('/user/me'),

  updateProfile: (data: { fullName?: string; phone?: string; avatar_url?: string }) =>
    api.put<ApiResponse<any>>('/user/profile', data),

  addAddress: (addressData: any) =>
    api.post<ApiResponse<any>>('/user/addresses', addressData),
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
    return api.get<ApiResponse<any[]>>(`/products${qs ? `?${qs}` : ''}`);
  },

  searchProducts: (queryText: string, limit: number = 8) =>
    api.get<ApiResponse<any[]>>(`/products/search?q=${encodeURIComponent(queryText)}&limit=${limit}`),

  getProductBySlug: (slug: string) =>
    api.get<ApiResponse<any>>(`/products/${slug}`),

  checkAvailability: (productId: string) =>
    api.get<ApiResponse<{ available: boolean; stock: number }>>(`/products/${productId}/availability`),

  getVariants: (productId: string) =>
    api.get<ApiResponse<any[]>>(`/product_variants/${productId}`),
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
  getMyVouchers: () => api.get<ApiResponse<any[]>>('/vouchers/my'),
  saveVoucher: (voucherId: string) => api.post<ApiResponse<any>>('/vouchers/save', { voucherId }),
  applyVoucher: (code: string, orderTotal: number) =>
    api.post<ApiResponse<{ discountAmount: number; finalTotal: number }>>('/vouchers/apply', {
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
  getProductReviews: (productId: string) => api.get<ApiResponse<any[]>>(`/reviews/product/${productId}`),
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
  getStats: () => api.get<ApiResponse<any>>('/admin/dashboard/stats'),
  getRevenue: () => api.get<ApiResponse<any>>('/admin/dashboard/revenue'),
  getAllOrders: (params?: any) => {
    const query = new URLSearchParams(params || {});
    return api.get<ApiResponse<any>>(`/order/admin/all${query.toString() ? `?${query.toString()}` : ''}`);
  },
  updateOrderStatus: (id: string, status: string) =>
    api.put<ApiResponse<any>>(`/order/${id}/status`, { status }),
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
  deleteProduct: (id: string) => api.delete<ApiResponse<any>>(`/products/${id}`),
  createCategory: (data: any) => api.post<ApiResponse<any>>('/categories', data),
  updateCategory: (id: string, data: any) => api.put<ApiResponse<any>>(`/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete<ApiResponse<any>>(`/categories/${id}`),
  createVoucher: (data: any) => api.post<ApiResponse<any>>('/vouchers', data),
  updateVoucher: (id: string, data: any) => api.put<ApiResponse<any>>(`/vouchers/${id}`, data),
  deleteVoucher: (id: string) => api.delete<ApiResponse<any>>(`/vouchers/${id}`),
  updateSettings: (data: any) => api.put<ApiResponse<any>>('/settings', data),
};

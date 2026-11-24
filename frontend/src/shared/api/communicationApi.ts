import { api } from './client';

export interface GuestInitPayload {
  guestId?: string;
  name: string;
  phone?: string;
  email?: string;
  initialMessages?: Array<{ role: 'user' | 'assistant'; text: string }>;
  handoffContext?: any;
}

export interface GuestSendPayload {
  conversationId: string;
  guestId: string;
  content: string;
  clientMessageId?: string;
}

export interface CustomerSupportSendPayload {
  conversationId?: string;
  content: string;
  clientMessageId?: string;
  metadata?: any;
}

export interface AdminSupportSendPayload {
  conversationId: string;
  content: string;
  clientMessageId?: string;
  metadata?: any;
}

export interface StaffStatusResponse {
  success: boolean;
  isStaffOnline: boolean;
  onlineStaffCount: number;
  statusText: string;
}

export const communicationApi = {
  // Staff presence status
  getStaffStatus: async (): Promise<StaffStatusResponse> => {
    try {
      const res = await api.get<{ data: StaffStatusResponse }>('/chat/staff-status');
      return res.data || res;
    } catch {
      return {
        success: true,
        isStaffOnline: false,
        onlineStaffCount: 0,
        statusText: 'Hiện chưa có nhân viên trực tuyến, để lại tin nhắn chúng tôi sẽ phản hồi sớm',
      };
    }
  },

  // Guest APIs
  initGuestChat: async (payload: GuestInitPayload) => {
    return api.post('/chat/guest/init', payload);
  },

  sendGuestMessage: async (payload: GuestSendPayload) => {
    return api.post('/chat/guest/send', payload);
  },

  getGuestMessages: async (conversationId: string, guestId: string) => {
    return api.get(`/chat/guest/messages/${conversationId}?guestId=${encodeURIComponent(guestId)}`);
  },

  // Authenticated Customer Support APIs
  sendCustomerSupportMessage: async (payload: CustomerSupportSendPayload) => {
    return api.post('/chat/support/send', payload);
  },

  getCustomerConversations: async () => {
    return api.get('/chat/conversations');
  },

  getCustomerMessages: async (conversationId: string) => {
    return api.get(`/chat/messages/${conversationId}`);
  },

  // Admin Support APIs
  getAdminConversations: async (params?: { page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get(`/admin/conversations${qs ? `?${qs}` : ''}`);
  },

  getAdminMessages: async (conversationId: string) => {
    return api.get(`/admin/messages/${conversationId}`);
  },

  sendAdminSupportMessage: async (payload: AdminSupportSendPayload) => {
    return api.post('/admin/support/send', payload);
  },

  assignConversation: async (conversationId: string, adminId: string) => {
    return api.post(`/admin/conversations/${conversationId}/assign`, { adminId });
  },

  closeConversation: async (conversationId: string) => {
    return api.post(`/admin/conversations/${conversationId}/close`);
  },

  reopenConversation: async (conversationId: string) => {
    return api.post(`/admin/conversations/${conversationId}/reopen`);
  },
};

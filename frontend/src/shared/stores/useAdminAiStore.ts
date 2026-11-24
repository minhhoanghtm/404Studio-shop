import { create } from 'zustand';
import { adminAiApi, AdminAiMessage, AdminAiInsight, AdminAiSettingsData, AIProviderInfo } from '../api/adminAiApi';

interface AdminAiStoreState {
  isSidebarOpen: boolean;
  isExpanded: boolean;
  activeMode: string;
  activeProvider: string;
  conversationId: string | null;
  messages: AdminAiMessage[];
  isLoading: boolean;
  error: string | null;
  insights: AdminAiInsight[];
  isScanningInsights: boolean;
  attachments: string[];
  settingsData: AdminAiSettingsData | null;
  isSettingsLoading: boolean;

  // Actions
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleExpanded: () => void;
  setMode: (mode: string) => void;
  setActiveProvider: (provider: string) => void;
  addAttachment: (url: string) => void;
  removeAttachment: (index: number) => void;
  clearAttachments: () => void;
  newConversation: () => void;
  loadConversation: (id: string) => Promise<void>;
  sendMessage: (content: string, routeContext?: any) => Promise<void>;
  confirmAction: (actionProposal: any) => Promise<boolean>;
  cancelAction: (actionId: string) => void;
  fetchInsights: () => Promise<void>;
  loadSettings: () => Promise<void>;
  testConnection: (providerId: string) => Promise<any>;
  updateSettings: (payload: any) => Promise<boolean>;
}

export const useAdminAiStore = create<AdminAiStoreState>((set, get) => ({
  isSidebarOpen: false,
  isExpanded: false,
  activeMode: 'auto',
  activeProvider: 'auto',
  conversationId: null,
  messages: [
    {
      role: 'assistant',
      content:
        'Xin chào Quản trị viên! Tôi là **404Studio Admin AI Copilot**. Tôi hỗ trợ đa nhà cung cấp AI (**Gemini, OpenAI GPT, Claude, DeepSeek, FLUX**) để phân tích doanh thu từ database, lập chiến dịch marketing, thiết kế poster quảng cáo, và quản lý tồn kho theo thời gian thực.',
      cardType: 'none',
      createdAt: new Date().toISOString(),
    },
  ],
  isLoading: false,
  error: null,
  insights: [],
  isScanningInsights: false,
  attachments: [],
  settingsData: null,
  isSettingsLoading: false,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openSidebar: () => set({ isSidebarOpen: true }),
  closeSidebar: () => set({ isSidebarOpen: false }),
  toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),

  setMode: (mode: string) => set({ activeMode: mode }),
  setActiveProvider: (provider: string) => set({ activeProvider: provider }),

  addAttachment: (url: string) => set((state) => ({ attachments: [...state.attachments, url] })),
  removeAttachment: (index: number) =>
    set((state) => ({ attachments: state.attachments.filter((_, i) => i !== index) })),
  clearAttachments: () => set({ attachments: [] }),

  newConversation: () => {
    set({
      conversationId: null,
      error: null,
      attachments: [],
      messages: [
        {
          role: 'assistant',
          content:
            'Đã bắt đầu phiên làm việc mới. Bạn muốn phân tích doanh thu, kiểm tra tồn kho, lên chiến dịch marketing hay thiết kế poster?',
          cardType: 'none',
          createdAt: new Date().toISOString(),
        },
      ],
    });
  },

  loadConversation: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await adminAiApi.getConversation(id);
      if (res?.data) {
        set({
          conversationId: res.data._id,
          activeMode: res.data.mode || 'auto',
          messages: res.data.messages || [],
        });
      }
    } catch (err: any) {
      set({ error: err.message || 'Không thể tải phiên làm việc' });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (content: string, routeContext = {}) => {
    if (!content.trim() && get().attachments.length === 0) return;

    const currentAttachments = [...get().attachments];
    const userMsg: AdminAiMessage = {
      role: 'user',
      content: content.trim() || (currentAttachments.length > 0 ? 'Phân tích hình ảnh đã tải lên' : ''),
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: [...state.messages, userMsg],
      isLoading: true,
      error: null,
      attachments: [], // Clear attachments after sending
    }));

    try {
      const { conversationId, activeMode, activeProvider } = get();
      const res = await adminAiApi.chat({
        message: userMsg.content,
        conversationId: conversationId || undefined,
        mode: activeMode,
        provider: activeProvider,
        context: routeContext,
        attachments: currentAttachments,
      });

      if (res?.data) {
        const returnedConvId = res.data.conversationId;
        const assistantMsg: AdminAiMessage = {
          role: 'assistant',
          content: res.data.message,
          cardType: res.data.cardType as any,
          cardData: res.data.cardData,
          actionProposal: res.data.actionProposal,
          toolCalls: res.data.toolCalls,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          conversationId: returnedConvId,
          messages: [...state.messages, assistantMsg],
        }));
      }
    } catch (err: any) {
      const errorMsg: AdminAiMessage = {
        role: 'assistant',
        content: `⚠️ **Lỗi thực thi:** ${err.message || 'Không thể kết nối với Admin AI Copilot. Vui lòng thử lại.'}`,
        cardType: 'none',
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, errorMsg],
        error: err.message,
      }));
    } finally {
      set({ isLoading: false });
    }
  },

  confirmAction: async (actionProposal: any) => {
    set({ isLoading: true });
    try {
      const res = await adminAiApi.confirmAction({
        actionId: actionProposal.actionId,
        confirmationToken: actionProposal.confirmationToken,
        payload: actionProposal.payload,
        actionType: actionProposal.actionType,
      });

      if (res?.data?.success) {
        const resultData = res.data.result;
        set((state) => ({
          messages: state.messages.map((m): AdminAiMessage => {
            if (m.actionProposal && m.actionProposal.actionId === actionProposal.actionId) {
              return {
                ...m,
                cardType: 'action_result',
                actionProposal: {
                  ...m.actionProposal,
                  status: 'confirmed',
                },
                cardData: resultData,
              };
            }
            return m;
          }),
        }));
        return true;
      }
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Lỗi khi thực hiện xác nhận' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  cancelAction: (actionId: string) => {
    set((state) => ({
      messages: state.messages.map((m): AdminAiMessage => {
        if (m.actionProposal && m.actionProposal.actionId === actionId) {
          return {
            ...m,
            actionProposal: {
              ...m.actionProposal,
              status: 'cancelled',
            },
          };
        }
        return m;
      }),
    }));
  },

  fetchInsights: async () => {
    set({ isScanningInsights: true });
    try {
      const res = await adminAiApi.getInsights();
      if (res?.data?.insights) {
        set({ insights: res.data.insights });
      }
    } catch {
      // Handled silently
    } finally {
      set({ isScanningInsights: false });
    }
  },

  loadSettings: async () => {
    set({ isSettingsLoading: true });
    try {
      const res = await adminAiApi.getSettings();
      if (res?.data) {
        set({ settingsData: res.data });
      }
    } catch (err: any) {
      console.warn('Failed to load AI settings:', err.message);
    } finally {
      set({ isSettingsLoading: false });
    }
  },

  testConnection: async (providerId: string) => {
    try {
      const res = await adminAiApi.testConnection(providerId);
      return res?.data;
    } catch (err: any) {
      return { success: false, status: 'UNAVAILABLE', message: err.message };
    }
  },

  updateSettings: async (payload: any) => {
    try {
      const res = await adminAiApi.updateSettings(payload);
      if (res?.data) {
        await get().loadSettings();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
}));

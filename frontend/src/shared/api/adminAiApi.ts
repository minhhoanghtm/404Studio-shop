import { api, ApiResponse } from './client';

export interface AdminAiMessage {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    args: any;
    result: any;
    status: 'success' | 'failed' | 'pending_confirmation' | 'blocked';
  }>;
  cardType?:
    | 'none'
    | 'kpi_metrics'
    | 'chart_line'
    | 'chart_bar'
    | 'chart_area'
    | 'chart_donut'
    | 'chart_funnel'
    | 'data_table'
    | 'product_list'
    | 'order_list'
    | 'poster_preview'
    | 'banner_preview'
    | 'campaign_plan'
    | 'confirmation_required'
    | 'action_result'
    | 'report_summary'
    | 'insights_list';
  cardData?: any;
  actionProposal?: {
    actionId: string;
    actionType: string;
    actionLevel: number;
    title: string;
    summary: string;
    payload: any;
    confirmationToken: string;
    expiresAt: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'expired';
  };
  createdAt?: string;
}

export interface AdminAiConversation {
  _id: string;
  title: string;
  mode: string;
  context: {
    route: string;
    selectedEntityId?: string;
    entityType?: string;
    filters?: any;
  };
  messages: AdminAiMessage[];
  updatedAt: string;
}

export interface AdminAiInsight {
  _id?: string;
  type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  explanation: string;
  dataMetrics: any;
  recommendedAction?: {
    actionType: string;
    label: string;
    suggestedPrompt: string;
    payload?: any;
  };
}

export interface AdminDesignProject {
  _id?: string;
  name: string;
  preset: string;
  width: number;
  height: number;
  background: {
    type: 'color' | 'gradient' | 'image' | 'texture';
    value: string;
    secondaryValue?: string;
    textureName?: string;
  };
  layers: Array<{
    id: string;
    type: 'text' | 'image' | 'background' | 'shape' | 'icon' | 'logo' | 'badge' | 'button' | 'group' | 'product' | 'gradient';
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    opacity?: number;
    zIndex?: number;
    visible?: boolean;
    locked?: boolean;
    content: string;
    styles?: any;
  }>;
  thumbnailUrl?: string;
  status?: string;
  updatedAt?: string;
  versionHistory?: Array<{ version: number; savedAt?: string; name: string; canvas: { width: number; height: number }; background: AdminDesignProject['background']; layers: AdminDesignProject['layers'] }>;
}

export interface AIProviderInfo {
  id: string;
  name: string;
  defaultModel: string;
  capabilities: string[];
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'INVALID_KEY' | 'RATE_LIMITED' | 'QUOTA_EXCEEDED' | 'UNAVAILABLE';
  configured: boolean;
}

export interface AdminAiSettingsData {
  settings: {
    defaultProvider: string;
    imageDefaultProvider: string;
    marketingDefaultProvider: string;
    analyticsDefaultProvider: string;
    fallbackEnabled: boolean;
    requestTimeoutMs: number;
    imageDailyLimit: number;
    imageMaxVariants: number;
    monthlyBudgetUsd: number;
    modelOverrides: Record<string, string>;
    maskedKeys: Record<string, string | null>;
  };
  providers: AIProviderInfo[];
  usageSummary: {
    monthSpendUsd: number;
    monthlyBudgetUsd: number;
    budgetPercent: number;
    totalRequests: number;
    totalTokens: number;
    todayImages: number;
    dailyImageLimit: number;
    providerBreakdown: Array<{
      provider: string;
      costUsd: number;
      requests: number;
      images: number;
    }>;
  };
}

export const adminAiApi = {
  getBusinessAnalytics: (period: string, range?: { startDate: string; endDate: string }) => {
    const query = new URLSearchParams({ period, ...(range || {}) });
    return api.get<ApiResponse<{ summary: any; trend: any; inventory: any; lowStock: any; customers: any; topProducts: any; slowProducts: any; campaignPerformance: any }>>(`/admin/ai/analytics?${query}`);
  },
  chat: (payload: { message: string; conversationId?: string; mode?: string; provider?: string; context?: any; attachments?: string[] }) =>
    api.post<ApiResponse<{
      conversationId: string;
      title: string;
      mode: string;
      providerUsed?: string;
      imageProviderUsed?: string;
      message: string;
      cardType: string;
      cardData: any;
      actionProposal: any;
      toolCalls: any[];
    }>>('/admin/ai/chat', payload),

  confirmAction: (payload: { actionId: string; confirmationToken: string; payload: any; actionType: string }) =>
    api.post<ApiResponse<{
      success: boolean;
      actionId: string;
      actionType: string;
      result: any;
    }>>('/admin/ai/confirm-action', payload),

  cancelAction: (actionId: string) => api.post<ApiResponse<{ status: string }>>('/admin/ai/cancel-action', { actionId }),

  getConversations: () =>
    api.get<ApiResponse<Array<{ _id: string; title: string; mode: string; context: any; updatedAt: string }>>>('/admin/ai/conversations'),

  getConversation: (id: string) =>
    api.get<ApiResponse<AdminAiConversation>>(`/admin/ai/conversations/${encodeURIComponent(id)}`),

  deleteConversation: (id: string) =>
    api.delete<ApiResponse<{ message: string }>>(`/admin/ai/conversations/${encodeURIComponent(id)}`),

  getInsights: () =>
    api.get<ApiResponse<{ scannedAt: string; totalInsights: number; insights: AdminAiInsight[] }>>('/admin/ai/insights'),

  getDesigns: () =>
    api.get<ApiResponse<AdminDesignProject[]>>('/admin/ai/designs'),

  saveDesign: (project: Partial<AdminDesignProject>) =>
    api.post<ApiResponse<AdminDesignProject>>('/admin/ai/designs', project),

  validateDesign: (project: Partial<AdminDesignProject>) =>
    api.post<ApiResponse<{ valid: boolean }>>('/admin/ai/designs/validate', project),

  applyDesignOperations: (payload: { designId: string; request: string; selectedLayerId?: string; provider?: string }) =>
    api.post<ApiResponse<{ design: AdminDesignProject; operations: any[]; applied: string[] }>>('/admin/ai/designs/operations', payload),

  getBrandKit: () =>
    api.get<ApiResponse<any>>('/admin/ai/brand-kit'),

  getExportReportUrl: (period: string = 'this_month') =>
    `/api/admin/ai/export-report?period=${encodeURIComponent(period)}`,

  getSettings: () =>
    api.get<ApiResponse<AdminAiSettingsData>>('/admin/ai/settings'),

  updateSettings: (payload: any) =>
    api.put<ApiResponse<any>>('/admin/ai/settings', payload),

  testConnection: (providerId: string) =>
    api.post<ApiResponse<{ success: boolean; status: string; latencyMs?: number; message: string }>>('/admin/ai/settings/test-connection', { providerId }),

  getUsage: () =>
    api.get<ApiResponse<any>>('/admin/ai/usage'),

  generateImage: (payload: {
    prompt?: string;
    title?: string;
    subtitle?: string;
    discountText?: string;
    style?: string;
    preset?: string;
    provider?: string;
    width?: number;
    height?: number;
  }) => api.post<ApiResponse<any>>('/admin/ai/images/generate', payload),

  uploadImageReference: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<ApiResponse<{ filename: string; originalName: string; size: number; mimeType: string; url: string }>>(
      '/admin/ai/images/upload',
      formData
    );
  },

  analyzeVision: (payload: { imageUrls: string[]; prompt?: string; provider?: string }) =>
    api.post<ApiResponse<any>>('/admin/ai/vision/analyze', payload),
};

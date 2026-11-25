import React, { useState, useEffect, useRef } from 'react';
import { AdminLayout } from './AdminLayout';
import {
  Sparkles,
  TrendingUp,
  Palette,
  Megaphone,
  FileSpreadsheet,
  Settings,
  MessageSquare,
  Plus,
  Trash2,
  Download,
  Send,
  Loader2,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Activity,
  Key,
  Check,
  Zap,
} from 'lucide-react';
import { useAdminAiStore } from '@/shared/stores/useAdminAiStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { adminAiApi, AdminDesignProject } from '@/shared/api/adminAiApi';
import {
  AdminAiKpiCard,
  AdminAiChartCard,
  AdminAiPosterCard,
  AdminAiConfirmationCard,
  AdminAiProductListCard,
} from '@/shared/components/adminAi/cards/AdminAiCards';
import { SafeMarkdown } from '@/shared/components/adminAi/SafeMarkdown';
import CreativeStudioEditor from './components/CreativeStudioEditor';

export const AdminAiWorkspacePage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.vipTier === 'admin';

  const [activeTab, setActiveTab] = useState<
    'chat' | 'analytics' | 'creative' | 'marketing' | 'reports' | 'settings'
  >('chat');

  // Read URL params if tab is passed
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['chat', 'analytics', 'creative', 'marketing', 'reports', 'settings'].includes(tabParam)) {
      if (tabParam === 'settings' && !isAdmin) {
        setActiveTab('chat');
      } else {
        setActiveTab(tabParam as any);
      }
    }
  }, [isAdmin]);

  const {
    conversationId,
    messages,
    isLoading,
    newConversation,
    loadConversation,
    sendMessage,
    activeMode,
    setMode,
    activeProvider,
    setActiveProvider,
    settingsData,
    loadSettings,
    testConnection,
    updateSettings,
  } = useAdminAiStore();

  const [input, setInput] = useState('');
  const [conversationsList, setConversationsList] = useState<any[]>([]);

  // BI Data State
  const [biPeriod, setBiPeriod] = useState('this_month');
  const [biStart, setBiStart] = useState('');
  const [biEnd, setBiEnd] = useState('');
  const [biCustomRange, setBiCustomRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [biRangeError, setBiRangeError] = useState('');
  const [biSummary, setBiSummary] = useState<any>(null);
  const [biInventory, setBiInventory] = useState<any>(null);
  const [biLowStock, setBiLowStock] = useState<any>(null);
  const [biCustomers, setBiCustomers] = useState<any>(null);
  const [biTopProducts, setBiTopProducts] = useState<any>(null);
  const [biSlowProducts, setBiSlowProducts] = useState<any>(null);
  const [biCampaigns, setBiCampaigns] = useState<any>(null);
  const [biTrend, setBiTrend] = useState<any>(null);
  const [biComparison, setBiComparison] = useState<any>(null);
  const [biLoading, setBiLoading] = useState(false);
  const [biError, setBiError] = useState('');
  const biRequest = useRef(0);

  // Creative Studio State
  const [designs, setDesigns] = useState<AdminDesignProject[]>([]);
  const [activeDesign, setActiveDesign] = useState<any>(null);
  const [designPrompt, setDesignPrompt] = useState('');
  const [selectedLayerId, setSelectedLayerId] = useState<string>('text-title');
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterGenStyle, setPosterGenStyle] = useState('brick_red');
  const [posterGenPreset, setPosterGenPreset] = useState('instagram_portrait');

  // Marketing State
  const [copyStyle, setCopyStyle] = useState('Luxury');
  const [copyType, setCopyType] = useState('facebook_post');
  const [copyTopic, setCopyTopic] = useState('');
  const [generatedCopy, setGeneratedCopy] = useState<any>(null);

  // Settings Tab State
  const [pingResults, setPingResults] = useState<Record<string, { loading?: boolean; latencyMs?: number; success?: boolean; status?: string; message?: string }>>({});
  const [settingsForm, setSettingsForm] = useState<any>({
    defaultProvider: 'auto',
    imageDefaultProvider: 'auto',
    marketingDefaultProvider: 'auto',
    analyticsDefaultProvider: 'auto',
    fallbackEnabled: true,
    imageDailyLimit: 20,
    monthlyBudgetUsd: 10,
  });
  const [apiKeysInput, setApiKeysInput] = useState<Record<string, string>>({
    gemini: '',
    openai: '',
    claude: '',
    deepseek: '',
    flux: '',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Fetch settings on tab change
  useEffect(() => {
    if (activeTab === 'settings') {
      loadSettings();
    }
  }, [activeTab]);

  // Sync settingsForm when settingsData loads
  useEffect(() => {
    if (settingsData?.settings) {
      setSettingsForm({
        defaultProvider: settingsData.settings.defaultProvider || 'auto',
        imageDefaultProvider: settingsData.settings.imageDefaultProvider || 'auto',
        marketingDefaultProvider: settingsData.settings.marketingDefaultProvider || 'auto',
        analyticsDefaultProvider: settingsData.settings.analyticsDefaultProvider || 'auto',
        fallbackEnabled: settingsData.settings.fallbackEnabled ?? true,
        imageDailyLimit: settingsData.settings.imageDailyLimit || 20,
        monthlyBudgetUsd: settingsData.settings.monthlyBudgetUsd || 10,
      });
    }
  }, [settingsData]);

  // Ping a specific provider
  const handleTestPing = async (providerId: string) => {
    setPingResults((prev) => ({ ...prev, [providerId]: { loading: true } }));
    const result = await testConnection(providerId);
    setPingResults((prev) => ({
      ...prev,
      [providerId]: {
        loading: false,
        success: result?.success,
        status: result?.status,
        latencyMs: result?.latencyMs,
        message: result?.message,
      },
    }));
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsSavedSuccess(false);
    try {
      const payload: any = { ...settingsForm };
      const keysToUpdate: Record<string, string> = {};
      Object.entries(apiKeysInput).forEach(([k, v]) => {
        if (v && v.trim()) keysToUpdate[k] = v.trim();
      });
      if (Object.keys(keysToUpdate).length > 0) {
        payload.apiKeys = keysToUpdate;
      }
      const ok = await updateSettings(payload);
      if (ok) {
        setSettingsSavedSuccess(true);
        setTimeout(() => setSettingsSavedSuccess(false), 4000);
      }
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Fetch conversations
  const refreshConversations = async () => {
    try {
      const res = await adminAiApi.getConversations();
      if (res?.data) setConversationsList(res.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    refreshConversations();
  }, [conversationId]);

  // Fetch BI Data when tab is analytics
  useEffect(() => {
    if (activeTab === 'analytics') {
      if (biPeriod !== 'custom' || biCustomRange) fetchBiData(biPeriod, biPeriod === 'custom' ? biCustomRange || undefined : undefined);
    }
  }, [activeTab, biPeriod, biCustomRange]);

  const fetchBiData = async (period: string, range?: { startDate: string; endDate: string }) => {
    const requestId = ++biRequest.current;
    setBiLoading(true);
    setBiError('');
    try {
      const response = await adminAiApi.getBusinessAnalytics(period, range);
      if (requestId !== biRequest.current) return;
      setBiSummary(response.data?.summary || null);
      setBiTrend(response.data?.trend || null);
      setBiInventory(response.data?.inventory || null);
      setBiLowStock(response.data?.lowStock || null);
      setBiCustomers(response.data?.customers || null);
      setBiTopProducts(response.data?.topProducts || null);
      setBiSlowProducts(response.data?.slowProducts || null);
      setBiCampaigns(response.data?.campaignPerformance || null);
    } catch {
      if (requestId === biRequest.current) { setBiSummary(null); setBiTrend(null); setBiInventory(null); setBiLowStock(null); setBiCustomers(null); setBiTopProducts(null); setBiSlowProducts(null); setBiCampaigns(null); setBiError('Không thể tải dữ liệu kinh doanh. Vui lòng thử lại.'); }
    } finally {
      if (requestId === biRequest.current) setBiLoading(false);
    }
  };

  const applyBiRange = () => {
    const start = Date.parse(`${biStart}T00:00:00Z`);
    const end = Date.parse(`${biEnd}T00:00:00Z`);
    if (!biStart || !biEnd || !Number.isFinite(start) || !Number.isFinite(end) || end < start || end - start >= 366 * 86400000) {
      setBiRangeError('Chọn khoảng ngày hợp lệ, tối đa 366 ngày.');
      return;
    }
    setBiRangeError('');
    setBiCustomRange({ startDate: biStart, endDate: biEnd });
    setBiPeriod('custom');
  };

  // Fetch Designs when tab is creative
  useEffect(() => {
    if (activeTab === 'creative') {
      loadCreativeStudio();
    }
  }, [activeTab]);

  const loadCreativeStudio = async () => {
    try {
      const res = await adminAiApi.getDesigns();
      const requestedId = new URLSearchParams(window.location.search).get('designId');
      if (res?.data && res.data.length > 0) {
        setDesigns(res.data);
        setActiveDesign(requestedId ? res.data.find((item) => item._id === requestedId) || null : res.data[0]);
      } else if (requestedId) {
        setActiveDesign(null);
      } else if (!activeDesign) {
        const defaultPoster: AdminDesignProject = {
          _id: 'default_atelier_poster',
          name: 'Bộ Sưu Tập Mùa Thu Đông 2026 · Atelier Vérité',
          preset: 'instagram_portrait',
          width: 1080,
          height: 1350,
          background: { type: 'gradient', value: '#1a1918', secondaryValue: '#0d0d0c' },
          layers: [
            {
              id: 'layer_brand',
              type: 'text',
              name: 'Thương hiệu',
              x: 140,
              y: 200,
              width: 800,
              height: 60,
              rotation: 0,
              opacity: 1,
              zIndex: 1,
              visible: true,
              locked: false,
              content: 'ATELIER VÉRITÉ',
              styles: { fontFamily: 'Cinzel', fontSize: 36, fontWeight: '700', color: '#D4AF37', textAlign: 'center', letterSpacing: 8 }
            },
            {
              id: 'layer_title',
              type: 'text',
              name: 'Tiêu đề bộ sưu tập',
              x: 140,
              y: 290,
              width: 800,
              height: 110,
              rotation: 0,
              opacity: 1,
              zIndex: 2,
              visible: true,
              locked: false,
              content: 'HAUTE COUTURE 2026',
              styles: { fontFamily: 'Cinzel', fontSize: 52, fontWeight: '700', color: '#F5F5F0', textAlign: 'center', letterSpacing: 4 }
            },
            {
              id: 'layer_sub',
              type: 'text',
              name: 'Thông điệp',
              x: 140,
              y: 430,
              width: 800,
              height: 50,
              rotation: 0,
              opacity: 1,
              zIndex: 3,
              visible: true,
              locked: false,
              content: 'NƠI VẺ ĐẸP VĨNH CỬU GẶP GỠ BẢN LÃNH CÁ NHÂN',
              styles: { fontFamily: 'Inter', fontSize: 18, fontWeight: '500', color: '#B8921F', textAlign: 'center', letterSpacing: 3 }
            },
            {
              id: 'layer_cta',
              type: 'button',
              name: 'Nút CTA',
              x: 390,
              y: 1100,
              width: 300,
              height: 64,
              rotation: 0,
              opacity: 1,
              zIndex: 4,
              visible: true,
              locked: false,
              content: 'KHÁM PHÁ BỘ SƯU TẬP',
              styles: { backgroundColor: '#D4AF37', color: '#0d0d0c', fontSize: 16, fontWeight: '700', borderRadius: 32, textAlign: 'center' }
            }
          ]
        };
        setDesigns([defaultPoster]);
        setActiveDesign(defaultPoster);
      }
    } catch {
      // Handled
    }
  };

  const handleApplyAiDesignPrompt = async () => {
    if (!designPrompt.trim()) return;
    try {
      const res = await adminAiApi.chat({
        message: `Chỉnh sửa poster: ${designPrompt}`,
        mode: 'creative',
      });
      if (res?.data?.cardData) {
        setActiveDesign(res.data.cardData);
      }
      setDesignPrompt('');
    } catch {
      // Handled
    }
  };

  const handleSaveDesign = async (design: AdminDesignProject) => {
    // History is maintained by the server; sending snapshots back on each save
    // unnecessarily grows the request and does not affect persistence.
    const { _id, name, preset, width, height, background, layers } = design;
    const response = await adminAiApi.saveDesign({ _id, name, preset, width, height, background, layers });
    return response?.data;
  };

  const handleStudioAiEdit = async (request: string, selectedLayerId?: string) => {
    if (!activeDesign?._id) return;
    const res = await adminAiApi.applyDesignOperations({ designId: activeDesign._id, request, selectedLayerId, provider: activeProvider });
    const result = res?.data;
    if (result?.design) {
      setActiveDesign(result.design);
      setDesigns((items) => items.map((item) => item._id === result.design._id ? result.design : item));
    }
  };

  const handleGenerateCopywriting = async () => {
    try {
      const res = await adminAiApi.chat({
        message: `Soạn nội dung ${copyType} phong cách ${copyStyle} cho chủ đề: ${copyTopic}`,
        mode: 'marketing',
      });
      if (res?.data?.message) {
        setGeneratedCopy(res.data.message);
      }
    } catch {
      // Handled
    }
  };

  return (
    <AdminLayout
      title="Admin AI Copilot Workspace"
      subtitle="Trung tâm điều hành thông minh: Phân tích kinh doanh, Marketing Studio, Creative Studio & Tồn kho"
      fullHeight={activeTab === 'creative' || activeTab === 'chat'}
    >
      <div className={activeTab === 'creative' || activeTab === 'chat' ? 'h-full flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden' : 'space-y-6'}>
        {/* Navigation Tabs Bar */}
        <div className="shrink-0 flex items-center gap-2.5 overflow-x-auto pb-3 border-b border-[var(--border)] font-sans text-xs w-full">
          {[
            { id: 'chat', label: 'Trò Chuyện & Điều Hành', icon: MessageSquare, adminOnly: false },
            { id: 'analytics', label: 'Business Intelligence & Doanh Thu', icon: TrendingUp, adminOnly: false },
            { id: 'creative', label: 'Creative Studio (Poster & Banner)', icon: Palette, adminOnly: false },
            { id: 'marketing', label: 'Marketing & Copywriting', icon: Megaphone, adminOnly: false },
            { id: 'reports', label: 'Xuất Báo Cáo Excel/CSV', icon: FileSpreadsheet, adminOnly: false },
            { id: 'settings', label: 'Cấu Hình & Quản Trị AI', icon: Settings, adminOnly: true },
          ]
            .filter((tab) => !tab.adminOnly || isAdmin)
            .map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    const url = new URL(window.location.href);
                    url.searchParams.set('tab', tab.id);
                    window.history.replaceState(null, '', url.toString());
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'admin-tab-active'
                      : 'admin-tab-inactive'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </div>

        {/* TAB 1: INTERACTIVE CHAT & WORKSPACE */}
        {activeTab === 'chat' && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-3 overflow-hidden">
            {/* Conversation History Sidebar */}
            <div className="lg:col-span-1 h-full min-h-0 p-3 sm:p-3.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col shadow-xs overflow-hidden">
              <div className="shrink-0 flex items-center justify-between mb-2.5">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
                  Phiên Làm Việc
                </span>
                <button
                  type="button"
                  onClick={() => newConversation()}
                  className="p-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[#9E7B15] transition-colors cursor-pointer"
                  title="Bắt đầu hội thoại mới"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto admin-content-scrollbar space-y-1.5 pr-1 text-xs">
                {conversationsList.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => loadConversation(c._id)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between group ${
                      conversationId === c._id
                        ? 'bg-[var(--accent)]/15 border-[var(--accent)] font-semibold text-[var(--text)]'
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)]/40'
                    }`}
                  >
                    <span className="truncate pr-2">{c.title || 'Hội thoại không tên'}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        adminAiApi.deleteConversation(c._id).then(() => refreshConversations());
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-500 transition-opacity"
                      title="Xóa phiên"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {conversationsList.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] py-4 text-center">Chưa có lịch sử hội thoại</p>
                )}
              </div>

              <div className="shrink-0 pt-2.5 mt-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)] font-mono flex items-center justify-between">
                <span>AI Core</span>
                <span className="text-[var(--text-muted)] font-bold">Kiểm tra nhà cung cấp trong Cấu Hình</span>
              </div>
            </div>

            {/* Main Chat Stream Area */}
            <div className="lg:col-span-3 h-full min-h-0 p-3 sm:p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col shadow-xs overflow-hidden">
              {/* Message log */}
              <div className="flex-1 min-h-0 overflow-y-auto admin-content-scrollbar space-y-3.5 pr-2 text-xs">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-medium rounded-tr-xs shadow-sm'
                          : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-tl-xs shadow-sm'
                      }`}
                    >
                      {msg.role === 'assistant' ? <SafeMarkdown content={msg.content || ''} /> : msg.content}
                    </div>

                    {/* Generative Cards */}
                    {msg.cardType === 'kpi_metrics' && <AdminAiKpiCard data={msg.cardData} />}
                    {msg.cardType === 'chart_line' && <AdminAiChartCard data={msg.cardData} type="line" />}
                    {msg.cardType === 'chart_bar' && <AdminAiChartCard data={msg.cardData} type="bar" />}
                    {msg.cardType === 'poster_preview' && <AdminAiPosterCard data={msg.cardData} />}
                    {msg.cardType === 'product_list' && <AdminAiProductListCard data={msg.cardData} />}
                    {msg.cardType === 'confirmation_required' && <AdminAiConfirmationCard data={msg.cardData} />}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-fit text-[var(--text-muted)] text-xs shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                    <span>Copilot đang phân tích CSDL và tổng hợp phản hồi...</span>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="shrink-0 mt-3 pt-2.5 border-t border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (input.trim()) {
                          sendMessage(input.trim());
                          setInput('');
                        }
                      }
                    }}
                    placeholder="Nhập yêu cầu: 'Thống kê doanh thu tháng này', 'Sản phẩm bán chậm', 'Thiết kế poster Black Friday'..."
                    className="flex-1 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--accent)] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text)] outline-none transition-colors"
                  />
                  <button
                    type="button"
                    disabled={!input.trim() || isLoading}
                    onClick={() => {
                      if (input.trim()) {
                        sendMessage(input.trim());
                        setInput('');
                      }
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 shadow-sm shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>Gửi</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: BUSINESS INTELLIGENCE & ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Bảng điều khiển kinh doanh & doanh thu thực tế</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {['today', 'this_week', 'this_month', 'last_month', 'this_quarter'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBiPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      biPeriod === p
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold'
                        : 'bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {p === 'today' ? 'Hôm nay' : p === 'this_week' ? 'Tuần này' : p === 'this_month' ? 'Tháng này' : p === 'last_month' ? 'Tháng trước' : 'Quý này'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs text-[var(--text-muted)]">Từ ngày<input aria-label="Từ ngày" type="date" value={biStart} onChange={(event) => setBiStart(event.target.value)} className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text)]" /></label>
              <label className="text-xs text-[var(--text-muted)]">Đến ngày<input aria-label="Đến ngày" type="date" value={biEnd} onChange={(event) => setBiEnd(event.target.value)} className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--text)]" /></label>
              <button type="button" onClick={applyBiRange} className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs text-[var(--accent-contrast)]">Xem khoảng ngày</button>
              {biRangeError && <p role="alert" className="text-xs text-red-600">{biRangeError}</p>}
            </div>

            {biLoading ? (
              <div className="p-12 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
                <span>Đang trích xuất dữ liệu từ MongoDB...</span>
              </div>
            ) : biError ? (
              <div role="alert" className="p-4 text-sm text-red-600">{biError}</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <AdminAiKpiCard data={biSummary} />
                </div>
                <div>
                  <AdminAiChartCard data={biTrend} type="line" />
                  {!biTrend?.dataPoints?.length && <p className="p-4 text-sm text-[var(--text-muted)]">Chưa có dữ liệu doanh thu trong kỳ này.</p>}
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm space-y-2">
                  <h3 className="font-semibold">Tồn kho hiện tại</h3>
                  <p>Sản phẩm đang bán: {biInventory?.totalActiveProducts ?? '—'} · Tổng tồn: {biInventory?.totalStockUnits ?? '—'}</p>
                  <p>Sắp hết hàng: {biInventory?.lowStockCount ?? '—'} · Hết hàng: {biInventory?.outOfStockCount ?? '—'}</p>
                  {biLowStock?.products?.length ? <ul className="space-y-1">{biLowStock.products.map((item: any) => <li key={item.id}>{item.name}: {item.stock}</li>)}</ul> : <p className="text-[var(--text-muted)]">Không có sản phẩm sắp hết hàng.</p>}
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm space-y-2">
                  <h3 className="font-semibold">Khách hàng</h3>
                  <p>Tổng tài khoản khách hàng: {biCustomers?.totalRegisteredUsers ?? '—'}</p>
                  <p>Đăng ký trong kỳ: {biCustomers?.newUsersInPeriod ?? '—'}</p>
                  <p>Khách đặt hàng trong kỳ: {biCustomers?.activeBuyingCustomers ?? '—'}</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm space-y-2">
                  <h3 className="font-semibold">Sản phẩm bán chạy</h3>
                  <p className="text-xs text-[var(--text-muted)]">Theo số lượng trong đơn đã giao đủ điều kiện ghi nhận.</p>
                  {biTopProducts?.products?.length ? <ol className="space-y-1">{biTopProducts.products.map((item: any) => <li key={item.productId}>{item.rank}. {item.name}: {item.totalSold}</li>)}</ol> : <p className="text-[var(--text-muted)]">Chưa có sản phẩm bán trong kỳ.</p>}
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm space-y-2">
                  <h3 className="font-semibold">Sản phẩm bán chậm</h3>
                  <p className="text-xs text-[var(--text-muted)]">Tối đa một sản phẩm ghi nhận trong 30 ngày gần đây, ưu tiên tồn kho cao.</p>
                  {biSlowProducts?.products?.length ? <ul className="space-y-1">{biSlowProducts.products.map((item: any) => <li key={item.id}>{item.name}: tồn {item.stock}, đã bán {item.soldRecent}</li>)}</ul> : <p className="text-[var(--text-muted)]">Không có sản phẩm bán chậm.</p>}
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-sm space-y-2">
                  <h3 className="font-semibold">Hiệu quả chiến dịch</h3>
                  <p className="text-xs text-[var(--text-muted)]">Đơn đã giao đủ điều kiện; doanh số sản phẩm trước voucher và phí vận chuyển.</p>
                  {biCampaigns?.campaigns?.length ? <ul className="space-y-1">{biCampaigns.campaigns.map((item: any) => <li key={item.id}>{item.name}: {item.units} sản phẩm, {item.orders} đơn, {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.itemRevenue)}</li>)}</ul> : <p className="text-[var(--text-muted)]">Chưa có doanh số chiến dịch trong kỳ.</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CREATIVE STUDIO (POSTER & BANNER DESIGNER) */}
        {activeTab === 'creative' && (
          <div className="flex-1 min-h-0 flex flex-col">
            <CreativeStudioEditor
              design={activeDesign}
              onChange={setActiveDesign}
              onSave={handleSaveDesign}
              onAiEdit={handleStudioAiEdit}
            />
          </div>
        )}

        {/* TAB 4: MARKETING & COPYWRITING */}
        {activeTab === 'marketing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-4">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
                Cấu Hình Nội Dung Quảng Cáo
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Kênh truyền thông</label>
                  <select
                    value={copyType}
                    onChange={(e) => setCopyType(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--text)] outline-none"
                  >
                    <option value="facebook_post">Bài đăng Facebook</option>
                    <option value="instagram_caption">Caption Instagram</option>
                    <option value="tiktok_script">Kịch bản Video TikTok</option>
                    <option value="email_marketing">Email Marketing VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Phong cách (Voice & Tone)</label>
                  <select
                    value={copyStyle}
                    onChange={(e) => setCopyStyle(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--text)] outline-none"
                  >
                    <option value="Luxury">Luxury Haute Couture (Sang trọng)</option>
                    <option value="Streetwear">Streetwear & Gen Z (Phá cách)</option>
                    <option value="Minimalist">Minimalist (Tối giản tinh tế)</option>
                    <option value="Editorial">Editorial Tạp Chí (Học thuật)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] mb-1">Chủ đề chiến dịch</label>
                  <input
                    type="text"
                    value={copyTopic}
                    onChange={(e) => setCopyTopic(e.target.value)}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--text)] outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGenerateCopywriting}
                  className="w-full py-2.5 bg-[var(--accent)] text-[var(--accent-contrast)] font-bold rounded-lg hover:bg-[#9E7B15] transition-colors cursor-pointer"
                >
                  Sáng Tạo Nội Dung Bằng AI
                </button>
              </div>
            </div>

            <div className="lg:col-span-2 p-5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] mb-3">
                  Bản Thảo Nội Dung Sáng Tạo
                </div>
                <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text)] leading-relaxed whitespace-pre-wrap min-h-[300px]">
                  {generatedCopy ? <SafeMarkdown content={String(generatedCopy)} /> : 'Nhấp "Sáng Tạo Nội Dung Bằng AI" để tạo bài viết quảng cáo đa kênh theo phong cách lựa chọn.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: REPORTS & EXPORT */}
        {activeTab === 'reports' && (
          <div className="p-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-center space-y-4 max-w-xl mx-auto shadow-sm">
            <FileSpreadsheet className="w-12 h-12 text-[var(--accent)] mx-auto" />
            <h3 className="text-base font-bold text-[var(--text)]">Xuất Báo Cáo Doanh Thu & Bán Hàng (Excel/CSV)</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Báo cáo được tổng hợp trực tiếp từ cơ sở dữ liệu MongoDB thực tế, bao gồm tổng doanh thu, số lượng đơn hàng, giá trị trung bình AOV và danh sách top sản phẩm bán chạy.
            </p>
            <div className="pt-2">
              <a
                href={adminAiApi.getExportReportUrl('this_month')}
                download
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải Báo Cáo Excel (.xlsx)</span>
              </a>
            </div>
          </div>
        )}

        {/* TAB 6: SETTINGS & GOVERNANCE */}
        {activeTab === 'settings' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Top Alert & Budget Overview */}
            {settingsSavedSuccess && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300 flex items-center gap-2 text-xs font-medium">
                <Check className="w-4 h-4 text-green-500" />
                <span>Đã lưu thành công cấu hình Multi-Provider AI & mã khóa bảo mật!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-xs">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-mono mb-1">
                  <span>Ngân Sách AI Tháng Này</span>
                  <span>{settingsData?.usageSummary?.budgetPercent || 0}%</span>
                </div>
                <div className="text-xl font-bold font-mono text-[var(--text)]">
                  ${settingsData?.usageSummary?.monthSpendUsd?.toFixed(2) || '0.00'}{' '}
                  <span className="text-xs text-[var(--text-muted)] font-normal">
                    / ${settingsData?.usageSummary?.monthlyBudgetUsd || 10} USD
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface)] mt-2 overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] transition-all duration-500"
                    style={{ width: `${Math.min(100, settingsData?.usageSummary?.budgetPercent || 0)}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-xs">
                <div className="text-xs text-[var(--text-muted)] font-mono mb-1">Tạo Ảnh Hôm Nay</div>
                <div className="text-xl font-bold font-mono text-[var(--text)]">
                  {settingsData?.usageSummary?.todayImages || 0}{' '}
                  <span className="text-xs text-[var(--text-muted)] font-normal">
                    / {settingsData?.usageSummary?.dailyImageLimit || 20} ảnh
                  </span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-2">Hạn mức làm mới vào 00:00 hàng ngày</div>
              </div>

              <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-xs">
                <div className="text-xs text-[var(--text-muted)] font-mono mb-1">Tổng Lượt Yêu Cầu</div>
                <div className="text-xl font-bold font-mono text-[var(--text)]">
                  {settingsData?.usageSummary?.totalRequests || 0}{' '}
                  <span className="text-xs text-[var(--text-muted)] font-normal">requests</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-2">
                  Tổng tokens: {(settingsData?.usageSummary?.totalTokens || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Provider Connectivity & Health Cards */}
            <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
                    Danh Sách AI Providers & Trạng Thái Kết Nối
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">5 Providers Tích Hợp</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'openai', name: 'OpenAI GPT & GPT Image', defaultModel: 'gpt-4o', badgeColor: 'text-green-500 bg-green-500/10' },
                  { id: 'gemini', name: 'Google Gemini 2.0 & Imagen', defaultModel: 'gemini-2.0-flash-001', badgeColor: 'text-blue-500 bg-blue-500/10' },
                  { id: 'claude', name: 'Anthropic Claude 3.5 Sonnet', defaultModel: 'claude-3-5-sonnet-20241022', badgeColor: 'text-purple-500 bg-purple-500/10' },
                  { id: 'deepseek', name: 'DeepSeek V3 & R1', defaultModel: 'deepseek-chat', badgeColor: 'text-cyan-500 bg-cyan-500/10' },
                  { id: 'flux', name: 'FLUX.1 (Black Forest Labs)', defaultModel: 'flux-1-schnell', badgeColor: 'text-amber-500 bg-amber-500/10' },
                ].map((p) => {
                  const live = settingsData?.providers?.find((prov) => prov.id === p.id);
                  const isConnected = live?.status === 'CONNECTED';
                  const ping = pingResults[p.id];

                  return (
                    <div key={p.id} className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs text-[var(--text)]">{p.name}</span>
                          <span
                            className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              isConnected ? 'bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/30' : 'bg-neutral-500/15 text-neutral-500 border border-neutral-500/30'
                            }`}
                          >
                            {live?.status || 'NOT_CONFIGURED'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[var(--text-muted)]">Mô hình: {live?.defaultModel || p.defaultModel}</div>
                      </div>

                      {/* API Key Override Input */}
                      <div>
                        <label className="block text-[10px] font-mono text-[var(--text-muted)] mb-1">
                          API Key {settingsData?.settings?.maskedKeys?.[p.id] && `(${settingsData.settings.maskedKeys[p.id]})`}
                        </label>
                        {['cloudflare', 'pollinations', 'comfyui'].includes(p.id) ? (
                          <div className="rounded px-2.5 py-2 text-[10px] leading-relaxed bg-[var(--bg)] border border-[var(--border)] text-[var(--text-muted)]">
                            Cấu hình qua biến môi trường backend; không nhập secret vào trình duyệt.
                          </div>
                        ) : (
                          <input
                            type="password"
                            value={apiKeysInput[p.id] || ''}
                            onChange={(e) => setApiKeysInput((prev) => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder={settingsData?.settings?.maskedKeys?.[p.id] ? '••••••••' : 'Nhập API key...'}
                            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded px-2.5 py-1 text-xs text-[var(--text)] font-mono outline-none focus:border-[var(--accent)]"
                          />
                        )}
                      </div>

                      {/* Ping / Test Action */}
                      <div className="pt-1 border-t border-[var(--border)] flex items-center justify-between">
                        <button
                          type="button"
                          disabled={ping?.loading}
                          onClick={() => handleTestPing(p.id)}
                          className="px-2.5 py-1 rounded bg-[var(--bg-alt)] hover:bg-[var(--border)] text-[10px] font-mono text-[var(--text)] transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {ping?.loading ? <Loader2 className="w-3 h-3 animate-spin text-[var(--accent)]" /> : <Activity className="w-3 h-3 text-[var(--accent)]" />}
                          <span>Kiểm Tra Kết Nối</span>
                        </button>

                        {ping?.latencyMs !== undefined && (
                          <span className={`text-[10px] font-mono ${ping.success ? 'text-green-500' : 'text-red-500'}`}>
                            {ping.latencyMs}ms
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart Routing & Limits Configuration Form */}
            <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                <Zap className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)]">
                  Cấu Hình Điều Phối Thông Minh (Smart AI Routing)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-[var(--text-muted)] font-mono mb-1">Provider Mặc Định (Chat & Hỏi Đáp)</label>
                  <select
                    value={settingsForm.defaultProvider}
                    onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, defaultProvider: e.target.value }))}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--text)] outline-none"
                  >
                    <option value="auto">Auto (Hệ thống tự động chọn)</option>
                    <option value="openai">OpenAI GPT-4o</option>
                    <option value="gemini">Google Gemini 2.0</option>
                    <option value="claude">Anthropic Claude 3.5 Sonnet</option>
                    <option value="deepseek">DeepSeek V3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] font-mono mb-1">Provider Tạo Hình Ảnh & Poster</label>
                  <select
                    value={settingsForm.imageDefaultProvider}
                    onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, imageDefaultProvider: e.target.value }))}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--text)] outline-none"
                  >
                    <option value="auto">Auto Free (ưu tiên Local → Cloudflare → Pollinations)</option>
                    <option value="comfyui">Local AI (ComfyUI)</option>
                    <option value="cloudflare">Cloudflare Workers AI (FLUX.1 Schnell)</option>
                    <option value="pollinations">Pollinations AI</option>
                    <option value="openai">OpenAI (GPT Image & DALL-E)</option>
                    <option value="gemini">Google Gemini (Imagen 3)</option>
                    <option value="flux">FLUX.1 (Black Forest Labs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] font-mono mb-1">Provider Phân Tích Dữ Liệu & BI</label>
                  <select
                    value={settingsForm.analyticsDefaultProvider}
                    onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, analyticsDefaultProvider: e.target.value }))}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--text)] outline-none"
                  >
                    <option value="auto">Auto (DeepSeek / OpenAI)</option>
                    <option value="deepseek">DeepSeek V3 (Tối ưu tính toán)</option>
                    <option value="openai">OpenAI GPT-4o</option>
                    <option value="gemini">Google Gemini 2.0</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] font-mono mb-1">Provider Chiến Dịch Marketing & Viết Bài</label>
                  <select
                    value={settingsForm.marketingDefaultProvider}
                    onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, marketingDefaultProvider: e.target.value }))}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--text)] outline-none"
                  >
                    <option value="auto">Auto (Claude / OpenAI)</option>
                    <option value="claude">Anthropic Claude 3.5 (Tối ưu văn phong)</option>
                    <option value="openai">OpenAI GPT-4o</option>
                    <option value="gemini">Google Gemini 2.0</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[var(--border)] text-xs">
                <div>
                  <label className="block text-[var(--text-muted)] font-mono mb-1">Ngân Sách Hàng Tháng (USD)</label>
                  <input
                    type="number"
                    value={settingsForm.monthlyBudgetUsd}
                    onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, monthlyBudgetUsd: Number(e.target.value) }))}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--text)] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-muted)] font-mono mb-1">Giới Hạn Tạo Ảnh / Ngày</label>
                  <input
                    type="number"
                    value={settingsForm.imageDailyLimit}
                    onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, imageDailyLimit: Number(e.target.value) }))}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2.5 text-[var(--text)] outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input
                    type="checkbox"
                    id="fallbackCheckbox"
                    checked={settingsForm.fallbackEnabled}
                    onChange={(e) => setSettingsForm((prev: any) => ({ ...prev, fallbackEnabled: e.target.checked }))}
                    className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                  />
                  <label htmlFor="fallbackCheckbox" className="text-xs text-[var(--text)] cursor-pointer select-none">
                    Bật Fallback Tự Động khi Provider lỗi
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border)] flex justify-end">
                <button
                  type="button"
                  disabled={isSavingSettings}
                  onClick={handleSaveSettings}
                  className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Lưu Cấu Hình Multi-Provider</span>
                </button>
              </div>
            </div>

            {/* Level 1-4 Security Policy Matrix */}
            <div className="p-6 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] space-y-3 shadow-sm">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] border-b border-[var(--border)] pb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Chính Sách & Phân Quyền Bảo Mật Dual AI Agent</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[var(--text-muted)] leading-relaxed">
                <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <div className="font-bold text-[var(--text)]">Level 1 — Read-only</div>
                  <div className="text-[11px] mt-0.5">Tra cứu, thống kê, phân tích dữ liệu bán hàng. Tự động thực thi.</div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                  <div className="font-bold text-[var(--text)]">Level 2 — Draft & Creative</div>
                  <div className="text-[11px] mt-0.5">Tạo bản nháp poster, banner, chiến dịch, copywriting. Tự động thực thi và xem trước.</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
                  <div className="font-bold">Level 3 — Business Mutation (Bắt Buộc Xác Nhận)</div>
                  <div className="text-[11px] mt-0.5">Tạo voucher, kích hoạt chiến dịch, đăng banner, cập nhật giá. Bắt buộc chữ ký HMAC.</div>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
                  <div className="font-bold">Level 4 — Restricted (Bị Chặn Tuyệt Đối)</div>
                  <div className="text-[11px] mt-0.5">Thay đổi Super Admin, đọc mật khẩu, truy cập API Key, xóa log. Bị chặn tuyệt đối.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

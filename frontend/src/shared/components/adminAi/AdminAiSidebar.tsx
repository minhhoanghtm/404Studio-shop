import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sparkles,
  X,
  Maximize2,
  Minimize2,
  Plus,
  Send,
  Loader2,
  TrendingUp,
  Package,
  Palette,
  ShoppingBag,
  Layers,
  ChevronDown,
  Paperclip,
  Image as ImageIcon,
  Cpu,
} from 'lucide-react';
import { useAdminAiStore } from '../../stores/useAdminAiStore';
import { adminAiApi } from '../../api/adminAiApi';
import {
  AdminAiKpiCard,
  AdminAiChartCard,
  AdminAiPosterCard,
  AdminAiConfirmationCard,
  AdminAiProductListCard,
} from './cards/AdminAiCards';
import { SafeMarkdown } from './SafeMarkdown';

export const AdminAiSidebar: React.FC = () => {
  const location = useLocation();
  const {
    isSidebarOpen,
    isExpanded,
    activeMode,
    activeProvider,
    messages,
    isLoading,
    attachments,
    toggleSidebar,
    closeSidebar,
    toggleExpanded,
    setMode,
    setActiveProvider,
    addAttachment,
    removeAttachment,
    clearAttachments,
    newConversation,
    sendMessage,
  } = useAdminAiStore();

  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isSidebarOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSidebarOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await adminAiApi.uploadImageReference(file);
      if (res?.data?.url) {
        addAttachment(res.data.url);
      }
    } catch (err: any) {
      alert('Không thể tải lên hình ảnh: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Context-aware suggested prompts based on current admin route
  const getSuggestedPrompts = () => {
    const path = location.pathname;
    if (path.includes('/products')) {
      return [
        '📦 Kiểm tra những sản phẩm sắp hết hàng',
        '🏷️ Tìm sản phẩm bán chậm để xả tồn',
        '🎨 Thiết kế poster quảng cáo sản phẩm',
      ];
    }
    if (path.includes('/orders')) {
      return [
        '🚚 Thống kê phân bổ trạng thái đơn hàng',
        '⏳ Phân tích các đơn hàng chờ xử lý > 48h',
        '📊 Doanh thu các đơn đã thanh toán',
      ];
    }
    if (path.includes('/campaigns') || path.includes('/coupons')) {
      return [
        '🎨 Thiết kế poster Black Friday Sale',
        '🚀 Lập kế hoạch chiến dịch giảm 30%',
        '🎟️ Chuẩn bị tạo mã voucher giảm 20%',
      ];
    }
    return [
      '📊 Tổng hợp doanh thu tháng này',
      '📈 So sánh doanh thu với tháng trước',
      '🎨 Thiết kế poster quảng cáo mới',
      '💡 Quét cảnh báo và cơ hội kinh doanh',
    ];
  };

  const handleSend = async (textToSend?: string) => {
    const msg = textToSend || input;
    if ((!msg.trim() && attachments.length === 0) || isLoading) return;

    setInput('');
    await sendMessage(msg, {
      route: location.pathname,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isSidebarOpen) return null;

  const widthClass = isExpanded ? 'w-full lg:w-[860px]' : 'w-full sm:w-[460px]';

  return (
    <aside
      role="region"
      aria-label="Admin AI Copilot Panel"
      className={`fixed inset-y-0 right-0 ${widthClass} bg-[var(--bg-sidebar)] border-l border-[var(--border)] shadow-2xl flex flex-col z-[100] transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className="p-3.5 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-sm tracking-wider uppercase font-bold text-[var(--text)]">
                Admin AI Copilot
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--accent-contrast)] font-bold tracking-widest uppercase">
                Multi-AI
              </span>
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)] block">
              Ngữ cảnh: <span className="text-[var(--accent)]">{location.pathname}</span>
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={newConversation}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] rounded-lg transition-colors cursor-pointer"
            title="Tạo phiên làm việc mới"
          >
            <Plus className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleExpanded}
            className="hidden sm:inline-flex p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] rounded-lg transition-colors cursor-pointer"
            title={isExpanded ? 'Thu nhỏ panel' : 'Mở rộng toàn màn hình'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={closeSidebar}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] rounded-lg transition-colors cursor-pointer"
            title="Đóng Copilot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Provider Selector & Mode Bar */}
      <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between gap-2 text-xs">
        {/* Model Provider Dropdown */}
        <div className="flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <select
            value={activeProvider}
            onChange={(e) => setActiveProvider(e.target.value)}
            className="bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded px-2 py-0.5 text-[11px] font-mono outline-none cursor-pointer focus:border-[var(--accent)]"
            title="Lựa chọn AI Model Provider"
          >
            <option value="auto">⚡ Auto (Thông minh)</option>
            <option value="openai">🟢 OpenAI (GPT-4o & GPT Image)</option>
            <option value="gemini">🔵 Google Gemini 2.0</option>
            <option value="claude">🟣 Anthropic Claude 3.5</option>
            <option value="deepseek">🔷 DeepSeek V3</option>
          </select>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono">
          {[
            { id: 'auto', label: 'Tự Động' },
            { id: 'analytics', label: 'Doanh Thu' },
            { id: 'marketing', label: 'Marketing' },
            { id: 'creative', label: 'Poster' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`px-2 py-0.5 rounded shrink-0 transition-all cursor-pointer ${
                activeMode === m.id
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs overscroll-contain">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[92%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-medium rounded-tr-xs shadow-sm'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-tl-xs shadow-sm'
              }`}
            >
              {msg.role === 'assistant' ? <SafeMarkdown content={msg.content} /> : msg.content}
            </div>

            {/* Injected Generative Card Presentation */}
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
            <span>Copilot đang phân tích CSDL và điều phối mô hình AI...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Action Prompts */}
      <div className="p-2 bg-[var(--bg)] border-t border-[var(--border)] overflow-x-auto flex items-center gap-1.5 shrink-0">
        {getSuggestedPrompts().map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(prompt)}
            className="px-2.5 py-1 rounded-full bg-[var(--surface)] hover:bg-[var(--bg-alt)] border border-[var(--border)] text-[10px] text-[var(--text)] font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-[var(--surface)] border-t border-[var(--border)] shrink-0">
        {/* Uploaded attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-2 flex items-center gap-2 overflow-x-auto p-1.5 bg-[var(--bg)] rounded-lg border border-[var(--border)]">
            {attachments.map((url, i) => (
              <div key={i} className="relative group shrink-0">
                <img src={url} alt="Attachment" className="w-12 h-12 object-cover rounded border border-[var(--border)]" />
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative flex items-center rounded-xl bg-[var(--bg)] border border-[var(--border)] focus-within:border-[var(--accent)] transition-colors p-1">
          {/* File Upload Trigger */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] rounded-lg transition-colors cursor-pointer shrink-0"
            title="Tải ảnh sản phẩm / poster tham chiếu"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" /> : <ImageIcon className="w-4 h-4" />}
          </button>

          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={attachments.length > 0 ? "Hỏi hoặc yêu cầu phân tích hình ảnh này..." : "Hỏi doanh thu, xả tồn kho, poster Black Friday..."}
            className="flex-1 bg-transparent border-none outline-none resize-none px-2 py-1.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)]"
          />
          <button
            type="button"
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            onClick={() => handleSend()}
            className="p-2.5 rounded-lg bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] disabled:opacity-40 transition-all cursor-pointer self-end shadow-xs shrink-0"
            title="Gửi câu lệnh"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono px-1">
          <span>Nhấn Enter để gửi, Shift+Enter xuống dòng</span>
          <span>Multi-Provider AI Gateway</span>
        </div>
      </div>
    </aside>
  );
};

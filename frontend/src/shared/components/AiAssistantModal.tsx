import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  RotateCw,
  ShoppingBag,
  ShieldAlert,
  ShieldCheck,
  Lock,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { aiApi } from '../api';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import { evaluateSecurityPolicy } from '../utils/aiSecurityGuard';
import { SecurityVerificationModal, SensitiveActionType } from './security/SecurityVerificationModal';

type PendingAction = Record<string, unknown> & {
  actionType?: string;
  actionId?: string;
  items?: any[];
  totalEstimatedPrice?: number;
  totalEstimatedPriceFormatted?: string;
};

interface CandidateProduct {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  price?: number;
  new_price?: string;
  finalPrice?: number;
  price_number?: number;
  image?: string;
  available_colors?: string[];
  available_sizes?: string[];
  total_stock?: number;
  variants?: Array<{
    variant_id: string;
    color?: string;
    size?: string;
    stock?: number;
  }>;
}

interface Message {
  role: 'assistant' | 'user';
  text: string;
  candidateProducts?: CandidateProduct[];
  selectedProduct?: CandidateProduct | null;
  pendingAction?: PendingAction | null;
  actionResult?: any;
  executedTools?: string[];
  securityAction?: {
    actionType: SensitiveActionType;
    actionButtonLabel: string;
  } | null;
}

const initialMessage: Message = {
  role: 'assistant',
  text: `Kính chào quý khách! 👋 Em là Trợ lý Mua sắm & Stylist AI của Atelier Vérité.\n\nEm có thể giúp quý khách tìm kiếm trang phục Haute Couture, chọn bảng size chuẩn xác, phối đồ theo phong cách cá nhân, áp dụng ưu đãi voucher và thêm sản phẩm vào giỏ hàng thật ngay trong cuộc trò chuyện.\n\nHôm nay quý khách đang tìm kiếm phong cách thời trang nào ạ?`,
};

const extractProducts = (data: any): CandidateProduct[] => {
  const result = [
    data?.candidateProducts,
    data?.recommendations,
    data?.actionResult?.products,
    data?.actionResult?.items,
    data?.products,
  ].find(Array.isArray);

  return Array.isArray(result)
    ? result.filter((item) => item && (item.slug || item.name))
    : [];
};

const textFrom = (data: any) =>
  data?.reply ||
  data?.aiMessage?.content ||
  data?.answer ||
  data?.message ||
  'Hệ thống AI đã tiếp nhận yêu cầu của quý khách.';

export const AiAssistantModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>(
    () => `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, { color?: string; size?: string }>
  >({});

  // Security Verification Modal state
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [selectedSecurityAction, setSelectedSecurityAction] =
    useState<SensitiveActionType>('PASSWORD_CHANGE');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  if (!isOpen) return null;

  const handleOpenSecurityModal = (actionType: SensitiveActionType) => {
    setSelectedSecurityAction(actionType);
    setSecurityModalOpen(true);
  };

  const handleSecurityActionComplete = (result: {
    success: boolean;
    actionType: SensitiveActionType;
    message: string;
  }) => {
    setMessages((current) => [
      ...current,
      {
        role: 'assistant',
        text: `[Xác Thực Thành Công] ${result.message}`,
      },
    ]);
  };

  const syncCartFromResponse = (data: any) => {
    const actionResult = data?.actionResult;
    const addedItems =
      actionResult?.addedItems || actionResult?.items || data?.addedItems;

    if (Array.isArray(addedItems) && addedItems.length > 0) {
      for (const it of addedItems) {
        useCartStore.getState().addItem({
          productId: it.product_id || it.productId || 'p-item',
          productSlug: it.slug || 'product',
          name: it.name || 'Sản phẩm Atelier Vérité',
          price: Number(it.unit_price || it.price || 0),
          selectedColor: it.color || 'Tiêu chuẩn',
          selectedColorHex: '#000000',
          selectedSize: it.size || 'Freesize',
          quantity: Number(it.quantity || 1),
          image: it.image || '',
        });
      }
    }
  };

  const send = async (
    content: string,
    pendingAction?: PendingAction,
    cancel = false
  ) => {
    if (!content.trim() || isLoading) return;

    // Evaluate Security Policies, RBAC, and Sensitive Action rules
    const securityCheck = evaluateSecurityPolicy(content, isAuthenticated);

    if (securityCheck.isBlocked) {
      const userText = content;
      setInput('');

      const assistantMsg: Message = {
        role: 'assistant',
        text:
          securityCheck.replyMessage ||
          'Thao tác không được phép thực hiện qua khung trò chuyện.',
        securityAction:
          securityCheck.requiresSecurityModal && securityCheck.sensitiveActionType
            ? {
                actionType: securityCheck.sensitiveActionType,
                actionButtonLabel:
                  securityCheck.actionButtonLabel || 'Mở Giao Diện Xác Minh OTP',
              }
            : null,
      };

      setMessages((current) => [
        ...current,
        { role: 'user', text: userText },
        assistantMsg,
      ]);
      return;
    }

    setInput('');
    setMessages((current) => [...current, { role: 'user', text: content }]);
    setIsLoading(true);

    try {
      const response = await aiApi.chat(content, {
        conversationId,
        confirmAction: cancel ? undefined : pendingAction,
        cancelAction: cancel ? pendingAction || true : undefined,
      });

      const data = response?.data ?? response;
      setConversationId(data?.conversationId || conversationId);

      // Synchronize cart state if mutation executed
      syncCartFromResponse(data);

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: textFrom(data),
          candidateProducts: extractProducts(data),
          selectedProduct: data?.selectedProduct || null,
          pendingAction: data?.pendingAction || null,
          actionResult: data?.actionResult || null,
          executedTools: data?.executedTools || [],
        },
      ]);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            error?.message ||
            'Không thể kết nối Stylist AI lúc này. Không có thay đổi nào được thực hiện.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectColor = (prodKey: string, color: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [prodKey]: { ...prev[prodKey], color },
    }));
  };

  const selectSize = (prodKey: string, size: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [prodKey]: { ...prev[prodKey], size },
    }));
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Stylist AI"
      >
        <div className="bg-surface border border-theme w-full sm:max-w-2xl sm:rounded-sm shadow-2xl flex flex-col h-[90vh] sm:h-[720px] text-primary min-w-0">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between bg-surface-subtle/80">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center text-accent shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-base tracking-wide truncate">
                  Stylist AI Atelier Vérité
                </h3>
                <span className="text-[11px] text-secondary">
                  Trợ lý Mua sắm Thông minh & Vector Search
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-secondary hover:text-primary rounded-lg transition-colors"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 text-xs">
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={index}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[88%] p-4 leading-relaxed rounded-sm min-w-0 space-y-3 ${
                      isUser
                        ? 'bg-accent text-black font-medium'
                        : 'bg-surface-subtle border border-theme text-primary'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>

                    {/* Tool Execution Status Pills */}
                    {message.executedTools && message.executedTools.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {message.executedTools.map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-accent/15 border border-accent/30 text-accent font-mono rounded"
                          >
                            <CheckCircle2 className="w-3 h-3 text-accent" />
                            Đã thực thi: {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Candidate Product Cards */}
                    {message.candidateProducts && message.candidateProducts.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="text-[11px] font-semibold tracking-wider uppercase text-accent">
                          Thiết kế gợi ý ({message.candidateProducts.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {message.candidateProducts.map((prod, pIdx) => {
                            const prodKey = prod.id || prod._id || prod.slug || `prod-${pIdx}`;
                            const chosenColor = selectedVariants[prodKey]?.color;
                            const chosenSize = selectedVariants[prodKey]?.size;
                            const colors = prod.available_colors || ['Đen', 'Trắng'];
                            const sizes = prod.available_sizes || ['S', 'M', 'L'];
                            const displayPrice =
                              typeof prod.finalPrice === 'number'
                                ? prod.finalPrice
                                : typeof prod.price_number === 'number'
                                ? prod.price_number
                                : typeof prod.price === 'number'
                                ? prod.price
                                : null;

                            return (
                              <div
                                key={prodKey}
                                data-testid="ai-product-card"
                                className="bg-surface border border-theme hover:border-accent/80 p-3 flex flex-col justify-between gap-2.5 transition-all"
                              >
                                {prod.image && (
                                  <div className="w-full h-28 bg-surface-subtle overflow-hidden border border-theme/60 flex items-center justify-center">
                                    <img
                                      src={prod.image}
                                      alt={prod.name || 'Sản phẩm'}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                )}

                                <div className="min-w-0">
                                  <Link
                                    to={`/products/${prod.slug || ''}`}
                                    onClick={onClose}
                                    className="font-serif text-[12px] font-medium hover:text-accent line-clamp-1 block"
                                  >
                                    {prod.name || 'Thiết kế Atelier'}
                                  </Link>
                                  <div className="font-mono text-[11px] font-bold text-accent mt-0.5">
                                    {displayPrice !== null
                                      ? formatCurrency(displayPrice)
                                      : 'Liên hệ tư vấn'}
                                  </div>
                                </div>

                                {/* Variant Selector: Colors */}
                                {colors.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-secondary block">Màu sắc:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {colors.map((c) => (
                                        <button
                                          key={c}
                                          type="button"
                                          onClick={() => selectColor(prodKey, c)}
                                          className={`px-1.5 py-0.5 text-[10px] border transition-colors ${
                                            chosenColor === c
                                              ? 'border-accent bg-accent/20 text-accent font-semibold'
                                              : 'border-theme text-secondary hover:text-primary'
                                          }`}
                                        >
                                          {c}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Variant Selector: Sizes */}
                                {sizes.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-[10px] text-secondary block">Kích cỡ:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {sizes.map((s) => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={() => selectSize(prodKey, s)}
                                          className={`px-1.5 py-0.5 text-[10px] border transition-colors ${
                                            chosenSize === s
                                              ? 'border-accent bg-accent/20 text-accent font-semibold'
                                              : 'border-theme text-secondary hover:text-primary'
                                          }`}
                                        >
                                          {s}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => void send(`Tôi chọn mẫu ${prod.name}`)}
                                    className="px-2 py-1.5 border border-theme text-[10px] text-secondary hover:text-primary hover:border-accent font-medium text-center"
                                  >
                                    Chọn mẫu
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const variantText = [chosenColor, chosenSize ? `size ${chosenSize}` : '']
                                        .filter(Boolean)
                                        .join(' ');
                                      void send(
                                        `Thêm sản phẩm ${prod.name} ${variantText} vào giỏ hàng giúp tôi`
                                      );
                                    }}
                                    className="px-2 py-1.5 bg-accent text-black text-[10px] font-semibold hover:bg-accent/90 flex items-center justify-center gap-1"
                                  >
                                    <ShoppingBag className="w-3 h-3 shrink-0" />
                                    <span>Thêm giỏ</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Pending Cart / Checkout Action Confirmation Card */}
                    {message.pendingAction && (
                      <div className="mt-3 p-3 bg-surface border border-accent/50 rounded space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-accent">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Xác nhận thêm vào giỏ hàng</span>
                        </div>
                        {message.pendingAction.totalEstimatedPriceFormatted && (
                          <div className="text-[11px] text-secondary">
                            Tổng tạm tính:{' '}
                            <span className="font-mono text-accent font-bold">
                              {message.pendingAction.totalEstimatedPriceFormatted}
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() =>
                              void send('Xác nhận', message.pendingAction ?? undefined)
                            }
                            className="px-3 py-1.5 bg-accent text-black text-xs font-semibold hover:bg-accent/90 disabled:opacity-50"
                          >
                            Xác nhận thao tác
                          </button>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() =>
                              void send('Hủy', message.pendingAction ?? undefined, true)
                            }
                            className="px-3 py-1.5 border border-theme text-secondary hover:text-primary text-xs disabled:opacity-50"
                          >
                            Hủy bỏ
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sensitive Security Action Button */}
                    {message.securityAction && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-[#d4af37]">
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span className="font-serif uppercase tracking-wider font-semibold">
                            Yêu Cầu Xác Minh Bảo Mật OTP
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenSecurityModal(
                              message.securityAction!.actionType
                            )
                          }
                          className="w-full py-2.5 px-4 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-black font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-[#d4af37]/20"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>{message.securityAction.actionButtonLabel}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-primary/20 border border-theme flex items-center justify-center text-primary shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 items-center text-secondary">
                <Bot className="w-4 h-4 text-accent" />
                <RotateCw className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>Stylist đang kiểm tra dữ liệu cửa hàng và kho...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer warning */}
          <div className="px-4 pb-2 flex items-center gap-2 text-[10px] text-secondary">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            Không chia sẻ OTP, mật khẩu hoặc số thẻ thanh toán trong khung chat. Dữ liệu giá & tồn kho được xác minh trực tiếp từ máy chủ.
          </div>

          {/* Input form */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="p-3 sm:p-4 border-t border-theme bg-surface flex gap-2"
          >
            <input
              type="text"
              data-testid="ai-chat-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={5000}
              placeholder="Ví dụ: Thêm áo thể thao vào giỏ, hoặc chính sách đổi trả hàng..."
              className="flex-1 min-w-0 px-4 py-2.5 text-xs bg-surface-subtle border border-theme focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              data-testid="ai-chat-send-btn"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2.5 bg-primary text-secondary hover:bg-accent hover:text-black disabled:opacity-50 transition-colors"
              aria-label="Gửi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Independent Security Verification Modal */}
      <SecurityVerificationModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        actionType={selectedSecurityAction}
        initialIdentifier={user?.email || user?.phone || undefined}
        onActionComplete={handleSecurityActionComplete}
      />
    </>
  );
};

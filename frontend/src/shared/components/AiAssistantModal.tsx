import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShoppingBag,
  ShieldAlert,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Headphones,
  ArrowDown,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiApi } from '../api';
import { communicationApi, StaffStatusResponse } from '../api/communicationApi';
import { socketService, MessageNewPayload } from '../services/socketService';
import { formatCurrency } from '../utils/formatters';
import { useAuthStore } from '../stores/useAuthStore';
import { useCartStore } from '../stores/useCartStore';
import { useToastStore } from '../stores/useToastStore';
import { evaluateSecurityPolicy } from '../utils/aiSecurityGuard';
import { SecurityVerificationModal, SensitiveActionType } from './security/SecurityVerificationModal';
import { useModal, ModalPortal } from '../context/ModalContext';
import { Z_INDEX } from '../config/zIndex';

type ChatMode = 'ai' | 'staff';

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

interface PendingAction {
  actionType?: string;
  actionId?: string;
  items?: any[];
  totalEstimatedPrice?: number;
  totalEstimatedPriceFormatted?: string;
  [key: string]: any;
}

interface QuickReply {
  label: string;
  action?: string;
  url?: string;
  payload?: any;
}

interface ChatMessage {
  id: string;
  clientMessageId?: string;
  role: 'assistant' | 'user' | 'staff' | 'system';
  text: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
  candidateProducts?: CandidateProduct[];
  selectedProduct?: CandidateProduct | null;
  pendingAction?: PendingAction | null;
  actionResult?: any;
  executedTools?: string[];
  quickReplies?: QuickReply[];
  suggestedVariants?: { colors?: string[]; sizes?: string[] };
  handoffReady?: boolean;
  securityAction?: {
    actionType: SensitiveActionType;
    actionButtonLabel: string;
  } | null;
}

const INITIAL_AI_MESSAGE: ChatMessage = {
  id: 'msg_ai_welcome',
  role: 'assistant',
  text: `Kính chào quý khách! 👋 Em là Trợ lý Mua sắm & Stylist AI của Atelier Vérité.\n\nEm có thể giúp quý khách tìm kiếm trang phục Haute Couture, chọn bảng size chuẩn xác, phối đồ theo phong cách cá nhân, áp dụng ưu đãi voucher và thêm sản phẩm vào giỏ hàng thật ngay trong cuộc trò chuyện.\n\nHôm nay quý khách đang tìm kiếm phong cách thời trang nào ạ?`,
  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  quickReplies: [
    { label: 'Tìm áo', action: 'search' },
    { label: 'Xem giỏ hàng', action: 'view_cart', url: '/cart' },
    { label: 'Chính sách đổi trả', action: 'policy' },
    { label: 'Gặp nhân viên', action: 'switch_to_staff' },
  ],
};

const INITIAL_STAFF_WELCOME: ChatMessage = {
  id: 'msg_staff_welcome',
  role: 'staff',
  text: 'Kính chào quý khách! Đội ngũ Chuyên viên Tư vấn & CSKH của Atelier Vérité luôn sẵn sàng lắng nghe và hỗ trợ quý khách về số đo may đo, thông tin sản phẩm và tình trạng đơn hàng.',
  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
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

const renderSafeMessage = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={index}>{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    )
  );

const ProductImage: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <ShoppingBag className="w-5 h-5 text-[var(--text-muted)]" aria-label="Ảnh sản phẩm không khả dụng" />;
  }
  return <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" onError={() => setFailed(true)} />;
};

export const AiAssistantModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { overlayZIndex, contentZIndex } = useModal({
    id: 'ai-concierge-modal',
    isOpen,
    onClose,
  });

  const { isAuthenticated, user } = useAuthStore();
  const { addToast } = useToastStore();

  // Mode: 'ai' vs 'staff'
  const [currentMode, setCurrentMode] = useState<ChatMode>('ai');

  // Independent message states for each mode
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([INITIAL_AI_MESSAGE]);
  const [staffMessages, setStaffMessages] = useState<ChatMessage[]>([INITIAL_STAFF_WELCOME]);

  // Input states
  const [aiInput, setAiInput] = useState('');
  const [staffInput, setStaffInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isStaffSending, setIsStaffSending] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // AI Session ID
  const [aiConversationId, setAiConversationId] = useState<string>(
    () => `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );

  // Staff Connection State
  const [staffStatus, setStaffStatus] = useState<StaffStatusResponse>({
    success: true,
    isStaffOnline: false,
    onlineStaffCount: 0,
    statusText: 'Đang kết nối nhân viên...',
  });
  const [isStaffTyping, setIsStaffTyping] = useState(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Guest State in Staff Mode
  const [guestId, setGuestId] = useState<string>(() => {
    return localStorage.getItem('atelier_chat_guest_id') || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  });
  const [guestConversationId, setGuestConversationId] = useState<string>(() => {
    return localStorage.getItem('atelier_chat_guest_conv_id') || '';
  });
  const [guestInfo, setGuestInfo] = useState<{ name: string; phone: string; email: string }>(() => {
    try {
      const saved = localStorage.getItem('atelier_chat_guest_info');
      return saved ? JSON.parse(saved) : { name: '', phone: '', email: '' };
    } catch {
      return { name: '', phone: '', email: '' };
    }
  });
  const [isGuestFormSubmitted, setIsGuestFormSubmitted] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('atelier_chat_guest_conv_id'));
  });

  // Variant selector memory for AI product cards
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, { color?: string; size?: string }>
  >({});

  // Security Verification Modal
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [selectedSecurityAction, setSelectedSecurityAction] =
    useState<SensitiveActionType>('PASSWORD_CHANGE');

  // Scroll controls
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // Sync guest ID to localStorage
  useEffect(() => {
    if (guestId) {
      localStorage.setItem('atelier_chat_guest_id', guestId);
    }
  }, [guestId]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle external open-stylist-ai custom events with prefilled prompt
  useEffect(() => {
    const handleCustomPrompt = (e: any) => {
      const prompt = e?.detail?.prompt;
      if (prompt) {
        setAiInput(prompt);
        setCurrentMode('ai');
      }
    };
    window.addEventListener('open-stylist-ai', handleCustomPrompt);
    return () => window.removeEventListener('open-stylist-ai', handleCustomPrompt);
  }, []);

  // Fetch Staff Status & connect socket when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    // Fetch initial presence
    communicationApi.getStaffStatus().then((status) => {
      if (mounted) {
        setStaffStatus(status);
      }
    });

    // Connect Socket.IO
    socketService.connect();

    // Listen to staff presence
    const unsubStaff = socketService.onStaffStatus((data) => {
      if (mounted) {
        setStaffStatus((prev) => ({
          ...prev,
          isStaffOnline: data.isStaffOnline,
          onlineStaffCount: data.onlineStaffCount ?? (data.isStaffOnline ? 1 : 0),
          statusText: data.isStaffOnline
            ? 'Nhân viên đang online'
            : 'Hiện chưa có nhân viên, để lại tin nhắn, chúng tôi sẽ phản hồi sớm',
        }));
      }
    });

    // Listen to new real-time messages
    const unsubMsg = socketService.onMessageNew((payload: MessageNewPayload) => {
      if (!mounted) return;
      const { message } = payload;
      const convId = message.conversationId;
      const isSystem =
        message.senderType === 'system' ||
        (message as any).messageType === 'system' ||
        message.metadata?.action === 'staff_joined' ||
        message.metadata?.action === 'conversation_closed' ||
        message.metadata?.action === 'conversation_reopened';

      // Only handle if message belongs to current guest or user
      const isRelevant =
        convId === guestConversationId ||
        (guestConversationId && convId === guestConversationId) ||
        message.senderGuestId === guestId ||
        (payload.conversation && (
          payload.conversation.guestId === guestId ||
          (user && (
            payload.conversation.customerId === ((user as any)?._id || (user as any)?.id) ||
            payload.conversation.customerId?._id === ((user as any)?._id || (user as any)?.id)
          ))
        )) ||
        (!guestConversationId && (isSystem || message.senderType === 'admin'));

      if (isRelevant) {
        if (convId && !guestConversationId) {
          setGuestConversationId(convId);
          localStorage.setItem('atelier_chat_guest_conv_id', convId);
        }

        // If staff joined or messaged, automatically switch to staff mode
        if (isSystem || message.senderType === 'admin') {
          setCurrentMode('staff');
        }

        const isFromAdmin = message.senderType === 'admin';
        const role: ChatMessage['role'] = isSystem ? 'system' : isFromAdmin ? 'staff' : 'user';
        const incomingId = String(message._id || message.id || `m_${Date.now()}`);
        const clientMessageId = message.clientMessageId;

        const newMsg: ChatMessage = {
          id: incomingId,
          clientMessageId,
          role,
          text: message.content,
          timestamp: new Date(message.createdAt || Date.now()).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        setStaffMessages((prev) => {
          // Reconcile if message already exists (optimistic or duplicate socket event)
          const existingIndex = prev.findIndex((m) => {
            if (m.id === incomingId) return true;
            if (clientMessageId && (m.id === clientMessageId || m.clientMessageId === clientMessageId)) return true;
            if (m.role === newMsg.role && m.text === newMsg.text && m.id.startsWith('staff_user_')) return true;
            return false;
          });

          if (existingIndex >= 0) {
            const next = [...prev];
            next[existingIndex] = {
              ...next[existingIndex],
              id: incomingId,
              clientMessageId: clientMessageId || next[existingIndex].clientMessageId,
              status: 'sent',
              timestamp: newMsg.timestamp,
            };
            return next;
          }
          return [...prev, newMsg];
        });

        setIsStaffTyping(false);
      }
    });

    // Listen to staff:joined event specifically
    const unsubStaffJoined = socketService.onStaffJoined((data) => {
      if (!mounted) return;
      const isMatch = !guestConversationId || data.conversationId === guestConversationId;
      if (isMatch) {
        setCurrentMode('staff');
        if (data.conversationId && !guestConversationId) {
          setGuestConversationId(data.conversationId);
          localStorage.setItem('atelier_chat_guest_conv_id', data.conversationId);
        }
        const text = data.message || `${data.staffName || 'Nhân viên'} đã tham gia cuộc trò chuyện`;
        const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

        setStaffMessages((prev) => {
          if (prev.some((m) => m.role === 'system' && m.text === text)) return prev;
          return [
            ...prev,
            {
              id: `staff_join_${Date.now()}`,
              role: 'system',
              text,
              timestamp: time,
            },
          ];
        });
      }
    });

    // Listen to typing indicators
    const unsubTypingStart = socketService.onTypingStart((data) => {
      if (!mounted) return;
      if (data.role === 'admin' || data.senderName?.includes('Nhân viên')) {
        setIsStaffTyping(true);
      }
    });

    const unsubTypingStop = socketService.onTypingStop(() => {
      if (!mounted) return;
      setIsStaffTyping(false);
    });

    return () => {
      mounted = false;
      unsubStaff();
      unsubMsg();
      unsubStaffJoined();
      unsubTypingStart();
      unsubTypingStop();
    };
  }, [isOpen, guestConversationId, guestId, user]);

  // Join room when guestConversationId is available
  useEffect(() => {
    if (guestConversationId) {
      if (guestId && !isAuthenticated) {
        socketService.joinGuest(guestConversationId, guestId);
      } else if (isAuthenticated) {
        socketService.joinConversation(guestConversationId);
      }
    }
  }, [guestConversationId, guestId, isAuthenticated]);

  // Load conversation history on modal open if a conversation exists
  useEffect(() => {
    if (!isOpen) return;

    let active = true;
    const syncHistory = async () => {
      try {
        let targetConvId = guestConversationId;

        // For logged-in user: find their active support conversation if none in state
        if (isAuthenticated && !targetConvId) {
          const convRes: any = await communicationApi.getCustomerConversations();
          const convs = convRes?.data?.items || convRes?.items || convRes?.data || [];
          if (Array.isArray(convs) && convs.length > 0) {
            const supportConv = convs.find((c: any) => c.type === 'support' && c.status !== 'closed') || convs[0];
            if (supportConv) {
              targetConvId = String(supportConv._id || supportConv.id);
              setGuestConversationId(targetConvId);
              localStorage.setItem('atelier_chat_guest_conv_id', targetConvId);
            }
          }
        }

        if (!targetConvId) return;

        let historyMsgs: any[] = [];
        if (!isAuthenticated && guestId) {
          const res: any = await communicationApi.getGuestMessages(targetConvId, guestId);
          historyMsgs = res?.data?.messages || res?.messages || [];
        } else if (isAuthenticated) {
          const res: any = await communicationApi.getCustomerMessages(targetConvId);
          historyMsgs = res?.data?.items || res?.items || res?.data?.messages || res?.messages || [];
        }

        if (active && Array.isArray(historyMsgs) && historyMsgs.length > 0) {
          const mapped: ChatMessage[] = historyMsgs.map((m: any) => {
            const isSys =
              m.senderType === 'system' ||
              m.messageType === 'system' ||
              m.metadata?.action === 'staff_joined' ||
              m.metadata?.action === 'conversation_closed' ||
              m.metadata?.action === 'conversation_reopened';
            const role: ChatMessage['role'] = isSys
              ? 'system'
              : m.senderType === 'admin'
              ? 'staff'
              : 'user';
            return {
              id: String(m._id || m.id || `hist_${Date.now()}`),
              clientMessageId: m.clientMessageId,
              role,
              text: m.content || '',
              timestamp: new Date(m.createdAt || Date.now()).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            };
          });

          setStaffMessages(mapped);
          setIsGuestFormSubmitted(true);
        }
      } catch {
        // Fallback gracefully
      }
    };

    syncHistory();

    return () => {
      active = false;
    };
  }, [isOpen, guestConversationId, guestId, isAuthenticated]);

  // Auto-scroll when messages update
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  const currentMessages = currentMode === 'ai' ? aiMessages : staffMessages;

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(true);
    }
  }, [currentMessages.length, isAiLoading, isOpen, currentMode, scrollToBottom]);

  // Monitor scroll for "Scroll to bottom" button
  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBottomBtn(distanceToBottom > 120);
  };

  if (!isOpen) return null;

  // Security Verification Modal handlers
  const handleOpenSecurityModal = (actionType: SensitiveActionType) => {
    setSelectedSecurityAction(actionType);
    setSecurityModalOpen(true);
  };

  const handleSecurityActionComplete = (result: {
    success: boolean;
    actionType: SensitiveActionType;
    message: string;
  }) => {
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setAiMessages((current) => [
      ...current,
      {
        id: `sec_res_${Date.now()}`,
        role: 'assistant',
        text: `[Xác Thực Thành Công] ${result.message}`,
        timestamp: time,
      },
    ]);
  };

  // Synchronize cart state if AI tool executed cart additions
  const syncCartFromResponse = (data: any) => {
    const actionResult = data?.actionResult;
    if (actionResult?.success && actionResult?.status === 'EXECUTED' && actionResult?.actionType === 'add_to_cart') {
      void useCartStore.getState().validateCartWithBackend();
      addToast('Đã đồng bộ giỏ hàng từ Stylist AI!', 'success');
    }
  };

  // =========================================================================
  // AI MODE: Send message & handle tools
  // =========================================================================
  const sendAi = async (
    content: string,
    pendingAction?: PendingAction,
    cancel = false
  ) => {
    if (!content.trim() || isAiLoading) return;
    setNetworkError(null);

    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // Evaluate Security Policies & RBAC
    const securityCheck = evaluateSecurityPolicy(content, isAuthenticated);

    if (securityCheck.isBlocked) {
      const userText = content;
      setAiInput('');

      const assistantMsg: ChatMessage = {
        id: `msg_sec_${Date.now()}`,
        role: 'assistant',
        text:
          securityCheck.replyMessage ||
          'Thao tác không được phép thực hiện qua khung trò chuyện.',
        timestamp: time,
        securityAction:
          securityCheck.requiresSecurityModal && securityCheck.sensitiveActionType
            ? {
                actionType: securityCheck.sensitiveActionType,
                actionButtonLabel:
                  securityCheck.actionButtonLabel || 'Mở Giao Diện Xác Minh OTP',
              }
            : null,
      };

      setAiMessages((current) => [
        ...current,
        { id: `msg_user_${Date.now()}`, role: 'user', text: userText, timestamp: time },
        assistantMsg,
      ]);
      return;
    }

    setAiInput('');
    setAiMessages((current) => [
      ...current,
      { id: `msg_user_${Date.now()}`, role: 'user', text: content, timestamp: time },
    ]);
    setIsAiLoading(true);

    try {
      const response = await aiApi.chat(content, {
        conversationId: aiConversationId,
        confirmAction: cancel ? undefined : pendingAction,
        cancelAction: cancel ? pendingAction || true : undefined,
      });

      const data = response?.data ?? response;
      setAiConversationId(data?.conversationId || aiConversationId);

      // Synchronize cart state if mutation executed
      syncCartFromResponse(data);

      const respTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      setAiMessages((current) => [
        ...current,
        {
          id: `msg_bot_${Date.now()}`,
          role: 'assistant',
          text: textFrom(data),
          timestamp: respTime,
          candidateProducts: extractProducts(data),
          selectedProduct: data?.selectedProduct || null,
          pendingAction: data?.pendingAction || null,
          actionResult: data?.actionResult || null,
          executedTools: data?.executedTools || [],
          quickReplies: data?.quickReplies || [],
          suggestedVariants: data?.suggestedVariants || null,
          handoffReady: Boolean(data?.handoffReady),
        },
      ]);
    } catch (error: any) {
      setNetworkError(error?.message || 'Không thể kết nối Stylist AI. Vui lòng thử lại.');
      setAiMessages((current) => [
        ...current,
        {
          id: `msg_err_${Date.now()}`,
          role: 'assistant',
          text:
            error?.message ||
            'Không thể kết nối Stylist AI lúc này. Quý khách vui lòng thử lại hoặc bấm "Chuyển sang nhân viên".',
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          handoffReady: true,
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // =========================================================================
  // HANDOFF TO STAFF: Transfer 5 recent AI messages as context
  // =========================================================================
  const handleHandoffToStaff = async () => {
    // Collect up to 5 recent turns
    const recentTurns = aiMessages.slice(-5).map((m) => ({
      role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
      text: m.text,
    }));

    setCurrentMode('staff');

    // If guest and not yet initialized, initiate guest session with handoff
    if (!isAuthenticated && !guestConversationId && guestInfo.name) {
      try {
        const initRes: any = await communicationApi.initGuestChat({
          guestId,
          name: guestInfo.name || 'Khách Hàng',
          phone: guestInfo.phone || undefined,
          email: guestInfo.email || undefined,
          initialMessages: recentTurns,
          handoffContext: { source: 'ai_handoff', transferredAt: new Date().toISOString() },
        });

        if (initRes?.conversationId) {
          setGuestConversationId(initRes.conversationId);
          localStorage.setItem('atelier_chat_guest_conv_id', initRes.conversationId);
          setIsGuestFormSubmitted(true);
        }
      } catch {
        // Fallback
      }
    }

    addToast('Đã chuyển ngữ cảnh cuộc trò chuyện sang nhân viên tư vấn!', 'info');
  };

  // =========================================================================
  // STAFF MODE: Guest Lead Capture Form Submission
  // =========================================================================
  const handleGuestFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestInfo.name.trim()) {
      addToast('Vui lòng nhập tên của quý khách.', 'error');
      return;
    }
    if (!guestInfo.phone.trim() && !guestInfo.email.trim()) {
      addToast('Vui lòng cung cấp số điện thoại hoặc email để nhân viên liên hệ.', 'error');
      return;
    }

    setIsStaffSending(true);
    try {
      // Collect up to 5 recent AI messages if any
      const recentTurns = aiMessages.slice(-5).map((m) => ({
        role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
        text: m.text,
      }));

      const res: any = await communicationApi.initGuestChat({
        guestId,
        name: guestInfo.name.trim(),
        phone: guestInfo.phone.trim() || undefined,
        email: guestInfo.email.trim() || undefined,
        initialMessages: recentTurns,
      });

      const convId = res?.conversationId || res?.data?.conversationId;
      if (convId) {
        setGuestConversationId(convId);
        localStorage.setItem('atelier_chat_guest_conv_id', convId);
        localStorage.setItem('atelier_chat_guest_info', JSON.stringify(guestInfo));
        setIsGuestFormSubmitted(true);
        addToast('Đã kết nối với bộ phận chăm sóc khách hàng!', 'success');
      }
    } catch (err: any) {
      addToast(err?.message || 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại.', 'error');
    } finally {
      setIsStaffSending(false);
    }
  };

  // =========================================================================
  // STAFF MODE: Send Message
  // =========================================================================
  const sendStaffMessage = async (content: string) => {
    if (!content.trim() || isStaffSending) return;
    setNetworkError(null);

    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const localId = `staff_user_${Date.now()}`;

    setStaffInput('');
    setStaffMessages((prev) => [
      ...prev,
      {
        id: localId,
        clientMessageId: localId,
        role: 'user',
        text: content,
        timestamp: time,
        status: 'sending',
      },
    ]);
    setIsStaffSending(true);

    // Emit typing stop
    socketService.sendTypingStop(
      guestConversationId || 'support',
      guestInfo.name || user?.name || (user as any)?.fullName || 'Khách hàng',
      'customer'
    );

    try {
      let res: any;
      if (isAuthenticated) {
        // Authenticated customer send
        res = await communicationApi.sendCustomerSupportMessage({
          conversationId: guestConversationId || undefined,
          content,
          clientMessageId: localId,
        });
        const returnedConvId = res?.data?.conversationId || res?.data?.conversation?._id || res?.conversationId;
        if (returnedConvId && returnedConvId !== guestConversationId) {
          setGuestConversationId(String(returnedConvId));
          localStorage.setItem('atelier_chat_guest_conv_id', String(returnedConvId));
          socketService.joinConversation(String(returnedConvId));
        }
      } else {
        // Guest send
        if (!guestConversationId) {
          throw new Error('Chưa khởi tạo phiên hỗ trợ khách.');
        }
        res = await communicationApi.sendGuestMessage({
          conversationId: guestConversationId,
          guestId,
          content,
          clientMessageId: localId,
        });
      }

      const savedMsg = res?.data?.message || res?.message;
      const permanentId = savedMsg?._id ? String(savedMsg._id) : null;

      setStaffMessages((prev) =>
        prev.map((m) =>
          m.id === localId || m.clientMessageId === localId
            ? { ...m, id: permanentId || m.id, clientMessageId: localId, status: 'sent' }
            : m
        )
      );
    } catch (err: any) {
      setNetworkError(err?.message || 'Lỗi gửi tin nhắn tới nhân viên.');
      setStaffMessages((prev) =>
        prev.map((m) => (m.id === localId ? { ...m, status: 'error' } : m))
      );
    } finally {
      setIsStaffSending(false);
    }
  };

  // Handle typing indicator while user types in staff mode
  const handleStaffInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStaffInput(e.target.value);
    if (guestConversationId) {
      const displayName = guestInfo.name || user?.name || (user as any)?.fullName || 'Khách hàng';
      socketService.sendTypingStart(guestConversationId, displayName, 'customer');
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        socketService.sendTypingStop(guestConversationId, displayName, 'customer');
      }, 2000);
    }
  };

  // Quick action: Fast add to cart from product card icon
  const handleQuickAddToCart = async (prod: CandidateProduct) => {
    const prodKey = prod.id || prod._id || prod.slug || 'p';
    const chosenColor = selectedVariants[prodKey]?.color || prod.available_colors?.[0] || 'Đen';
    const chosenSize = selectedVariants[prodKey]?.size || prod.available_sizes?.[0] || 'M';
    const finalPrice = prod.finalPrice ?? prod.price_number ?? prod.price ?? 0;

    const variant = prod.variants?.find((entry) => entry.color === chosenColor && entry.size === chosenSize && Number(entry.stock || 0) > 0);
    if (prod.variants?.length && !variant) { addToast('Màu hoặc kích cỡ đã chọn không còn khả dụng.', 'error'); return; }
    const added = await useCartStore.getState().addItem({
      productId: prodKey,
      variantId: variant?.variant_id,
      productSlug: prod.slug || '',
      name: prod.name || 'Thiết kế Atelier Vérité',
      price: finalPrice,
      selectedColor: chosenColor,
      selectedColorHex: '#000000',
      selectedSize: chosenSize,
      quantity: 1,
      image: prod.image || '',
    });
    if (added) addToast(`Đã thêm nhanh ${prod.name || 'sản phẩm'} vào giỏ hàng!`, 'success');
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

  if (!isOpen) {
    return (
      <SecurityVerificationModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        actionType={selectedSecurityAction}
        initialIdentifier={user?.email || user?.phone || undefined}
        onActionComplete={handleSecurityActionComplete}
      />
    );
  }

  return (
    <>
      <ModalPortal>
        <div
          className="fixed inset-0 bg-[rgba(26,26,23,0.45)] backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto"
          style={{ zIndex: overlayZIndex }}
          role="dialog"
          aria-modal="true"
          aria-label="Stylist AI"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div
            className="bg-[var(--surface)] border border-[var(--border)] w-full sm:max-w-[420px] sm:h-[640px] h-[95vh] max-h-[calc(100dvh-32px)] sm:rounded-xl shadow-2xl flex flex-col text-[var(--text)] min-w-0 overflow-hidden transition-all duration-250 ease-out"
            style={{ zIndex: contentZIndex }}
          >
          
          {/* ================================================================ */}
          {/* 1. HEADER: 2 Tabs ("Trợ lý AI" & "Chat với nhân viên") */}
          {/* ================================================================ */}
          <div className="border-b border-[var(--border)] bg-[var(--surface)] backdrop-blur-md shrink-0">
            {/* Top row with Title & Close button */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/15 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] shrink-0">
                  {currentMode === 'ai' ? <Sparkles className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-sm tracking-wide text-[var(--text)] truncate font-medium">
                    Atelier Vérité Concierge
                  </h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-sans truncate">
                    Thời trang Haute Couture & Trợ lý số
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2 Tabs Switcher */}
            <div className="flex items-center px-2">
              <button
                type="button"
                onClick={() => setCurrentMode('ai')}
                className={`flex-1 py-2.5 text-xs font-serif font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
                  currentMode === 'ai'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Trợ lý AI</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentMode('staff')}
                className={`flex-1 py-2.5 text-xs font-serif font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${
                  currentMode === 'staff'
                    ? 'border-[var(--accent)] text-[var(--accent)]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>Chat với nhân viên</span>
              </button>
            </div>

            {/* Sub-header status bar in Staff mode */}
            {currentMode === 'staff' && (
              <div className="px-4 py-1.5 bg-[var(--bg-alt)] border-t border-[var(--border)] flex items-center justify-between text-[11px] font-sans">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      staffStatus.isStaffOnline
                        ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse'
                        : 'bg-amber-500'
                    }`}
                  />
                  <span className="text-[var(--text-muted)] text-[10.5px] truncate">
                    {staffStatus.isStaffOnline
                      ? 'Nhân viên đang online'
                      : 'Hiện chưa có nhân viên, để lại tin nhắn, chúng tôi sẽ phản hồi sớm'}
                  </span>
                </div>
                {isStaffTyping && (
                  <span className="text-[10px] text-[var(--accent)] font-mono italic animate-pulse">
                    Nhân viên đang nhập...
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ================================================================ */}
          {/* 2. MESSAGES CONTAINER */}
          {/* ================================================================ */}
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3.5 text-xs font-sans relative"
          >
            {/* Guest Intake Form in Staff Mode if not submitted */}
            {currentMode === 'staff' && !isAuthenticated && !isGuestFormSubmitted && (
              <div className="p-4 bg-[var(--bg-alt)] border border-[var(--border)] rounded-xl space-y-3 shadow-lg">
                <div className="space-y-1">
                  <h4 className="font-serif text-sm font-medium text-[var(--text)] flex items-center gap-2">
                    <User className="w-4 h-4 text-[var(--accent)]" />
                    <span>Thông tin liên hệ tư vấn</span>
                  </h4>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Vui lòng cung cấp thông tin để nhân viên tư vấn hỗ trợ quý khách chu đáo nhất.
                  </p>
                </div>

                <form onSubmit={handleGuestFormSubmit} className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Quý khách vui lòng nhập tên..."
                      className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Ví dụ: 0912345678"
                      className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[var(--text-muted)] block mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="name@example.com"
                      className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isStaffSending}
                    className="w-full py-2 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold text-xs rounded transition-colors flex items-center justify-center gap-1.5 mt-2"
                  >
                    <span>Bắt đầu trò chuyện với nhân viên</span>
                  </button>
                </form>
              </div>
            )}

            {/* List of Messages */}
            {currentMessages.map((message) => {
              const isUser = message.role === 'user';
              const isStaff = message.role === 'staff';
              const isSystem = message.role === 'system';

              if (isSystem) {
                return (
                  <div key={message.id} className="flex justify-center my-3">
                    <div className="px-3.5 py-1.5 rounded-full bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--accent)] text-[11px] font-mono flex items-center gap-1.5 shadow-sm text-center">
                      <Headphones className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{renderSafeMessage(message.text)}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={message.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Left Avatar for Assistant or Staff */}
                  {!isUser && (
                    <div className="w-7 h-7 rounded-full bg-[var(--bg-alt)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
                      {isStaff ? (
                        <Headphones className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Bot className="w-3.5 h-3.5 text-[var(--accent)]" />
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-lg p-3 min-w-0 space-y-2.5 transition-all ${
                      isUser
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-medium'
                        : 'bg-[var(--bg-alt)] text-[var(--text)] border border-[var(--border)]'
                    }`}
                  >
                    {/* Content text */}
                    <p className="whitespace-pre-wrap leading-relaxed text-xs">
                      {renderSafeMessage(message.text)}
                    </p>

                    {/* Timestamp & Status */}
                    <div
                      className={`text-[9.5px] font-mono flex items-center justify-end gap-1 ${
                        isUser ? 'text-[var(--accent-contrast)]/70' : 'text-[var(--text-muted)]'
                      }`}
                    >
                      <span>{message.timestamp}</span>
                      {message.status === 'sending' && <span>(Đang gửi...)</span>}
                      {message.status === 'error' && <span className="text-red-600">(Lỗi gửi)</span>}
                    </div>

                    {/* Tool Execution Badges */}
                    {message.executedTools && message.executedTools.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {message.executedTools.map((t, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9.5px] bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] font-mono rounded"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-[var(--accent)]" />
                            Đã thực thi: {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Horizontal Product Cards (Specification 3) */}
                    {message.candidateProducts && message.candidateProducts.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
                          Gợi ý trang phục ({message.candidateProducts.length})
                        </div>

                        {/* Render maximum 4 cards */}
                        <div className="space-y-2">
                          {message.candidateProducts.slice(0, 4).map((prod, pIdx) => {
                            const prodKey = prod.id || prod._id || prod.slug || `prod-${pIdx}`;
                            const chosenColor = selectedVariants[prodKey]?.color;
                            const chosenSize = selectedVariants[prodKey]?.size;
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
                                className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] p-2.5 rounded-lg flex items-center justify-between gap-2.5 transition-all"
                              >
                                {/* Left 56px square image */}
                                <div className="w-14 h-14 shrink-0 rounded bg-[var(--bg-alt)] overflow-hidden border border-[var(--border)] flex items-center justify-center">
                                  <ProductImage src={prod.image} alt={prod.name || 'Sản phẩm'} />
                                </div>

                                {/* Center: Name & Price */}
                                <div className="flex-1 min-w-0 pr-1">
                                  <Link
                                    to={`/products/${prod.slug || ''}`}
                                    onClick={onClose}
                                    className="font-serif text-xs font-medium text-[var(--text)] hover:text-[var(--accent)] line-clamp-2 block leading-snug"
                                  >
                                    {prod.name || 'Thiết kế Atelier'}
                                  </Link>
                                  <div className="font-mono text-xs font-semibold text-[var(--accent)] mt-0.5">
                                    {displayPrice !== null
                                      ? formatCurrency(displayPrice)
                                      : 'Chưa có giá bán'}
                                  </div>
                                </div>

                                {/* Right: 2 buttons ("Xem" + quick cart icon) */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Link
                                    to={`/products/${prod.slug || ''}`}
                                    onClick={onClose}
                                    className="px-2 py-1 text-[11px] font-mono border border-[var(--border)] text-[var(--text)] hover:text-[var(--accent)] hover:border-[var(--accent)] rounded transition-colors"
                                  >
                                    Xem
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAddToCart(prod)}
                                    disabled={displayPrice === null}
                                    title={displayPrice === null ? 'Sản phẩm chưa có giá bán' : 'Thêm nhanh vào giỏ'}
                                    aria-label="Thêm nhanh vào giỏ"
                                    className="p-1.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] rounded transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                                  >
                                    <ShoppingBag className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Button "Xem thêm" if more than 4 products */}
                        {message.candidateProducts.length > 4 && (
                          <Link
                            to="/products"
                            onClick={onClose}
                            className="w-full py-1.5 border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] hover:text-[var(--accent)] font-mono text-[10.5px] rounded text-center block transition-colors"
                          >
                            Xem thêm ({message.candidateProducts.length - 4} thiết kế khác) →
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Quick Variant Selection Pills */}
                    {message.suggestedVariants && (
                      <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
                        {message.suggestedVariants.colors && message.suggestedVariants.colors.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">Màu:</span>
                            {message.suggestedVariants.colors.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => void sendAi(`Tôi chọn màu ${c}`)}
                                className="px-2 py-0.5 text-[10.5px] font-mono bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] rounded text-[var(--text)]"
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        )}
                        {message.suggestedVariants.sizes && message.suggestedVariants.sizes.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">Size:</span>
                            {message.suggestedVariants.sizes.map((s) => (
                              <button
                                key={s}
                                type="button"
                                onClick={() => void sendAi(`Tôi lấy size ${s}`)}
                                className="px-2 py-0.5 text-[10.5px] font-mono bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] rounded text-[var(--text)]"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Replies / Actions */}
                    {message.quickReplies && message.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {message.quickReplies.map((qr, qIdx) => {
                          if (qr.action === 'switch_to_staff') {
                            return (
                              <button
                                key={qIdx}
                                type="button"
                                onClick={handleHandoffToStaff}
                                className="px-2.5 py-1 text-[11px] font-mono bg-[var(--accent)]/15 border border-[var(--accent)] text-[var(--accent)] rounded-full hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-all flex items-center gap-1"
                              >
                                <Headphones className="w-3 h-3" />
                                <span>{qr.label}</span>
                              </button>
                            );
                          }
                          if (qr.url) {
                            return (
                              <Link
                                key={qIdx}
                                to={qr.url}
                                onClick={onClose}
                                className="px-2.5 py-1 text-[11px] font-mono bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-full hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all flex items-center gap-1"
                              >
                                <span>{qr.label}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </Link>
                            );
                          }
                          return (
                            <button
                              key={qIdx}
                              type="button"
                              onClick={() => void sendAi(qr.label)}
                              className="px-2.5 py-1 text-[11px] font-mono bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-full hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                            >
                              {qr.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Handoff suggestion button */}
                    {message.handoffReady && !message.quickReplies?.some((q) => q.action === 'switch_to_staff') && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={handleHandoffToStaff}
                          className="w-full py-1.5 bg-[var(--accent)]/15 border border-[var(--accent)]/50 hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] text-[var(--accent)] font-mono text-[11px] rounded transition-all flex items-center justify-center gap-1.5"
                        >
                          <Headphones className="w-3.5 h-3.5" />
                          <span>Chuyển sang Chat với nhân viên</span>
                        </button>
                      </div>
                    )}

                    {/* Pending Action Confirmation Card */}
                    {message.pendingAction && (
                      <div className="mt-2 p-2.5 bg-[var(--surface)] border border-[var(--accent)]/50 rounded-lg space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--accent)]">
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{message.pendingAction.actionType === 'start_checkout' ? 'Xác nhận phiên thanh toán' : 'Xác nhận thêm vào giỏ hàng'}</span>
                        </div>
                        {message.pendingAction.totalEstimatedPriceFormatted && (
                          <div className="text-[11px] text-[var(--text)]">
                            Tổng tạm tính:{' '}
                            <span className="font-mono text-[var(--accent)] font-bold">
                              {message.pendingAction.totalEstimatedPriceFormatted}
                            </span>
                          </div>
                        )}
                        {Array.isArray(message.pendingAction.items) && message.pendingAction.items.length > 0 && (
                          <ul className="space-y-1 text-[11px] text-[var(--text)]">
                            {message.pendingAction.items.map((item: any, index: number) => (
                              <li key={`${item.product_id || item.productId || index}-${index}`}>
                                {item.name || 'Sản phẩm'} · {item.color || 'Tiêu chuẩn'} · {item.size || 'Freesize'} · SL {item.quantity || 1}
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isAiLoading}
                            onClick={() =>
                              void sendAi('Xác nhận', message.pendingAction ?? undefined)
                            }
                            className="px-3 py-1 bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold rounded hover:bg-[#9E7B15] disabled:opacity-50"
                          >
                            {message.pendingAction.actionType === 'start_checkout' ? 'Tiếp tục thanh toán' : 'Xác nhận thao tác'}
                          </button>
                          <button
                            type="button"
                            disabled={isAiLoading}
                            onClick={() =>
                              void sendAi('Hủy', message.pendingAction ?? undefined, true)
                            }
                            className="px-3 py-1 border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-alt)] rounded text-xs disabled:opacity-50"
                          >
                            Hủy bỏ
                          </button>
                        </div>
                      </div>
                    )}

                    {message.actionResult?.status === 'EXECUTED' && message.actionResult?.checkoutUrl && (
                      <Link
                        to={message.actionResult.checkoutUrl}
                        onClick={onClose}
                        className="inline-flex px-3 py-1.5 bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold rounded hover:bg-[#9E7B15]"
                      >
                        Mở trang thanh toán
                      </Link>
                    )}

                    {/* Sensitive Security OTP Button */}
                    {message.securityAction && (
                      <div className="mt-2 pt-2 border-t border-[var(--border)] space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--accent)]">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-serif uppercase tracking-wider font-semibold">
                            Yêu Cầu Xác Minh Bảo Mật OTP
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenSecurityModal(message.securityAction!.actionType)
                          }
                          className="w-full py-2 px-3 rounded bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                        >
                          <Lock className="w-3 h-3" />
                          <span>{message.securityAction.actionButtonLabel}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Avatar for User */}
                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Jumping 3 dots typing indicator */}
            {isAiLoading && (
              <div className="flex gap-2.5 items-center text-[var(--text-muted)]">
                <div className="w-7 h-7 rounded-full bg-[var(--bg-alt)] border border-[var(--border)] flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-[var(--accent)]" />
                </div>
                <div className="bg-[var(--bg-alt)] border border-[var(--border)] rounded-lg px-3.5 py-2.5 flex items-center gap-1.5">
                  <span className="text-[11px] text-[var(--text)] font-sans mr-1">
                    Stylist đang kiểm tra
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" />
                </div>
              </div>
            )}

            {/* Network error retry banner */}
            {networkError && (
              <div className="p-2.5 bg-red-950/20 dark:bg-red-950/40 border border-red-800/40 rounded-lg flex items-center justify-between gap-2 text-[11px] text-red-600 dark:text-red-200">
                <span>{networkError}</span>
                <button
                  type="button"
                  onClick={() => {
                    setNetworkError(null);
                    if (currentMode === 'ai') {
                      void sendAi('Thử lại');
                    }
                  }}
                  className="px-2 py-1 bg-red-800/80 hover:bg-red-700 text-white font-mono text-[10px] rounded flex items-center gap-1"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Thử lại</span>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Scroll-to-bottom Button */}
          {showScrollBottomBtn && (
            <div className="absolute bottom-24 right-5 z-20">
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="p-2 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] shadow-xl hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)] transition-all flex items-center justify-center"
                title="Cuộn xuống tin nhắn mới nhất"
                aria-label="Cuộn xuống tin nhắn mới nhất"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* 3. QUICK CHIPS (Specification 4) */}
          {/* ================================================================ */}
          <div className="px-3 py-1.5 bg-[var(--surface)] border-t border-[var(--border)] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {currentMode === 'ai' ? (
              <>
                <button
                  type="button"
                  onClick={() => void sendAi('Tìm áo thun hoặc áo thể thao giúp tôi')}
                  className="px-2.5 py-1 rounded-full text-[10.5px] font-mono bg-[var(--bg-alt)] hover:bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] hover:text-[var(--accent)] whitespace-nowrap transition-colors"
                >
                  Tìm áo
                </button>
                <button
                  type="button"
                  onClick={() => void sendAi('Xem giỏ hàng giúp tôi')}
                  className="px-2.5 py-1 rounded-full text-[10.5px] font-mono bg-[var(--bg-alt)] hover:bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] hover:text-[var(--accent)] whitespace-nowrap transition-colors"
                >
                  Xem giỏ hàng
                </button>
                <button
                  type="button"
                  onClick={() => void sendAi('Cho tôi hỏi chính sách đổi trả hàng')}
                  className="px-2.5 py-1 rounded-full text-[10.5px] font-mono bg-[var(--bg-alt)] hover:bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] hover:text-[var(--accent)] whitespace-nowrap transition-colors"
                >
                  Chính sách đổi trả
                </button>
                <button
                  type="button"
                  onClick={handleHandoffToStaff}
                  className="px-2.5 py-1 rounded-full text-[10.5px] font-mono bg-[var(--accent)]/15 hover:bg-[var(--accent)] border border-[var(--accent)]/40 text-[var(--accent)] hover:text-[var(--accent-contrast)] whitespace-nowrap transition-colors flex items-center gap-1"
                >
                  <Headphones className="w-2.5 h-2.5" />
                  <span>Gặp nhân viên</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => void sendStaffMessage('Em muốn tư vấn chọn size may đo ạ')}
                  className="px-2.5 py-1 rounded-full text-[10.5px] font-mono bg-[var(--bg-alt)] hover:bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] hover:text-[var(--accent)] whitespace-nowrap transition-colors"
                >
                  Tư vấn size
                </button>
                <button
                  type="button"
                  onClick={() => void sendStaffMessage('Chất liệu trang phục này có co giãn và chống nhăn không ạ?')}
                  className="px-2.5 py-1 rounded-full text-[10.5px] font-mono bg-[var(--bg-alt)] hover:bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] hover:text-[var(--accent)] whitespace-nowrap transition-colors"
                >
                  Tư vấn chất liệu
                </button>
                <button
                  type="button"
                  onClick={() => void sendStaffMessage('Tôi muốn kiểm tra tình trạng đơn hàng may đo')}
                  className="px-2.5 py-1 rounded-full text-[10.5px] font-mono bg-[var(--bg-alt)] hover:bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] hover:text-[var(--accent)] whitespace-nowrap transition-colors"
                >
                  Kiểm tra đơn hàng
                </button>
              </>
            )}
          </div>

          {/* ================================================================ */}
          {/* 4. INPUT FORM */}
          {/* ================================================================ */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (currentMode === 'ai') {
                void sendAi(aiInput);
              } else {
                void sendStaffMessage(staffInput);
              }
            }}
            className="p-3 border-t border-[var(--border)] bg-[var(--surface)] flex gap-2 shrink-0 items-center"
          >
            <input
              type="text"
              data-testid="ai-chat-input"
              value={currentMode === 'ai' ? aiInput : staffInput}
              onChange={(e) => {
                if (currentMode === 'ai') {
                  setAiInput(e.target.value);
                } else {
                  handleStaffInputChange(e);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (currentMode === 'ai') {
                    void sendAi(aiInput);
                  } else {
                    void sendStaffMessage(staffInput);
                  }
                }
              }}
              maxLength={5000}
              placeholder={
                currentMode === 'ai'
                  ? 'Ví dụ: Thêm áo thể thao vào giỏ hàng giúp tôi...'
                  : 'Nhắn tin với nhân viên tư vấn...'
              }
              className="flex-1 min-w-0 px-3.5 py-2 text-xs bg-[var(--bg-alt)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/50"
            />
            <button
              type="submit"
              data-testid="ai-chat-send-btn"
              disabled={
                currentMode === 'ai'
                  ? !aiInput.trim() || isAiLoading
                  : !staffInput.trim() || isStaffSending
              }
              className="px-3.5 py-2 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold rounded-lg disabled:opacity-40 transition-all flex items-center justify-center shrink-0"
              aria-label="Gửi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* ================================================================ */}
          {/* 5. FOOTER SECURITY NOTICE */}
          {/* ================================================================ */}
          <div className="px-3 py-1.5 bg-[var(--surface)] border-t border-[var(--border)] flex items-center gap-1.5 text-[9.5px] text-[var(--text-muted)] shrink-0">
            <ShieldAlert className="w-3 h-3 text-[var(--accent)] shrink-0" />
            <span className="truncate">
              Không gửi OTP, mật khẩu, thông tin thẻ. Giá & tồn kho được xác minh trực tiếp.
            </span>
          </div>
        </div>
      </div>
    </ModalPortal>

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

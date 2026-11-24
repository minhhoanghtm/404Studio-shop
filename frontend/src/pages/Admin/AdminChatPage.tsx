import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AdminLayout } from './AdminLayout';
import {
  Send,
  User,
  Search,
  ArrowLeft,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
  UserCheck,
  Headphones,
  RotateCcw,
} from 'lucide-react';
import { useToastStore } from '@/shared/stores/useToastStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { communicationApi } from '@/shared/api/communicationApi';
import { socketService } from '@/shared/services/socketService';

interface MessageItem {
  id: string;
  clientMessageId?: string;
  sender: 'customer' | 'admin' | 'system';
  text: string;
  timestamp: string;
  isHandoffContext?: boolean;
}

interface Conversation {
  id: string;
  customerId?: string | null;
  guestId?: string | null;
  customerName: string;
  customerEmail: string;
  category: 'tailoring' | 'order' | 'general';
  lastMessage: string;
  lastMessageSender?: 'customer' | 'admin' | 'system' | 'ai';
  customerMessageCount?: number;
  updatedAt: string;
  unreadCount?: number;
  isOnline?: boolean;
  lastActiveAt?: string | Date | null;
  status?: string;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  metadata?: any;
  messages: MessageItem[];
}

/**
 * Quy đổi thời gian hoạt động cuối cùng của khách hàng sang các mốc thời gian phù hợp:
 * - Vài giây trước
 * - xx phút trước
 * - xx giờ trước
 * - xx ngày trước
 * - xx tuần trước
 * - xx tháng trước
 * - xx năm trước
 */
export const formatLastActiveTime = (dateInput?: string | Date | number | null): string => {
  if (!dateInput) return 'Đã hoạt động gần đây';
  const timestamp = typeof dateInput === 'number'
    ? dateInput
    : new Date(dateInput).getTime();

  if (isNaN(timestamp) || timestamp <= 0) {
    return 'Đã hoạt động gần đây';
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSec < 45) {
    return 'Đã hoạt động vài giây trước';
  }
  if (diffMin < 60) {
    return `Đã hoạt động ${diffMin} phút trước`;
  }
  if (diffHours < 24) {
    return `Đã hoạt động ${diffHours} giờ trước`;
  }
  if (diffDays < 7) {
    return `Đã hoạt động ${diffDays} ngày trước`;
  }
  if (diffWeeks < 4) {
    return `Đã hoạt động ${diffWeeks} tuần trước`;
  }
  if (diffMonths < 12) {
    return `Đã hoạt động ${diffMonths} tháng trước`;
  }
  return `Đã hoạt động ${diffYears} năm trước`;
};

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    customerId: 'cust-1',
    customerName: 'Charlotte Vane',
    customerEmail: 'charlotte.vane@patron.atelierverite.com',
    category: 'tailoring',
    lastMessage: 'Tôi có thể yêu cầu may đo chỉnh độ dài tay áo ngắn lại 1.5cm được không?',
    lastMessageSender: 'customer',
    customerMessageCount: 3,
    updatedAt: '14:25',
    unreadCount: 1,
    isOnline: true,
    lastActiveAt: new Date().toISOString(),
    messages: [
      {
        id: 'm-1',
        sender: 'customer',
        text: 'Kính chào Atelier Vérité, tôi muốn tư vấn kích thước áo dạ Biella số đo vòng ngực 86cm, eo 68cm.',
        timestamp: '14:20',
      },
      {
        id: 'm-2',
        sender: 'admin',
        text: 'Kính chào Bà Charlotte, với số đo vòng ngực 86cm và eo 68cm, phom size FR 38 của Atelier sẽ mang lại độ vừa vặn hoàn hảo, tôn dáng tự nhiên và vẫn đảm bảo sự êm ái khi mặc kèm áo len dệt cashmere mỏng bên trong.',
        timestamp: '14:22',
      },
      {
        id: 'm-3',
        sender: 'customer',
        text: 'Chất liệu dạ Biella này có khả năng chống nhăn và giữ ấm khi di chuyển tại các vùng khí hậu lạnh không ạ?',
        timestamp: '14:23',
      },
      {
        id: 'm-4',
        sender: 'admin',
        text: 'Dạ hoàn toàn yên tâm thưa Bà. Dòng vải len lông cừu nguyên chất dệt từ vùng Biella (Ý) có mật độ sợi cao, độ đàn hồi tự nhiên tuyệt đối giúp chống nhăn nếp gãy và cấu trúc sợi giữ nhiệt vi mô tối ưu.',
        timestamp: '14:24',
      },
      {
        id: 'm-5',
        sender: 'customer',
        text: 'Tôi có thể yêu cầu may đo chỉnh độ dài tay áo ngắn lại 1.5cm được không?',
        timestamp: '14:25',
      },
    ],
  },
  {
    id: 'conv-2',
    customerId: 'cust-2',
    customerName: 'Jean-Luc Moreau',
    customerEmail: 'moreau.jl@luxury.paris',
    category: 'order',
    lastMessage: 'Kính chào Ông Jean-Luc, đơn hàng ORD-8923 hiện đã hoàn tất công đoạn cắt mẫu rập và nghệ nhân đang thực hiện khâu đính cúc sừng thủ công.',
    lastMessageSender: 'admin',
    customerMessageCount: 1,
    updatedAt: '12:40',
    unreadCount: 0,
    isOnline: true,
    lastActiveAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    messages: [
      {
        id: 'm-201',
        sender: 'customer',
        text: 'Xin chào Atelier, đơn hàng may đo ORD-8923 bộ Suit Lụa Midnight của tôi hiện đã tiến hành tới bước nào rồi ạ?',
        timestamp: '12:30',
      },
      {
        id: 'm-202',
        sender: 'admin',
        text: 'Kính chào Ông Jean-Luc, đơn hàng ORD-8923 hiện đã hoàn tất công đoạn cắt mẫu rập và nghệ nhân đang thực hiện khâu đính cúc sừng thủ công. Dự kiến kiện hàng sẽ hoàn thiện xuất xưởng vào chiều mai.',
        timestamp: '12:35',
      },
    ],
  },
  {
    id: 'conv-3',
    customerId: 'cust-3',
    customerName: 'Victoria Sterling',
    customerEmail: 'victoria.sterling@haute.uk',
    category: 'general',
    lastMessage: 'Atelier Vérité xin chân thành cảm ơn những lời khen ngợi quý báu của Bà Victoria.',
    lastMessageSender: 'admin',
    customerMessageCount: 2,
    updatedAt: 'Hôm qua',
    unreadCount: 0,
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(), // 42 minutes ago
    messages: [
      {
        id: 'm-301',
        sender: 'customer',
        text: 'Kính chào Atelier, tôi vừa nhận được chiếc Đầm Lụa Dạ Hội Midnight vào sáng nay.',
        timestamp: '10:15',
      },
      {
        id: 'm-302',
        sender: 'customer',
        text: 'Đường may giấu chỉ và độ rủ của lụa tơ tằm thật sự xuất sắc ngoài mong đợi. Cảm ơn đội ngũ nghệ nhân rất nhiều!',
        timestamp: '10:16',
      },
      {
        id: 'm-303',
        sender: 'admin',
        text: 'Atelier Vérité xin chân thành cảm ơn những lời khen ngợi quý báu của Bà Victoria. Niềm vinh hạnh lớn nhất của xưởng may là được đồng hành cùng phong thái sang trọng của Bà trong các dạ tiệc thượng lưu.',
        timestamp: '10:20',
      },
    ],
  },
  {
    id: 'conv-4',
    customerId: 'cust-4',
    customerName: 'Alexander Wright',
    customerEmail: 'a.wright@manhattan.com',
    category: 'tailoring',
    lastMessage: 'Xin chào, bộ Tuxedo Ve Nhọn Peak Lapel có thể đổi chất liệu ve áo sang lụa Satin hữu cơ Como không?',
    lastMessageSender: 'customer',
    customerMessageCount: 1,
    updatedAt: '18/11',
    unreadCount: 1,
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hours ago
    messages: [
      {
        id: 'm-401',
        sender: 'customer',
        text: 'Xin chào, bộ Tuxedo Ve Nhọn Peak Lapel có thể đổi chất liệu ve áo sang lụa Satin hữu cơ Como không?',
        timestamp: '16:00',
      },
    ],
  },
  {
    id: 'conv-5',
    customerId: 'cust-5',
    customerName: 'Eleanor Vance',
    customerEmail: 'eleanor.v@geneva.ch',
    category: 'general',
    lastMessage: 'Tôi có kế hoạch đến Việt Nam vào tuần tới và muốn đặt lịch hẹn thử trang phục tại Private Salon của Atelier.',
    lastMessageSender: 'customer',
    customerMessageCount: 1,
    updatedAt: '17/11',
    unreadCount: 1,
    isOnline: false,
    lastActiveAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
    messages: [
      {
        id: 'm-501',
        sender: 'customer',
        text: 'Tôi có kế hoạch đến Việt Nam vào tuần tới và muốn đặt lịch hẹn thử trang phục tại Private Salon của Atelier.',
        timestamp: '09:00',
      },
    ],
  },
];

const QUICK_RESPONSES = [
  'Kính chào Quý khách! Atelier rất vinh hạnh được hỗ trợ tư vấn số đo và chất liệu may đo cho Quý khách.',
  'Dạ yêu cầu của Quý khách đã được chuyển tới trưởng bộ phận nghệ nhân để xử lý tỉ mỉ nhất.',
  'Kiện hàng của Quý khách đã được đóng hộp gỗ tuyết tùng cao cấp và bàn giao cho đơn vị vận chuyển bảo an.',
  'Dòng chất liệu lụa tơ tằm thượng hạng của Atelier được xử lý bề mặt chống bám bụi và giữ nếp tự nhiên.',
];

export const AdminChatPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();

  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedConvId, setSelectedConvId] = useState<string>(INITIAL_CONVERSATIONS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const [mobileView, setMobileView] = useState<'list' | 'messages'>('list');
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // Periodic ticker to recalculate relative elapsed time ("xx phút trước")
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // Fetch real conversations from Backend
  const loadConversations = useCallback(async () => {
    try {
      const res: any = await communicationApi.getAdminConversations({ page: 1, limit: 50 });
      const list = res?.data?.conversations || res?.conversations || res?.data?.items || res?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        const mapped: Conversation[] = list.map((c: any) => {
          const rawSender =
            c.lastMessageSender || (c.status === 'waiting_admin' ? 'customer' : undefined);
          const normalizedSender: 'customer' | 'admin' | 'system' | 'ai' | undefined =
            rawSender === 'user' || rawSender === 'guest' || rawSender === 'customer'
              ? 'customer'
              : rawSender === 'admin'
              ? 'admin'
              : rawSender === 'ai'
              ? 'ai'
              : rawSender === 'system'
              ? 'system'
              : undefined;

          const lastMsg =
            c.lastMessage && !c.lastMessage.startsWith('⚠️ Thao tác không hợp lệ')
              ? c.lastMessage
              : c.messages && c.messages.length > 0
              ? c.messages[c.messages.length - 1].content || c.messages[c.messages.length - 1].text
              : 'Chưa có tin nhắn';

          const unread =
            typeof c.unreadCount === 'number'
              ? c.unreadCount
              : c.status === 'waiting_admin'
              ? 1
              : 0;

          return {
            id: String(c._id || c.id),
            customerId: c.customerId?._id ? String(c.customerId._id) : (c.customerId ? String(c.customerId) : null),
            guestId: c.guestId || c.metadata?.visitorId || null,
            customerName: c.guestInfo?.name || c.customerId?.fullName || c.customerName || 'Khách Hàng',
            customerEmail: c.guestInfo?.email || c.customerId?.email || c.customerEmail || 'Chưa cung cấp email',
            category: (c.category || (c.type === 'support' ? 'tailoring' : 'general')) as any,
            lastMessage: lastMsg,
            lastMessageSender: normalizedSender,
            customerMessageCount: typeof c.customerMessageCount === 'number' ? c.customerMessageCount : 0,
            updatedAt: new Date(c.lastMessageAt || c.updatedAt || Date.now()).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            unreadCount: unread,
            isOnline: Boolean(c.isOnline),
            lastActiveAt: c.lastActiveAt || c.lastMessageAt || c.updatedAt || c.createdAt || null,
            status: c.status || 'open',
            assignedAdminId: c.assignedAdminId?._id ? String(c.assignedAdminId._id) : (c.assignedAdminId ? String(c.assignedAdminId) : null),
            assignedAdminName: c.assignedAdminId?.fullName || c.assignedAdminId?.name || c.assignedAdminName || null,
            metadata: c.metadata,
            messages: [],
          };
        });

        setConversations((prev) =>
          mapped.map((newConv) => {
            const existing = prev.find((p) => p.id === newConv.id);
            return {
              ...newConv,
              messages: existing && existing.messages.length > 0 ? existing.messages : newConv.messages,
            };
          })
        );

        if (!selectedConvId || !mapped.some((m) => m.id === selectedConvId)) {
          setSelectedConvId(mapped[0].id);
        }
      }
    } catch {
      // Keep initial conversations if backend fetch fails
    }
  }, [selectedConvId]);

  // Load real messages for a conversation
  const loadMessages = useCallback(async (convId: string) => {
    if (!convId || convId.startsWith('conv-')) return;
    setIsLoadingMessages(true);
    try {
      const res: any = await communicationApi.getAdminMessages(convId);
      const rawList = res?.data?.messages || res?.messages || res?.data?.items || res?.data || [];
      if (Array.isArray(rawList)) {
        const seenIds = new Set<string>();
        const mappedMsgs: MessageItem[] = [];

        for (const m of rawList) {
          // Chỉ hiển thị cho khách hàng, không gửi / không hiển thị cho nhân viên các lỗi thao tác không hợp lệ
          const isInvalidCustomerAction =
            Boolean(m.metadata?.isEphemeral) ||
            m.metadata?.actionResult?.code === 'CROSS_USER_FORBIDDEN' ||
            m.metadata?.actionResult?.code === 'REPLAY_BLOCKED' ||
            m.metadata?.actionResult?.code === 'EXPIRED' ||
            m.metadata?.actionResult?.code === 'INVALID_ACTION_TOKEN' ||
            m.metadata?.actionResult?.code === 'AUTH_REQUIRED' ||
            m.metadata?.actionResult?.code === 'FORBIDDEN_ROLE' ||
            m.content?.startsWith('⚠️ Thao tác không hợp lệ') ||
            m.content?.startsWith('⚠️ Thao tác thêm vào giỏ hàng này đã được thực thi') ||
            m.content?.startsWith('⚠️ Chữ ký xác thực hành động không hợp lệ') ||
            m.content?.startsWith('⚠️ Yêu cầu xác nhận thêm giỏ hàng đã hết hạn') ||
            m.content?.startsWith('⚠️ Không thể thêm vào giỏ hàng');

          if (isInvalidCustomerAction) continue;

          const msgId = String(m._id || m.id || m.clientMessageId);
          if (seenIds.has(msgId)) continue;
          seenIds.add(msgId);

          const isSys =
            m.senderType === 'system' ||
            m.messageType === 'system' ||
            m.metadata?.action === 'staff_joined' ||
            m.metadata?.action === 'conversation_closed' ||
            m.metadata?.action === 'conversation_reopened';
          const sender: MessageItem['sender'] = isSys
            ? 'system'
            : m.senderType === 'admin'
            ? 'admin'
            : 'customer';

          mappedMsgs.push({
            id: msgId,
            clientMessageId: m.clientMessageId,
            sender,
            text: m.content || '',
            timestamp: new Date(m.createdAt || Date.now()).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isHandoffContext: Boolean(m.metadata?.isHandoffContext),
          });
        }

        const lastMsg = mappedMsgs.length > 0 ? mappedMsgs[mappedMsgs.length - 1] : null;

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === convId) {
              return {
                ...c,
                messages: mappedMsgs,
                lastMessage: lastMsg ? lastMsg.text : c.lastMessage,
                lastMessageSender: lastMsg ? lastMsg.sender : c.lastMessageSender,
              };
            }
            return c;
          })
        );
      }
    } catch {
      // Ignore
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // On mount: fetch conversations & connect socket
  useEffect(() => {
    loadConversations();
    socketService.connect();

    // Listen to real-time incoming messages
    const unsubMsg = socketService.onMessageNew((payload) => {
      const { message } = payload;
      // Không gửi / hiển thị cho nhân viên các lỗi thao tác không hợp lệ của khách hàng
      const isInvalidCustomerAction =
        Boolean(message.metadata?.isEphemeral) ||
        message.metadata?.actionResult?.code === 'CROSS_USER_FORBIDDEN' ||
        message.metadata?.actionResult?.code === 'REPLAY_BLOCKED' ||
        message.metadata?.actionResult?.code === 'EXPIRED' ||
        message.metadata?.actionResult?.code === 'INVALID_ACTION_TOKEN' ||
        message.metadata?.actionResult?.code === 'AUTH_REQUIRED' ||
        message.metadata?.actionResult?.code === 'FORBIDDEN_ROLE' ||
        message.content?.startsWith('⚠️ Thao tác không hợp lệ') ||
        message.content?.startsWith('⚠️ Thao tác thêm vào giỏ hàng này đã được thực thi') ||
        message.content?.startsWith('⚠️ Chữ ký xác thực hành động không hợp lệ') ||
        message.content?.startsWith('⚠️ Yêu cầu xác nhận thêm giỏ hàng đã hết hạn') ||
        message.content?.startsWith('⚠️ Không thể thêm vào giỏ hàng');

      if (isInvalidCustomerAction) return;

      const convId = message.conversationId;
      const incomingId = String(message._id || message.id || `m_${Date.now()}`);
      const clientMessageId = message.clientMessageId;
      const isCloseAction = message.metadata?.action === 'conversation_closed';
      const isReopenAction = message.metadata?.action === 'conversation_reopened';
      const isSys =
        message.senderType === 'system' ||
        (message as any).messageType === 'system' ||
        message.metadata?.action === 'staff_joined' ||
        isCloseAction ||
        isReopenAction;

      const newMsg: MessageItem = {
        id: incomingId,
        clientMessageId,
        sender: isSys ? 'system' : message.senderType === 'admin' ? 'admin' : 'customer',
        text: message.content,
        timestamp: new Date(message.createdAt || Date.now()).toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            // Find if this message already exists in the conversation:
            // 1. By exact ID match
            // 2. By clientMessageId match (optimistic message)
            // 3. Fallback heuristic: same sender, same text, and existing message is temporary (starts with 'm-')
            const existingIndex = c.messages.findIndex((m) => {
              if (m.id === incomingId) return true;
              if (clientMessageId && (m.id === clientMessageId || m.clientMessageId === clientMessageId)) return true;
              if (m.sender === newMsg.sender && m.text === newMsg.text && m.id.startsWith('m-')) return true;
              return false;
            });

            let nextMessages: MessageItem[];
            if (existingIndex >= 0) {
              // Update optimistic message with real permanent ID and server timestamp
              nextMessages = [...c.messages];
              nextMessages[existingIndex] = {
                ...nextMessages[existingIndex],
                id: incomingId,
                clientMessageId: clientMessageId || nextMessages[existingIndex].clientMessageId,
                timestamp: newMsg.timestamp,
              };
            } else {
              nextMessages = [...c.messages, newMsg];
            }

            const isCustomer = newMsg.sender === 'customer';
            return {
              ...c,
              status: isCloseAction ? 'closed' : isReopenAction ? 'open' : c.status,
              lastMessage: newMsg.text,
              lastMessageSender: newMsg.sender,
              updatedAt: newMsg.timestamp,
              unreadCount:
                isCustomer
                  ? c.id === selectedConvId
                    ? 0
                    : (c.unreadCount || 0) + 1
                  : (c.unreadCount || 0),
              customerMessageCount:
                isCustomer
                  ? (c.customerMessageCount || 0) + 1
                  : (c.customerMessageCount || 0),
              messages: nextMessages,
            };
          }
          return c;
        })
      );

      if (convId === selectedConvId) {
        setIsCustomerTyping(false);
      }
    });

    // Listen to typing indicators
    const unsubTypingStart = socketService.onTypingStart((data) => {
      if (data.conversationId === selectedConvId && data.role !== 'admin') {
        setIsCustomerTyping(true);
      }
    });

    const unsubTypingStop = socketService.onTypingStop((data) => {
      if (data.conversationId === selectedConvId) {
        setIsCustomerTyping(false);
      }
    });

    // Listen to conversation updates
    const unsubConvUpdated = socketService.onConversationUpdated(() => {
      loadConversations();
    });

    // Listen to real-time presence events (customer active / idle / leave)
    const unsubPresenceUpdated = socketService.onPresenceUpdated((presenceData: any) => {
      if (!presenceData) return;
      const targetUserId = presenceData.userId ? String(presenceData.userId) : null;
      const targetVisitorId = presenceData.visitorId || presenceData.sessionId || presenceData.anonymousId || null;
      const isOnline = ['active', 'idle', 'away', 'background', 'passive_viewing'].includes(
        (presenceData.status || '').toLowerCase()
      );
      const lastActiveAt = presenceData.lastSeen || presenceData.lastHeartbeatAt || new Date().toISOString();

      setConversations((prev) =>
        prev.map((c) => {
          const matchUser = Boolean(targetUserId && c.customerId && String(c.customerId) === targetUserId);
          const matchGuest = Boolean(targetVisitorId && c.guestId && String(c.guestId) === String(targetVisitorId));
          if (matchUser || matchGuest) {
            return {
              ...c,
              isOnline,
              lastActiveAt,
            };
          }
          return c;
        })
      );
    });

    const unsubPresenceLeave = socketService.onPresenceLeave((data: any) => {
      if (!data) return;
      const targetSessionId = data.sessionId ? String(data.sessionId) : null;
      const targetVisitorId = data.visitorId ? String(data.visitorId) : null;
      setConversations((prev) =>
        prev.map((c) => {
          const matchGuest =
            (targetSessionId && c.guestId && String(c.guestId) === targetSessionId) ||
            (targetVisitorId && c.guestId && String(c.guestId) === targetVisitorId);
          if (matchGuest) {
            return {
              ...c,
              isOnline: false,
              lastActiveAt: new Date().toISOString(),
            };
          }
          return c;
        })
      );
    });

    return () => {
      unsubMsg();
      unsubTypingStart();
      unsubTypingStop();
      unsubConvUpdated();
      unsubPresenceUpdated();
      unsubPresenceLeave();
    };
  }, [loadConversations, selectedConvId]);

  // When selected conversation changes, fetch its messages and join its room
  useEffect(() => {
    if (selectedConvId && !selectedConvId.startsWith('conv-')) {
      loadMessages(selectedConvId);
      socketService.joinConversation(selectedConvId);
    }
  }, [selectedConvId, loadMessages]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];
  const messages = selectedConv?.messages || [];

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Smooth scroll helper
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }, []);

  // Monitor scroll position inside message container
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 80;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceToBottom <= threshold;
    setIsNearBottom(nearBottom);
    setShowScrollBottomBtn(!nearBottom);
  }, []);

  // When switching conversation: jump to bottom immediately
  useEffect(() => {
    scrollToBottom(false);
    prevMessagesLengthRef.current = messages.length;
  }, [selectedConvId, scrollToBottom, messages.length]);

  // When new messages are appended: auto scroll only if user is near bottom
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      if (isNearBottom) {
        scrollToBottom(true);
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, isNearBottom, scrollToBottom]);

  // Handle select conversation
  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConvId(conv.id);
    setMobileView('messages');

    // Mark as read locally
    if (conv.unreadCount && conv.unreadCount > 0) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  // Handle sending reply
  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSendingRef.current || !replyText.trim()) return;

    isSendingRef.current = true;
    setIsSending(true);

    const content = replyText.trim();
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const localId = 'm-' + Date.now();

    const newMsg: MessageItem = {
      id: localId,
      clientMessageId: localId,
      sender: 'admin',
      text: content,
      timestamp: time,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === selectedConvId) {
          return {
            ...c,
            status: 'open',
            lastMessage: newMsg.text,
            lastMessageSender: 'admin',
            unreadCount: 0,
            updatedAt: newMsg.timestamp,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setReplyText('');
    setIsNearBottom(true);

    try {
      // Call real Backend API if real conversation ID
      if (selectedConvId && !selectedConvId.startsWith('conv-')) {
        const res: any = await communicationApi.sendAdminSupportMessage({
          conversationId: selectedConvId,
          content,
          clientMessageId: localId,
        });

        // Reconcile optimistic message with permanent database _id
        const savedMsg = res?.data?.message || res?.message;
        if (savedMsg?._id) {
          const permanentId = String(savedMsg._id);
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === selectedConvId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === localId || m.clientMessageId === localId
                      ? { ...m, id: permanentId, clientMessageId: localId }
                      : m
                  ),
                };
              }
              return c;
            })
          );
        }
      }
      addToast('Đã gửi phản hồi thành công tới khách quý!', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Lỗi khi gửi phản hồi', 'error');
    } finally {
      isSendingRef.current = false;
      setIsSending(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // Handle keyboard shortcut Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if ((e.nativeEvent as any)?.isComposing) return;
      e.preventDefault();
      e.stopPropagation();
      handleSendReply();
    }
  };

  // Assign conversation to current staff
  const handleAssignToMe = async () => {
    const adminId = (user as any)?._id || (user as any)?.id;
    if (!adminId) {
      addToast('Không tìm thấy thông tin quản trị viên.', 'error');
      return;
    }
    const rawStaffName = (user?.name || (user as any)?.fullName || '').trim();
    const staffName = rawStaffName
      ? (rawStaffName.toLowerCase().startsWith('nhân viên') ? rawStaffName : `Nhân viên ${rawStaffName}`)
      : 'Nhân viên tư vấn';
    const notificationText = staffName.toLowerCase().startsWith('nhân viên')
      ? `${staffName} đã tham gia cuộc trò chuyện`
      : `Nhân viên ${staffName} đã tham gia cuộc trò chuyện`;

    try {
      if (!selectedConvId.startsWith('conv-')) {
        await communicationApi.assignConversation(selectedConvId, adminId);
      }
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === selectedConvId) {
            const alreadyHasJoinMsg = c.messages.some(
              (m) => m.sender === 'system' && m.text.includes(staffName)
            );
            const newMessages = alreadyHasJoinMsg
              ? c.messages
              : [
                  ...c.messages,
                  {
                    id: `sys_${Date.now()}`,
                    sender: 'system' as const,
                    text: notificationText,
                    timestamp: new Date().toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ];

            return {
              ...c,
              assignedAdminId: adminId,
              assignedAdminName: staffName,
              messages: newMessages,
              lastMessage: notificationText,
            };
          }
          return c;
        })
      );
      addToast('Đã gán cuộc trò chuyện cho bạn phụ trách!', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Không thể gán nhân viên phụ trách', 'error');
    }
  };

  // Close / End conversation session
  const handleCloseConversation = async () => {
    try {
      if (!selectedConvId.startsWith('conv-')) {
        await communicationApi.closeConversation(selectedConvId);
      }
      const rawStaffName = (user?.name || (user as any)?.fullName || '').trim();
      const staffName = rawStaffName
        ? (rawStaffName.toLowerCase().startsWith('nhân viên') ? rawStaffName : `Nhân viên ${rawStaffName}`)
        : 'Nhân viên tư vấn';
      const notificationText = `${staffName} đã kết thúc phiên tư vấn`;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === selectedConvId) {
            const alreadyHasCloseMsg = c.messages.some(
              (m) => m.sender === 'system' && m.text.includes('kết thúc phiên tư vấn')
            );
            const newMessages = alreadyHasCloseMsg
              ? c.messages
              : [
                  ...c.messages,
                  {
                    id: `sys_close_${Date.now()}`,
                    sender: 'system' as const,
                    text: notificationText,
                    timestamp: new Date().toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  },
                ];

            return {
              ...c,
              status: 'closed' as const,
              messages: newMessages,
              lastMessage: notificationText,
            };
          }
          return c;
        })
      );
      addToast('Đã kết thúc phiên tư vấn CSKH thành công!', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Không thể kết thúc phiên tư vấn', 'error');
    }
  };

  // Reopen conversation session
  const handleReopenConversation = async () => {
    try {
      if (!selectedConvId.startsWith('conv-')) {
        await communicationApi.reopenConversation(selectedConvId);
      }
      const rawStaffName = (user?.name || (user as any)?.fullName || '').trim();
      const staffName = rawStaffName
        ? (rawStaffName.toLowerCase().startsWith('nhân viên') ? rawStaffName : `Nhân viên ${rawStaffName}`)
        : 'Nhân viên tư vấn';
      const notificationText = `${staffName} đã mở lại phiên tư vấn`;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === selectedConvId) {
            return {
              ...c,
              status: 'open' as const,
              messages: [
                ...c.messages,
                {
                  id: `sys_reopen_${Date.now()}`,
                  sender: 'system' as const,
                  text: notificationText,
                  timestamp: new Date().toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                },
              ],
              lastMessage: notificationText,
            };
          }
          return c;
        })
      );
      addToast('Đã mở lại phiên tư vấn thành công!', 'info');
    } catch (err: any) {
      addToast(err?.message || 'Không thể mở lại phiên tư vấn', 'error');
    }
  };

  return (
    <AdminLayout
      title="Hộp Thư CSKH Trực Tuyến"
      subtitle="Kênh phản hồi và tư vấn may đo thời gian thực cùng thượng khách"
      fullHeight={true}
    >
      {/* Outer Viewport-Constrained Container */}
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--bg-card)] border border-[var(--border)] rounded-sm shadow-2xl">
        {/* Top Chat Global Toolbar */}
        <div className="shrink-0 px-4 py-2.5 bg-[var(--bg-card-muted)] border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                Tư vấn trực tiếp
              </span>
            </div>
            <span className="text-[var(--border)] hidden sm:inline">|</span>
            <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
              Kênh tư vấn may đo & CSKH cao cấp Atelier Vérité
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                loadConversations();
                addToast('Đã làm mới danh sách hội thoại!', 'info');
              }}
              className="px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent)] shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              title="Làm mới danh sách phiên trò chuyện"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="text-[11px] font-mono tracking-wider">Làm mới</span>
            </button>
          </div>
        </div>

        {/* Main Split Grid Layout */}
        <div className="grid min-h-0 min-w-0 flex-1 overflow-hidden md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]">
          {/* ========================================================================= */}
          {/* LEFT: Conversation List Aside (Independent Scroll) */}
          {/* ========================================================================= */}
          <aside
            className={`flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-[var(--border)] bg-[var(--bg-sidebar)] ${
              mobileView === 'list' ? 'flex w-full' : 'hidden md:flex'
            }`}
          >
            {/* Conversation List Header & Search */}
            <div className="shrink-0 p-3 border-b border-[var(--border)] space-y-2 bg-[var(--bg-card-muted)]">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">
                <span>Hội Thoại Mở ({filteredConversations.length})</span>
                {conversations.some((c) => (c.unreadCount || 0) > 0) && (
                  <span className="px-1.5 py-0.5 bg-[var(--accent)] text-[var(--accent-contrast)] text-[10px] font-bold rounded-full">
                    {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)} mới
                  </span>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm khách hàng hoặc tin nhắn..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm placeholder-[var(--text-muted)]"
                />
              </div>
            </div>

            {/* Conversation List Scroll Area */}
            <div
              data-testid="conversation-list-scroll"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain divide-y divide-[var(--border)]"
            >
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)] text-xs space-y-2">
                  <MessageSquare className="w-8 h-8 text-[var(--text-muted)]/30 mx-auto mb-2" />
                  <p>Không tìm thấy cuộc trò chuyện phù hợp</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedConv.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full text-left p-3.5 transition-all flex gap-3 items-start group ${
                        isSelected
                          ? 'bg-[var(--accent)]/15 border-l-2 border-[var(--accent)] text-[var(--text-primary)]'
                          : 'hover:bg-[var(--table-row-hover)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {/* Avatar with status indicator */}
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] text-xs font-bold font-serif">
                          {conv.customerName.charAt(0)}
                        </div>
                        <span
                          className={`w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-card)] absolute -bottom-0.5 -right-0.5 ${
                            conv.isOnline ? 'bg-emerald-500' : 'bg-zinc-400'
                          }`}
                          title={conv.isOnline ? 'Đang hoạt động' : formatLastActiveTime(conv.lastActiveAt)}
                        />
                      </div>

                      {/* Conversation text info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-serif text-[var(--text-primary)] text-xs truncate group-hover:text-[var(--accent)] transition-colors">
                            {conv.customerName}
                          </span>
                          <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0">
                            {conv.updatedAt}
                          </span>
                        </div>

                        {/* Presence status indicator */}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              conv.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
                            }`}
                          />
                          <span
                            className={`text-[10px] font-mono truncate ${
                              conv.isOnline
                                ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                : 'text-[var(--text-muted)]'
                            }`}
                          >
                            {conv.isOnline ? 'Đang hoạt động' : formatLastActiveTime(conv.lastActiveAt)}
                          </span>
                        </div>

                        {(() => {
                          const isCustomer =
                            conv.lastMessageSender === 'customer' ||
                            (conv.unreadCount ?? 0) > 0 ||
                            conv.status === 'waiting_admin';
                          const customerCount =
                            (conv.unreadCount ?? 0) > 0
                              ? conv.unreadCount!
                              : (conv.customerMessageCount ?? 0) > 0
                              ? conv.customerMessageCount!
                              : 1;
                          const showCustomerBadge = isCustomer && customerCount > 0;

                          return (
                            <div className="flex items-center justify-between gap-2 mt-1 min-w-0">
                              <p
                                className={`text-[11px] truncate leading-relaxed flex-1 min-w-0 ${
                                  isCustomer
                                    ? 'font-bold text-[var(--text-primary)] dark:text-zinc-100'
                                    : 'font-normal text-[var(--text-muted)]'
                                }`}
                              >
                                {conv.lastMessageSender === 'admin' ? (
                                  <span className="text-[10px] font-mono text-[var(--accent)] mr-1">
                                    Bạn:
                                  </span>
                                ) : null}
                                {conv.lastMessage || 'Chưa có tin nhắn'}
                              </p>

                              {showCustomerBadge ? (
                                <span
                                  className="px-1.5 py-0.5 min-w-[18px] h-[18px] text-[10px] font-bold font-mono rounded-full bg-[var(--accent)] text-[var(--accent-contrast)] shadow-sm shrink-0 flex items-center justify-center"
                                  title={`${customerCount} tin nhắn từ khách hàng`}
                                >
                                  {customerCount}
                                </span>
                              ) : conv.status === 'closed' ? (
                                <span className="text-[9px] font-mono text-[var(--text-muted)] border border-[var(--border)] px-1 rounded shrink-0">
                                  Đã kết thúc
                                </span>
                              ) : null}
                            </div>
                          );
                        })()}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* ========================================================================= */}
          {/* RIGHT: Message Window (Independent Scroll) */}
          {/* ========================================================================= */}
          <section
            className={`flex min-h-0 min-w-0 flex-col overflow-hidden bg-[var(--bg-page)] ${
              mobileView === 'messages' ? 'flex flex-1 w-full' : 'hidden md:flex'
            }`}
          >
            {/* Conversation Header (Pinned) */}
            <div className="shrink-0 p-3 sm:p-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-card)]">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back to list button on mobile */}
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-lg shadow-xs hover:shadow-sm shrink-0"
                  title="Quay lại danh sách hội thoại"
                  aria-label="Quay lại danh sách"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] shrink-0 text-sm font-serif font-bold">
                    {selectedConv.customerName.charAt(0)}
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full border-2 border-[var(--bg-card)] absolute -bottom-0.5 -right-0.5 ${
                      selectedConv.isOnline ? 'bg-emerald-500' : 'bg-zinc-400'
                    }`}
                    title={selectedConv.isOnline ? 'Đang hoạt động' : formatLastActiveTime(selectedConv.lastActiveAt)}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm text-[var(--text-primary)] font-medium truncate">
                      {selectedConv.customerName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 text-[9px] font-mono uppercase tracking-wider hidden sm:inline-block">
                      {selectedConv.assignedAdminName
                        ? `Phụ trách: ${selectedConv.assignedAdminName}`
                        : 'Chưa gán nhân viên'}
                    </span>
                    {selectedConv.status === 'closed' && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-500/15 text-zinc-400 border border-zinc-500/30 text-[9px] font-mono uppercase tracking-wider">
                        Đã kết thúc
                      </span>
                    )}
                  </div>
                  {isCustomerTyping ? (
                    <span className="text-[10px] text-[var(--accent)] italic font-mono flex items-center gap-1.5 mt-0.5 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                      Khách hàng đang nhập...
                    </span>
                  ) : selectedConv.isOnline ? (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Đang hoạt động
                    </span>
                  ) : (
                    <span className="text-[10px] text-[var(--text-muted)] font-mono flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      {formatLastActiveTime(selectedConv.lastActiveAt)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons: Assign / End Session */}
              <div className="flex items-center gap-2">
                {selectedConv.status === 'closed' ? (
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-[11px] font-mono bg-zinc-500/10 border border-zinc-500/30 text-[var(--text-muted)] rounded-lg flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Đã kết thúc</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleReopenConversation}
                      className="px-2.5 py-1 text-[11px] font-mono bg-[var(--bg-card)] hover:bg-[var(--table-row-hover)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                      title="Mở lại phiên tư vấn này"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Mở lại phiên</span>
                    </button>
                  </div>
                ) : !selectedConv.assignedAdminId && !selectedConv.assignedAdminName ? (
                  <button
                    type="button"
                    onClick={handleAssignToMe}
                    className="px-3 py-1.5 text-xs font-mono bg-[var(--accent)] hover:brightness-105 text-[var(--accent-contrast)] border border-[var(--accent)] font-semibold shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Nhận cuộc trò chuyện này để bắt đầu tư vấn"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Nhận xử lý</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCloseConversation}
                    className="px-3 py-1.5 text-xs font-mono bg-[var(--bg-card)] hover:bg-rose-500/10 border border-[var(--border)] hover:border-rose-500 text-[var(--text-secondary)] hover:text-rose-600 dark:hover:text-rose-400 font-semibold shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Kết thúc phiên tư vấn với khách hàng này"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Kết thúc</span>
                  </button>
                )}
              </div>
            </div>

            {/* AI Handoff Context Banner if present */}
            {selectedConv.metadata?.handoffContext && (
              <div className="shrink-0 px-4 py-2 bg-[var(--accent)]/10 border-b border-[var(--accent)]/20 flex items-center gap-2 text-xs text-[var(--accent)]">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  Hội thoại được chuyển ngữ cảnh từ Trợ lý AI (kèm lịch sử các câu hỏi gần nhất).
                </span>
              </div>
            )}

            {/* Messages Scroll Area (Independent Scroll) */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              data-testid="message-list-scroll"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 space-y-3.5 text-xs relative"
            >
              {/* Consultation Security Badge */}
              <div className="p-2.5 mx-auto max-w-md bg-[var(--bg-card-muted)] border border-[var(--border)] rounded-sm text-center text-[11px] text-[var(--text-muted)] flex items-center justify-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                <span>Kênh tư vấn bảo mật dành riêng cho Thượng Khách Atelier Vérité</span>
              </div>

              {/* Message Bubbles */}
              {messages.map((m) => {
                const isAdmin = m.sender === 'admin';
                const isSystem = m.sender === 'system';

                if (isSystem) {
                  const isClose = m.text.includes('kết thúc');
                  return (
                    <div key={m.id} className="flex justify-center my-3">
                      <div
                        className={`px-3.5 py-1.5 rounded-full border text-[11px] font-mono flex items-center gap-1.5 shadow-sm ${
                          isClose
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
                            : 'bg-[var(--bg-card)] border-[var(--border)] text-[var(--accent)]'
                        }`}
                      >
                        {isClose ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : (
                          <Headphones className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                        <span>{m.text}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 items-end ${isAdmin ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isAdmin && (
                      <div className="w-7 h-7 rounded-full bg-[var(--border)] flex items-center justify-center text-[var(--text-primary)] shrink-0 mb-1 text-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-sm leading-relaxed shadow-md break-words ${
                        isAdmin
                          ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-medium'
                          : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)]'
                      }`}
                    >
                      {m.isHandoffContext && (
                        <div className="mb-1 text-[9.5px] font-mono text-[var(--accent)] flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Ngữ cảnh AI:</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      <span
                        className={`block text-[9px] mt-1.5 text-right font-mono ${
                          isAdmin ? 'opacity-80' : 'text-[var(--text-muted)]'
                        }`}
                      >
                        {m.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Bottom anchor for auto-scroll */}
              <div ref={messagesEndRef} />

              {/* Floating "Scroll to Bottom" Button */}
              {showScrollBottomBtn && (
                <button
                  type="button"
                  onClick={() => scrollToBottom(true)}
                  className="sticky bottom-2 left-1/2 -translate-x-1/2 px-3.5 py-1.5 bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-semibold rounded-full shadow-lg hover:opacity-90 transition-all flex items-center gap-1.5 z-10"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Xuống tin nhắn mới nhất</span>
                </button>
              )}
            </div>

            {/* Session Ended Notice */}
            {selectedConv.status === 'closed' && (
              <div className="shrink-0 px-4 py-2 bg-zinc-500/10 border-t border-[var(--border)] flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Phiên tư vấn này đã kết thúc. Gửi tin nhắn mới hoặc nhấn để mở lại phiên.</span>
                </div>
                <button
                  type="button"
                  onClick={handleReopenConversation}
                  className="px-2.5 py-1 text-[11px] font-mono text-[var(--accent)] hover:underline border border-[var(--accent)]/30 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 rounded-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Mở lại phiên</span>
                </button>
              </div>
            )}

            {/* Quick Response Templates (Pinned above composer) */}
            <div className="shrink-0 px-3 py-1.5 bg-[var(--bg-card-muted)] border-t border-[var(--border)] flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
              <span className="text-[var(--text-muted)] font-mono uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[var(--accent)]" /> Mẫu:
              </span>
              {QUICK_RESPONSES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReplyText(tmpl)}
                  className="px-2.5 py-1 bg-[var(--bg-card)] hover:bg-[var(--table-row-hover)] hover:text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent)] shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner rounded-lg text-[var(--text-muted)] truncate max-w-[200px] shrink-0 transition-all cursor-pointer"
                  title={tmpl}
                >
                  {tmpl}
                </button>
              ))}
            </div>

            {/* Message Composer Form (Pinned at Bottom) */}
            <form
              onSubmit={handleSendReply}
              className="shrink-0 p-3 border-t border-[var(--border)] flex items-end gap-2 bg-[var(--bg-card)]"
            >
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                rows={1}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập nội dung tư vấn gửi tới khách quý... (Enter để gửi, Shift+Enter xuống dòng)"
                className="flex-1 px-3.5 py-2.5 text-xs bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-lg resize-none max-h-32 min-h-[40px] leading-relaxed placeholder-[var(--text-muted)]"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSending}
                className="px-4 py-2.5 bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] font-bold font-mono hover:brightness-105 shadow-md hover:shadow-lg active:scale-95 active:shadow-inner transition-all disabled:opacity-40 text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
                title="Gửi tin nhắn"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isSending ? 'Đang gửi...' : 'Gửi'}</span>
              </button>
            </form>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

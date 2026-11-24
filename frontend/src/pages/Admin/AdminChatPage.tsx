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
} from 'lucide-react';
import { useToastStore } from '@/shared/stores/useToastStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { communicationApi } from '@/shared/api/communicationApi';
import { socketService } from '@/shared/services/socketService';

interface MessageItem {
  id: string;
  clientMessageId?: string;
  sender: 'customer' | 'admin';
  text: string;
  timestamp: string;
  isHandoffContext?: boolean;
}

interface Conversation {
  id: string;
  customerName: string;
  customerEmail: string;
  category: 'tailoring' | 'order' | 'general';
  lastMessage: string;
  updatedAt: string;
  unreadCount?: number;
  isOnline?: boolean;
  status?: string;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  metadata?: any;
  messages: MessageItem[];
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-1',
    customerName: 'Charlotte Vane',
    customerEmail: 'charlotte.vane@patron.atelierverite.com',
    category: 'tailoring',
    lastMessage: 'Tôi muốn tư vấn kích thước áo dạ Biella số đo vòng ngực 86cm.',
    updatedAt: '14:25',
    unreadCount: 1,
    isOnline: true,
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
    customerName: 'Jean-Luc Moreau',
    customerEmail: 'moreau.jl@luxury.paris',
    category: 'order',
    lastMessage: 'Xin cho hỏi thời gian hoàn thiện may đo đơn ORD-8923?',
    updatedAt: '12:40',
    unreadCount: 0,
    isOnline: true,
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
    customerName: 'Victoria Sterling',
    customerEmail: 'victoria.sterling@haute.uk',
    category: 'general',
    lastMessage: 'Tôi đã nhận được kiện hàng hộp gỗ tuyết tùng, vô cùng ưng ý!',
    updatedAt: 'Hôm qua',
    unreadCount: 0,
    isOnline: false,
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
    customerName: 'Alexander Wright',
    customerEmail: 'a.wright@manhattan.com',
    category: 'tailoring',
    lastMessage: 'Cho tôi hỏi ve áo Tuxedo sử dụng lụa Satin loại nào?',
    updatedAt: '18/11',
    unreadCount: 0,
    isOnline: false,
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
    customerName: 'Eleanor Vance',
    customerEmail: 'eleanor.v@geneva.ch',
    category: 'general',
    lastMessage: 'Tôi muốn đặt lịch hẹn tư vấn riêng tại Private Lounge.',
    updatedAt: '17/11',
    unreadCount: 0,
    isOnline: false,
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
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'tailoring' | 'order' | 'general'>('all');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const isSendingRef = useRef(false);
  const [mobileView, setMobileView] = useState<'list' | 'messages'>('list');
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

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
        const mapped: Conversation[] = list.map((c: any) => ({
          id: String(c._id || c.id),
          customerName: c.guestInfo?.name || c.customerId?.fullName || c.customerName || 'Khách Hàng',
          customerEmail: c.guestInfo?.email || c.customerId?.email || c.customerEmail || 'Chưa cung cấp email',
          category: (c.category || (c.type === 'support' ? 'tailoring' : 'general')) as any,
          lastMessage: c.lastMessage || 'Bắt đầu cuộc trò chuyện',
          updatedAt: new Date(c.lastMessageAt || c.updatedAt || Date.now()).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          unreadCount: c.unreadCount || (c.status === 'waiting_admin' ? 1 : 0),
          isOnline: true,
          status: c.status || 'open',
          assignedAdminId: c.assignedAdminId?._id || c.assignedAdminId || null,
          assignedAdminName: c.assignedAdminId?.fullName || null,
          metadata: c.metadata,
          messages: [],
        }));

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
          const msgId = String(m._id || m.id || m.clientMessageId);
          if (seenIds.has(msgId)) continue;
          seenIds.add(msgId);

          mappedMsgs.push({
            id: msgId,
            clientMessageId: m.clientMessageId,
            sender: (m.senderType === 'admin' ? 'admin' : 'customer') as any,
            text: m.content || '',
            timestamp: new Date(m.createdAt || Date.now()).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            isHandoffContext: Boolean(m.metadata?.isHandoffContext),
          });
        }

        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, messages: mappedMsgs } : c))
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
      const convId = message.conversationId;
      const incomingId = String(message._id || message.id || `m_${Date.now()}`);
      const clientMessageId = message.clientMessageId;

      const newMsg: MessageItem = {
        id: incomingId,
        clientMessageId,
        sender: message.senderType === 'admin' ? 'admin' : 'customer',
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

            return {
              ...c,
              lastMessage: newMsg.text,
              updatedAt: newMsg.timestamp,
              unreadCount: c.id === selectedConvId ? 0 : (c.unreadCount || 0) + 1,
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

    return () => {
      unsubMsg();
      unsubTypingStart();
      unsubTypingStop();
      unconvUpdated();
    };
    function unconvUpdated() {
      unsubConvUpdated();
    }
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
    const matchesCategory = categoryFilter === 'all' || conv.category === categoryFilter;
    return matchesSearch && matchesCategory;
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
            lastMessage: newMsg.text,
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
    try {
      if (!selectedConvId.startsWith('conv-')) {
        await communicationApi.assignConversation(selectedConvId, adminId);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId
            ? { ...c, assignedAdminId: adminId, assignedAdminName: user?.name || (user as any)?.fullName || 'Tôi' }
            : c
        )
      );
      addToast('Đã gán cuộc trò chuyện cho bạn phụ trách!', 'success');
    } catch (err: any) {
      addToast(err?.message || 'Không thể gán nhân viên phụ trách', 'error');
    }
  };

  // Close conversation
  const handleCloseConversation = async () => {
    try {
      if (!selectedConvId.startsWith('conv-')) {
        await communicationApi.closeConversation(selectedConvId);
      }
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId ? { ...c, status: 'closed' } : c
        )
      );
      addToast('Đã đóng cuộc trò chuyện CSKH thành công!', 'info');
    } catch (err: any) {
      addToast(err?.message || 'Không thể đóng cuộc trò chuyện', 'error');
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
                WebSocket Trực Tuyến
              </span>
            </div>
            <span className="text-[var(--border)] hidden sm:inline">|</span>
            <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
              Kênh tư vấn may đo & CSKH cao cấp Atelier Vérité
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border)] rounded-sm p-0.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-sm transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('tailoring')}
                className={`px-2.5 py-1 rounded-sm transition-colors ${
                  categoryFilter === 'tailoring'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                May đo
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('order')}
                className={`px-2.5 py-1 rounded-sm transition-colors ${
                  categoryFilter === 'order'
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Đơn hàng
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                loadConversations();
                addToast('Đã làm mới danh sách hội thoại!', 'info');
              }}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent)] rounded-sm transition-colors"
              title="Làm mới danh sách phiên trò chuyện"
            >
              <RefreshCw className="w-3.5 h-3.5" />
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
                        {conv.isOnline && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[var(--bg-card)] absolute -bottom-0.5 -right-0.5" />
                        )}
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

                        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5 leading-relaxed">
                          {conv.lastMessage}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.2 rounded-sm border ${
                              conv.category === 'tailoring'
                                ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                                : conv.category === 'order'
                                ? 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-300'
                                : 'bg-[var(--bg-card-muted)] border-[var(--border)] text-[var(--text-muted)]'
                            }`}
                          >
                            {conv.category === 'tailoring'
                              ? 'May Đo'
                              : conv.category === 'order'
                              ? 'Đơn Hàng'
                              : 'Chung'}
                          </span>

                          {conv.status === 'closed' && (
                            <span className="text-[9px] font-mono text-[var(--text-muted)] border border-[var(--border)] px-1 rounded">
                              Đã đóng
                            </span>
                          )}

                          {conv.unreadCount && conv.unreadCount > 0 ? (
                            <span className="w-2 h-2 rounded-full bg-[var(--accent)] ml-auto shrink-0" />
                          ) : null}
                        </div>
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
                  className="md:hidden p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-sm shrink-0"
                  title="Quay lại danh sách hội thoại"
                  aria-label="Quay lại danh sách"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="w-9 h-9 rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] shrink-0 text-sm font-serif font-bold">
                  {selectedConv.customerName.charAt(0)}
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
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {isCustomerTyping ? (
                      <span className="text-[var(--accent)] italic animate-pulse">Khách hàng đang nhập...</span>
                    ) : (
                      'Đang trực tuyến • Sẵn sàng phản hồi'
                    )}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Assign & Close */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAssignToMe}
                  className="px-2.5 py-1 text-[11px] font-mono bg-[var(--bg-card)] hover:bg-[var(--table-row-hover)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--accent)] rounded transition-colors flex items-center gap-1"
                  title="Gán cuộc trò chuyện cho bạn phụ trách"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nhận xử lý</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseConversation}
                  className="px-2.5 py-1 text-[11px] font-mono bg-[var(--bg-card)] hover:bg-red-500/10 border border-[var(--border)] hover:border-red-500 text-[var(--text-secondary)] hover:text-red-600 dark:hover:text-red-400 rounded transition-colors flex items-center gap-1"
                  title="Đóng hội thoại"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đóng</span>
                </button>
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
                  className="px-2.5 py-1 bg-[var(--bg-card)] hover:bg-[var(--table-row-hover)] hover:text-[var(--text-primary)] border border-[var(--border)] rounded-sm text-[var(--text-muted)] truncate max-w-[200px] shrink-0 transition-colors"
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
                className="flex-1 px-3.5 py-2.5 text-xs bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm resize-none max-h-32 min-h-[40px] leading-relaxed placeholder-[var(--text-muted)]"
              />
              <button
                type="submit"
                disabled={!replyText.trim() || isSending}
                className="px-4 py-2.5 bg-[var(--accent)] text-[var(--accent-contrast)] hover:opacity-90 transition-opacity disabled:opacity-40 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1.5 shrink-0 shadow-md"
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

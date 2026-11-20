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
        setConversations(mapped);
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
        const mappedMsgs: MessageItem[] = rawList.map((m: any) => ({
          id: String(m._id || m.id || m.clientMessageId),
          sender: (m.senderType === 'admin' ? 'admin' : 'customer') as any,
          text: m.content || '',
          timestamp: new Date(m.createdAt || Date.now()).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isHandoffContext: Boolean(m.metadata?.isHandoffContext),
        }));

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

      const newMsg: MessageItem = {
        id: message._id || message.id || `m_${Date.now()}`,
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
            const exists = c.messages.some((m) => m.id === newMsg.id);
            return {
              ...c,
              lastMessage: newMsg.text,
              updatedAt: newMsg.timestamp,
              unreadCount: c.id === selectedConvId ? 0 : (c.unreadCount || 0) + 1,
              messages: exists ? c.messages : [...c.messages, newMsg],
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
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    const content = replyText.trim();
    const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const localId = 'm-' + Date.now();

    const newMsg: MessageItem = {
      id: localId,
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

    // Call real Backend API if real conversation ID
    if (selectedConvId && !selectedConvId.startsWith('conv-')) {
      try {
        await communicationApi.sendAdminSupportMessage({
          conversationId: selectedConvId,
          content,
          clientMessageId: localId,
        });
      } catch (err: any) {
        addToast(err?.message || 'Lỗi khi gửi phản hồi', 'error');
      }
    }

    addToast('Đã gửi phản hồi thành công tới khách quý!', 'success');

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // Handle keyboard shortcut Enter to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
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
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-noir-900 border border-white/10 rounded-sm shadow-2xl">
        {/* Top Chat Global Toolbar */}
        <div className="shrink-0 px-4 py-2.5 bg-noir-950 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">
                WebSocket Trực Tuyến
              </span>
            </div>
            <span className="text-white/20 hidden sm:inline">|</span>
            <span className="text-[11px] text-platinum-dark hidden sm:inline">
              Kênh tư vấn may đo & CSKH cao cấp Atelier Vérité
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-noir-900 border border-white/10 rounded-sm p-0.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-sm transition-colors ${
                  categoryFilter === 'all'
                    ? 'bg-champagne text-noir-950 font-semibold'
                    : 'text-platinum-dark hover:text-white'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('tailoring')}
                className={`px-2.5 py-1 rounded-sm transition-colors ${
                  categoryFilter === 'tailoring'
                    ? 'bg-champagne text-noir-950 font-semibold'
                    : 'text-platinum-dark hover:text-white'
                }`}
              >
                May đo
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('order')}
                className={`px-2.5 py-1 rounded-sm transition-colors ${
                  categoryFilter === 'order'
                    ? 'bg-champagne text-noir-950 font-semibold'
                    : 'text-platinum-dark hover:text-white'
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
              className="p-1.5 text-platinum-dark hover:text-champagne border border-white/10 hover:border-champagne/40 rounded-sm transition-colors"
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
            className={`flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-white/10 bg-noir-900/70 ${
              mobileView === 'list' ? 'flex w-full' : 'hidden md:flex'
            }`}
          >
            {/* Conversation List Header & Search */}
            <div className="shrink-0 p-3 border-b border-white/10 space-y-2 bg-noir-950/40">
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-platinum-dark">
                <span>Hội Thoại Mở ({filteredConversations.length})</span>
                {conversations.some((c) => (c.unreadCount || 0) > 0) && (
                  <span className="px-1.5 py-0.5 bg-champagne text-noir-950 text-[10px] font-bold rounded-full">
                    {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)} mới
                  </span>
                )}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-platinum-dark absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm khách hàng hoặc tin nhắn..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-noir-950 border border-white/10 focus:border-champagne focus:outline-none text-white rounded-sm placeholder-platinum-dark"
                />
              </div>
            </div>

            {/* Conversation List Scroll Area */}
            <div
              data-testid="conversation-list-scroll"
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain divide-y divide-white/5"
            >
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-platinum-dark text-xs space-y-2">
                  <MessageSquare className="w-8 h-8 text-platinum-dark/30 mx-auto mb-2" />
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
                          ? 'bg-champagne/15 border-l-2 border-champagne text-white'
                          : 'hover:bg-white/5 text-platinum-light'
                      }`}
                    >
                      {/* Avatar with status indicator */}
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 rounded-full bg-champagne/20 border border-champagne/40 flex items-center justify-center text-champagne text-xs font-bold font-serif">
                          {conv.customerName.charAt(0)}
                        </div>
                        {conv.isOnline && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-noir-900 absolute -bottom-0.5 -right-0.5" />
                        )}
                      </div>

                      {/* Conversation text info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-serif text-white text-xs truncate group-hover:text-champagne transition-colors">
                            {conv.customerName}
                          </span>
                          <span className="font-mono text-[10px] text-platinum-dark shrink-0">
                            {conv.updatedAt}
                          </span>
                        </div>

                        <p className="text-[11px] text-platinum-dark truncate mt-0.5 leading-relaxed">
                          {conv.lastMessage}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span
                            className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.2 rounded-sm border ${
                              conv.category === 'tailoring'
                                ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                                : conv.category === 'order'
                                ? 'bg-blue-950/40 border-blue-800 text-blue-300'
                                : 'bg-white/5 border-white/10 text-platinum-dark'
                            }`}
                          >
                            {conv.category === 'tailoring'
                              ? 'May Đo'
                              : conv.category === 'order'
                              ? 'Đơn Hàng'
                              : 'Chung'}
                          </span>

                          {conv.status === 'closed' && (
                            <span className="text-[9px] font-mono text-neutral-400 border border-white/10 px-1 rounded">
                              Đã đóng
                            </span>
                          )}

                          {conv.unreadCount && conv.unreadCount > 0 ? (
                            <span className="w-2 h-2 rounded-full bg-champagne ml-auto shrink-0" />
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
            className={`flex min-h-0 min-w-0 flex-col overflow-hidden bg-noir-950 ${
              mobileView === 'messages' ? 'flex flex-1 w-full' : 'hidden md:flex'
            }`}
          >
            {/* Conversation Header (Pinned) */}
            <div className="shrink-0 p-3 sm:p-4 border-b border-white/10 flex items-center justify-between bg-noir-900/60 backdrop-blur-md">
              <div className="flex items-center gap-3 min-w-0">
                {/* Back to list button on mobile */}
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-1.5 text-platinum-dark hover:text-white border border-white/10 rounded-sm shrink-0"
                  title="Quay lại danh sách hội thoại"
                  aria-label="Quay lại danh sách"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="w-9 h-9 rounded-full bg-champagne/20 border border-champagne/40 flex items-center justify-center text-champagne shrink-0 text-sm font-serif font-bold">
                  {selectedConv.customerName.charAt(0)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm text-white font-medium truncate">
                      {selectedConv.customerName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-champagne/15 text-champagne border border-champagne/30 text-[9px] font-mono uppercase tracking-wider hidden sm:inline-block">
                      {selectedConv.assignedAdminName
                        ? `Phụ trách: ${selectedConv.assignedAdminName}`
                        : 'Chưa gán nhân viên'}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isCustomerTyping ? (
                      <span className="text-champagne italic animate-pulse">Khách hàng đang nhập...</span>
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
                  className="px-2.5 py-1 text-[11px] font-mono bg-white/5 hover:bg-champagne/20 border border-white/10 hover:border-champagne text-platinum-light hover:text-champagne rounded transition-colors flex items-center gap-1"
                  title="Gán cuộc trò chuyện cho bạn phụ trách"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nhận xử lý</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseConversation}
                  className="px-2.5 py-1 text-[11px] font-mono bg-white/5 hover:bg-red-950/40 border border-white/10 hover:border-red-500 text-platinum-light hover:text-red-400 rounded transition-colors flex items-center gap-1"
                  title="Đóng hội thoại"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Đóng</span>
                </button>
              </div>
            </div>

            {/* AI Handoff Context Banner if present */}
            {selectedConv.metadata?.handoffContext && (
              <div className="shrink-0 px-4 py-2 bg-champagne/10 border-b border-champagne/20 flex items-center gap-2 text-xs text-champagne">
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
              <div className="p-2.5 mx-auto max-w-md bg-white/5 border border-white/10 rounded-sm text-center text-[11px] text-platinum-dark flex items-center justify-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-champagne shrink-0" />
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
                      <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 mb-1 text-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-sm leading-relaxed shadow-md break-words ${
                        isAdmin
                          ? 'bg-champagne text-noir-950 font-medium'
                          : 'bg-noir-900 border border-white/10 text-white'
                      }`}
                    >
                      {m.isHandoffContext && (
                        <div className="mb-1 text-[9.5px] font-mono text-champagne flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Ngữ cảnh AI:</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      <span
                        className={`block text-[9px] mt-1.5 text-right font-mono ${
                          isAdmin ? 'text-noir-950/70' : 'text-platinum-dark'
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
                  className="sticky bottom-2 left-1/2 -translate-x-1/2 px-3.5 py-1.5 bg-champagne text-noir-950 text-xs font-semibold rounded-full shadow-lg hover:bg-champagne/90 transition-all flex items-center gap-1.5 z-10"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Xuống tin nhắn mới nhất</span>
                </button>
              )}
            </div>

            {/* Quick Response Templates (Pinned above composer) */}
            <div className="shrink-0 px-3 py-1.5 bg-noir-950 border-t border-white/5 flex items-center gap-1.5 overflow-x-auto text-[11px] scrollbar-none">
              <span className="text-platinum-dark font-mono uppercase tracking-wider text-[10px] shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-champagne" /> Mẫu:
              </span>
              {QUICK_RESPONSES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setReplyText(tmpl)}
                  className="px-2.5 py-1 bg-white/5 hover:bg-white/10 hover:text-white border border-white/10 rounded-sm text-platinum-dark truncate max-w-[200px] shrink-0 transition-colors"
                  title={tmpl}
                >
                  {tmpl}
                </button>
              ))}
            </div>

            {/* Message Composer Form (Pinned at Bottom) */}
            <form
              onSubmit={handleSendReply}
              className="shrink-0 p-3 border-t border-white/10 flex items-end gap-2 bg-noir-900"
            >
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                rows={1}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập nội dung tư vấn gửi tới khách quý... (Enter để gửi, Shift+Enter xuống dòng)"
                className="flex-1 px-3.5 py-2.5 text-xs bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none text-white rounded-sm resize-none max-h-32 min-h-[40px] leading-relaxed"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-4 py-2.5 bg-champagne text-noir-950 hover:bg-champagne/90 transition-colors disabled:opacity-40 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1.5 shrink-0 shadow-md shadow-champagne/10"
                title="Gửi tin nhắn"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gửi</span>
              </button>
            </form>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
};

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
} from 'lucide-react';
import { useToastStore } from '@/shared/stores/useToastStore';

interface MessageItem {
  id: string;
  sender: 'customer' | 'admin';
  text: string;
  timestamp: string;
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
      {
        id: 'm-6',
        sender: 'admin',
        text: 'Dạ hoàn toàn được ạ. Dịch vụ Custom Alteration của Atelier dành riêng cho thành viên Haute Circle sẵn sàng tinh chỉnh số đo chiều dài tay theo đúng thông số Bà yêu cầu trước khi đóng kiện.',
        timestamp: '14:26',
      },
      {
        id: 'm-7',
        sender: 'customer',
        text: 'Tuyệt vời. Phần cúc áo của mẫu này là cúc sừng tự nhiên hay cúc bọc vải cùng tone màu ạ?',
        timestamp: '14:28',
      },
      {
        id: 'm-8',
        sender: 'admin',
        text: 'Mẫu áo dạ Biella Haute Couture sử dụng cúc sừng trâu tự nhiên nhập khẩu từ vùng Tuscany, được các nghệ nhân mài bóng thủ công và khắc chìm biểu tượng hoa văn di sản của Atelier ở mặt sau.',
        timestamp: '14:30',
      },
      {
        id: 'm-9',
        sender: 'customer',
        text: 'Tôi rất thích chi tiết này. Hãy ghi chú thêm giúp tôi lót áo lụa tơ tằm dệt họa tiết Jacquard tone màu Champagne nhé.',
        timestamp: '14:32',
      },
      {
        id: 'm-10',
        sender: 'admin',
        text: 'Atelier đã ghi nhận chi tiết lót lụa Jacquard Champagne vào phiếu kỹ thuật may đo của Bà. Bản phác thảo điều chỉnh đã được chuyển đến Master Tailor phụ trách.',
        timestamp: '14:35',
      },
      {
        id: 'm-11',
        sender: 'customer',
        text: 'Thời gian hoàn tất và vận chuyển đến tư gia của tôi dự kiến là khi nào?',
        timestamp: '14:38',
      },
      {
        id: 'm-12',
        sender: 'admin',
        text: 'Thời gian hoàn thiện thủ công là 5 ngày làm việc. Kiện hàng sẽ được niêm phong trong hộp gỗ tuyết tùng và chuyển phát hỏa tốc có bảo hiểm toàn phần tới tư gia Bà Charlotte vào ngày 26/11.',
        timestamp: '14:40',
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
      {
        id: 'm-203',
        sender: 'customer',
        text: 'Kiện hàng vẫn sẽ được đóng gói trong hộp gỗ tuyết tùng có khắc chữ lồng monogram chứ?',
        timestamp: '12:38',
      },
      {
        id: 'm-204',
        sender: 'admin',
        text: 'Chính xác thưa Ông. Bộ trang phục sẽ được bảo quản bằng áo trùm vải lanh hữu cơ, đặt trong hộp gỗ tuyết tùng nguyên khối khắc monogram "JLM" mạ vàng tinh xảo.',
        timestamp: '12:40',
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
      {
        id: 'm-402',
        sender: 'admin',
        text: 'Kính chào Ông Alexander, tiêu chuẩn ve áo Tuxedo của Atelier mặc định sử dụng Silk Satin 100% nhập khẩu từ vùng hồ Como (Ý) với độ bóng mờ sang trọng bậc nhất.',
        timestamp: '16:05',
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
      {
        id: 'm-502',
        sender: 'admin',
        text: 'Kính chào Bà Eleanor, Atelier rất hân hạnh được đón tiếp Bà. Chuyên gia tư vấn thời trang cao cấp của chúng tôi sẽ chuẩn bị trà bánh và không gian thử đồ riêng tư dành cho Bà.',
        timestamp: '09:15',
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
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedConvId, setSelectedConvId] = useState<string>(INITIAL_CONVERSATIONS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'tailoring' | 'order' | 'general'>('all');
  const [replyText, setReplyText] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'messages'>('list');
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const prevMessagesLengthRef = useRef(0);

  const { addToast } = useToastStore();

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

    // Mark as read
    if (conv.unreadCount && conv.unreadCount > 0) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
      );
    }
  };

  // Handle sending reply
  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;

    const newMsg: MessageItem = {
      id: 'm-' + Date.now(),
      sender: 'admin',
      text: replyText.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
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
    addToast('Đã gửi phản hồi thành công tới khách quý!', 'success');

    // Auto-focus back on composer input
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
                setConversations([...INITIAL_CONVERSATIONS]);
                addToast('Đã làm mới dữ liệu hội thoại CSKH!', 'info');
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
                      Haute Circle Patron
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Đang trực tuyến • Phản hồi ngay
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-platinum-dark text-xs">
                <span className="text-[11px] font-mono text-platinum-dark hidden lg:inline">
                  {selectedConv.customerEmail}
                </span>
              </div>
            </div>

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
                <span>Kênh tư vấn mã hóa đầu cuối dành riêng cho Thượng Khách Atelier Vérité</span>
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

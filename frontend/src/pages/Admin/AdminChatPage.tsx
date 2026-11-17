import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { MessageSquare, Send, User, Bot, RotateCw, CheckCircle2 } from 'lucide-react';
import { adminApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { formatDate } from '@/shared/utils/formatters';

interface Conversation {
  id: string;
  customerName: string;
  lastMessage: string;
  updatedAt: string;
  unreadCount?: number;
}

interface MessageItem {
  id: string;
  sender: 'customer' | 'admin';
  text: string;
  timestamp: string;
}

export const AdminChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      customerName: 'Charlotte Vane',
      lastMessage: 'Tôi muốn tư vấn kích thước áo dạ Biella số đo vòng ngực 86cm.',
      updatedAt: new Date().toISOString(),
      unreadCount: 1,
    },
    {
      id: 'conv-2',
      customerName: 'Jean-Luc Moreau',
      lastMessage: 'Xin cho hỏi thời gian may đo hoàn tất đơn ORD-8923?',
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'conv-3',
      customerName: 'Victoria Sterling',
      lastMessage: 'Tôi đã nhận được kiện hàng hộp gỗ tuyết tùng, vô cùng ưng ý!',
      updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ]);

  const [selectedConv, setSelectedConv] = useState<Conversation>(conversations[0]);
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'm-1',
      sender: 'customer',
      text: 'Kính chào Atelier, tôi muốn tư vấn kích thước áo dạ Biella số đo vòng ngực 86cm.',
      timestamp: '14:20',
    },
    {
      id: 'm-2',
      sender: 'admin',
      text: 'Kính chào Bà Charlotte, với số đo vòng ngực 86cm, phom size FR 38 sẽ mang lại độ vừa vặn hoàn hảo, đảm bảo sự thoải mái khi mặc kèm áo len dệt bên trong.',
      timestamp: '14:22',
    },
  ]);
  const [replyText, setReplyText] = useState('');
  const { addToast } = useToastStore();

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const newMsg: MessageItem = {
      id: 'm-' + Date.now(),
      sender: 'admin',
      text: replyText.trim(),
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMsg]);
    setReplyText('');
    addToast('Đã gửi tin nhắn phản hồi tới khách quý!', 'success');
  };

  return (
    <AdminLayout
      title="Hộp Thư CSKH Trực Tuyến"
      subtitle="Kênh phản hồi và tư vấn may đo thời gian thực cùng thượng khách"
    >
      <div className="bg-noir-900 border border-white/10 rounded-sm h-[650px] flex flex-col md:flex-row overflow-hidden">
        {/* Left: Conversation List */}
        <div className="w-full md:w-80 border-r border-white/10 flex flex-col shrink-0">
          <div className="p-4 border-b border-white/10 text-xs font-mono uppercase tracking-wider text-platinum-dark">
            Các Phiên Tư Vấn Đang Mở ({conversations.length})
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => setSelectedConv(conv)}
                className={`w-full text-left p-4 transition-colors flex gap-3 ${
                  selectedConv.id === conv.id
                    ? 'bg-champagne/15 border-l-2 border-champagne'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-champagne/20 border border-champagne/40 flex items-center justify-center text-champagne shrink-0 text-xs font-bold">
                  {conv.customerName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-serif text-white text-xs truncate">
                      {conv.customerName}
                    </span>
                    {conv.unreadCount && (
                      <span className="w-2 h-2 rounded-full bg-champagne" />
                    )}
                  </div>
                  <p className="text-[11px] text-platinum-dark truncate mt-0.5">
                    {conv.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Message Window */}
        <div className="flex-1 flex flex-col min-w-0 bg-noir-950">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-noir-900/40">
            <div>
              <span className="font-serif text-sm text-white block">
                {selectedConv.customerName}
              </span>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Đang trực tuyến
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'customer' && (
                  <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] p-3 rounded-sm leading-relaxed ${
                    m.sender === 'admin'
                      ? 'bg-champagne text-noir-950 font-medium'
                      : 'bg-noir-900 border border-white/10 text-white'
                  }`}
                >
                  <p>{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right font-mono ${
                      m.sender === 'admin' ? 'text-noir-950/70' : 'text-platinum-dark'
                    }`}
                  >
                    {m.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          <form onSubmit={handleSendReply} className="p-3 border-t border-white/10 flex gap-2 bg-noir-900">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Nhập nội dung tư vấn gửi tới khách quý..."
              className="flex-1 px-3 py-2 text-xs bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none text-white rounded-sm"
            />
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="px-4 py-2 bg-champagne text-noir-950 hover:bg-champagne/90 transition-colors disabled:opacity-50 text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

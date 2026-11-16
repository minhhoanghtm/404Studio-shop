import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, User, RotateCw, ShoppingBag } from 'lucide-react';
import { aiApi } from '../api';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';

interface Message {
  role: 'assistant' | 'user';
  text: string;
  recommendations?: any[];
}

export const AiAssistantModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Kính chào quý khách. Tôi là Stylist AI của Atelier Vérité. Quý khách đang tìm kiếm trang phục cho sự kiện đặc biệt, cần tư vấn phom dáng hay hướng dẫn chọn size chuẩn xác?',
      recommendations: [
        {
          name: 'Áo Khoác Dạ Len Biella Cashmere Coat',
          price: 58500000,
          slug: 'ao-khoac-da-len-biella-cashmere-coat',
        },
      ],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', text: userText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await aiApi.chat(userText, messages);
      if (res?.data?.reply || res?.reply) {
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            text: res?.data?.reply || res?.reply,
            recommendations: res?.data?.recommendations || res?.recommendations,
          },
        ]);
      } else {
        // Fallback intelligent stylist response
        setMessages([
          ...newMessages,
          {
            role: 'assistant',
            text: `Với yêu cầu "${userText}", chuyên gia may đo khuyên quý khách nên ưu tiên các thiết kế cắt xéo 45 độ trên chất liệu lụa Lyon hoặc dạ len dệt Biella để tôn vinh tối đa vóc dáng mà vẫn giữ nét thanh lịch chuẩn mực.`,
            recommendations: [
              {
                name: 'Đầm Lụa Lyon Bias-Cut Evening Gown',
                price: 49500000,
                slug: 'dam-lua-lyon-bias-cut-evening-gown',
              },
            ],
          },
        ]);
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          text: `Cảm ơn quý khách. Chúng tôi xin gợi ý dòng sản phẩm dạ len dệt Biella với cấu trúc vai vuông tự nhiên và chiết eo tinh tế, hoàn hảo cho phong cách quý phái.`,
          recommendations: [
            {
              name: 'Áo Khoác Dạ Len Biella Cashmere Coat',
              price: 58500000,
              slug: 'ao-khoac-da-len-biella-cashmere-coat',
            },
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-surface border border-theme w-full sm:max-w-xl sm:rounded-sm shadow-2xl flex flex-col h-[85vh] sm:h-[650px] animate-fade-in text-primary">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between bg-surface-subtle/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center text-accent">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base tracking-wide flex items-center gap-2">
                <span>Stylist AI Atelier Vérité</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h3>
              <span className="text-[11px] text-secondary">Tư Vấn May Đo & Phối Đồ Trực Tuyến</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-secondary hover:text-primary transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3.5 leading-relaxed rounded-sm ${
                  m.role === 'user'
                    ? 'bg-accent text-black font-medium'
                    : 'bg-surface-subtle border border-theme text-primary'
                }`}
              >
                <p>{m.text}</p>
                {m.recommendations && m.recommendations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-theme/60 space-y-2">
                    <span className="text-[10px] uppercase tracking-wider text-secondary block">
                      Tác Phẩm Gợi Ý Cho Quý Khách:
                    </span>
                    {m.recommendations.map((rec: any, rIdx: number) => (
                      <Link
                        key={rIdx}
                        to={`/products/${rec.slug || ''}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-2 bg-surface border border-theme/80 hover:border-accent transition-colors gap-2 text-primary"
                      >
                        <span className="font-serif text-[11px] truncate">{rec.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {rec.price && (
                            <span className="font-mono text-[11px] font-bold text-accent">
                              {formatCurrency(rec.price)}
                            </span>
                          )}
                          <ShoppingBag className="w-3 h-3 text-secondary" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-primary/20 border border-theme flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-secondary">
              <Bot className="w-4 h-4 text-accent" />
              <div className="flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 animate-spin text-accent" />
                <span className="text-[11px]">Stylist đang suy nghĩ giải pháp phối đồ...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-theme bg-surface flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi về size, chất liệu vải, trang phục dạ tiệc..."
            className="flex-1 px-4 py-2.5 text-xs bg-surface-subtle border border-theme focus:border-accent focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 bg-primary text-secondary hover:bg-accent hover:text-black transition-colors disabled:opacity-50"
            aria-label="Gửi tin"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

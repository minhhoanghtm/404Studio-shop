import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, User, RotateCw, ShoppingBag, ShieldAlert } from 'lucide-react';
import { aiApi } from '../api';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/formatters';

type PendingAction = Record<string, unknown> & { actionType?: string; actionId?: string };
interface Recommendation { _id?: string; id?: string; name?: string; slug?: string; price?: number; finalPrice?: number; }
interface Message { role: 'assistant' | 'user'; text: string; recommendations?: Recommendation[]; pendingAction?: PendingAction | null; }

const initialMessage: Message = { role: 'assistant', text: 'Tôi có thể giúp tìm sản phẩm, kiểm tra biến thể và chuẩn bị giỏ hàng. Mọi thao tác thay đổi giỏ hoặc thanh toán đều cần bạn xác nhận.' };
const sensitive = (value: string) => /(?:mật khẩu|password|otp|mã xác minh|số thẻ|cvc|cvv|api[ _-]?key|secret|token)/i.test(value);
const recommendations = (data: any): Recommendation[] => {
  const result = [data?.recommendations, data?.actionResult?.products, data?.actionResult?.items, data?.products].find(Array.isArray);
  return Array.isArray(result) ? result.filter((item) => item && (item.slug || item.name)) : [];
};
const textFrom = (data: any) => data?.aiMessage?.content || data?.reply || data?.answer || data?.message || 'Tôi chưa nhận được phản hồi hợp lệ từ hệ thống. Vui lòng thử lại.';

export const AiAssistantModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  if (!isOpen) return null;

  const send = async (content: string, pendingAction?: PendingAction, cancel = false) => {
    if (!content.trim() || isLoading) return;
    if (sensitive(content)) {
      setMessages((current) => [...current, { role: 'user', text: content }, { role: 'assistant', text: 'Vì an toàn, không gửi OTP, mật khẩu, thông tin thẻ, mã CVC hoặc khóa truy cập trong khung chat. Tôi không cần các thông tin đó để hỗ trợ mua sắm.' }]);
      setInput('');
      return;
    }
    setInput('');
    setMessages((current) => [...current, { role: 'user', text: content }]);
    setIsLoading(true);
    try {
      const response = await aiApi.chat(content, { conversationId, confirmAction: cancel ? undefined : pendingAction, cancelAction: cancel ? pendingAction || true : undefined });
      const data = response?.data ?? response;
      setConversationId(data?.conversationId || conversationId);
      setMessages((current) => [...current, { role: 'assistant', text: textFrom(data), recommendations: recommendations(data), pendingAction: data?.pendingAction || null }]);
    } catch (error: any) {
      setMessages((current) => [...current, { role: 'assistant', text: error?.message || 'Không thể kết nối Stylist AI lúc này. Không có thay đổi nào được thực hiện.' }]);
    } finally { setIsLoading(false); }
  };

  return <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Stylist AI">
    <div className="bg-surface border border-theme w-full sm:max-w-2xl sm:rounded-sm shadow-2xl flex flex-col h-[88vh] sm:h-[700px] text-primary min-w-0">
      <div className="p-4 sm:p-5 border-b border-theme flex items-center justify-between bg-surface-subtle/80"><div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/40 flex items-center justify-center text-accent shrink-0"><Sparkles className="w-5 h-5" /></div><div className="min-w-0"><h3 className="font-serif text-base tracking-wide truncate">Stylist AI Atelier Vérité</h3><span className="text-[11px] text-secondary">Tư vấn dựa trên dữ liệu cửa hàng</span></div></div><button type="button" onClick={onClose} className="p-1.5 text-secondary hover:text-primary" aria-label="Đóng"><X className="w-5 h-5" /></button></div>
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 text-xs">{messages.map((message, index) => <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
        {message.role === 'assistant' && <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent shrink-0 mt-0.5"><Bot className="w-4 h-4" /></div>}
        <div className={`max-w-[85%] p-3.5 leading-relaxed rounded-sm min-w-0 ${message.role === 'user' ? 'bg-accent text-black font-medium' : 'bg-surface-subtle border border-theme text-primary'}`}><p>{message.text}</p>
          {message.recommendations?.map((product, productIndex) => <Link key={product._id || product.id || product.slug || productIndex} to={`/products/${product.slug || ''}`} onClick={onClose} className="mt-3 flex items-center justify-between p-2 bg-surface border border-theme/80 hover:border-accent gap-2 text-primary"><span className="font-serif text-[11px] truncate">{product.name || 'Sản phẩm'}</span><span className="font-mono text-[11px] font-bold text-accent shrink-0">{typeof (product.finalPrice ?? product.price) === 'number' ? formatCurrency(product.finalPrice ?? product.price!) : 'Xem chi tiết'}</span><ShoppingBag className="w-3 h-3 text-secondary shrink-0" /></Link>)}
          {message.pendingAction && <div className="mt-3 pt-3 border-t border-theme/60 flex flex-wrap gap-2"><button type="button" disabled={isLoading} onClick={() => void send('Xác nhận', message.pendingAction ?? undefined)} className="px-3 py-2 bg-accent text-black font-semibold disabled:opacity-50">Xác nhận thao tác</button><button type="button" disabled={isLoading} onClick={() => void send('Hủy', message.pendingAction ?? undefined, true)} className="px-3 py-2 border border-theme text-secondary hover:text-primary disabled:opacity-50">Hủy</button></div>}
        </div>{message.role === 'user' && <div className="w-7 h-7 rounded-full bg-primary/20 border border-theme flex items-center justify-center text-primary shrink-0 mt-0.5"><User className="w-4 h-4" /></div>}
      </div>)}{isLoading && <div className="flex gap-3 items-center text-secondary"><Bot className="w-4 h-4 text-accent" /><RotateCw className="w-3.5 h-3.5 animate-spin text-accent" /><span>Stylist đang kiểm tra dữ liệu cửa hàng...</span></div>}</div>
      <div className="px-4 pb-2 flex items-center gap-2 text-[10px] text-secondary"><ShieldAlert className="w-3.5 h-3.5 shrink-0" />Không gửi OTP, mật khẩu, thông tin thẻ hoặc mã bảo mật.</div>
      <form onSubmit={(event) => { event.preventDefault(); void send(input); }} className="p-3 sm:p-4 border-t border-theme bg-surface flex gap-2"><input type="text" value={input} onChange={(event) => setInput(event.target.value)} maxLength={5000} placeholder="Ví dụ: Tìm áo trắng dưới 500 nghìn" className="flex-1 min-w-0 px-4 py-2.5 text-xs bg-surface-subtle border border-theme focus:border-accent focus:outline-none" /><button type="submit" disabled={!input.trim() || isLoading} className="px-4 py-2.5 bg-primary text-secondary hover:bg-accent hover:text-black disabled:opacity-50" aria-label="Gửi"><Send className="w-4 h-4" /></button></form>
    </div>
  </div>;
};

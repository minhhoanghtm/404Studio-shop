import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { useToastStore } from '@/shared/stores/useToastStore';
import { vi } from '@/shared/locales/vi/common';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [inquiryType, setInquiryType] = useState('Đặt lịch hẹn thử đồ Salon riêng');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const { addToast } = useToastStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setIsSent(true);
    addToast({
      type: 'success',
      title: 'Đã tiếp nhận yêu cầu Concierge',
      message: 'Quản lý Salon riêng Place Vendôme sẽ liên hệ trực tiếp tới quý khách trong vòng 24 giờ.',
    });
  };

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            SALONS PRIVÉS & DỊCH VỤ CONCIERGE RIÊNG
          </span>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
            Liên hệ Concierge
          </h1>
          <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
            Đặt lịch hẹn thử đồ riêng tại các salon Paris và Tokyo, yêu cầu đo may Haute Couture hoặc nhận tư vấn phong cách từ đội ngũ chuyên gia tạo mẫu Maison.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Contact Details & Salons */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6">
              <h3 className="font-display text-2xl text-white">Paris Salon Privé</h3>
              <div className="space-y-4 text-xs font-sans text-platinum-dark">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-champagne flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">14 Place Vendôme</strong>
                    <span>75001 Paris, France</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-champagne flex-shrink-0" />
                  <span className="text-white font-mono">+33 1 42 68 55 00</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-champagne flex-shrink-0" />
                  <span>Thứ Hai – Thứ Bảy, 10:00 – 19:00 CET</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6">
              <h3 className="font-display text-2xl text-white">Tokyo Ginza Salon</h3>
              <div className="space-y-4 text-xs font-sans text-platinum-dark">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-champagne flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">6-10-1 Ginza, Chuo-ku</strong>
                    <span>Tokyo 104-0061, Japan</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-champagne flex-shrink-0" />
                  <span className="text-white font-mono">+81 3 5537 2000</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6">
              <h3 className="font-display text-2xl text-white">Việt Nam Concierge Desk</h3>
              <div className="space-y-4 text-xs font-sans text-platinum-dark">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-champagne flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-medium">68 Nguyễn Du, Bến Nghé, Quận 1</strong>
                    <span>TP. Hồ Chí Minh, Việt Nam</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-champagne flex-shrink-0" />
                  <span className="text-white font-mono">+84 28 3822 5500</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-2xl bg-noir-900 border border-white/10 shadow-2xl">
              <h3 className="font-display text-2xl text-white mb-6">Gửi Yêu Cầu Riêng Tới Concierge</h3>

              {isSent ? (
                <div className="py-16 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-champagne mx-auto" />
                  <h4 className="font-display text-2xl text-white">Yêu Cầu Đã Được Tiếp Nhận</h4>
                  <p className="text-xs text-platinum-dark max-w-sm mx-auto">
                    Thông tin của quý khách đã được chuyển tới Giám đốc Salon Privé. Chúng tôi rất hân hạnh được đón tiếp quý khách.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/60 mb-1.5">Họ và tên quý khách *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="VD: Nguyễn Văn An"
                        className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 mb-1.5">Email liên hệ riêng *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="patron@domain.com"
                        className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/60 mb-1.5">Số điện thoại</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+84 90 123 4567"
                        className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 mb-1.5">Loại hình yêu cầu</label>
                      <select
                        value={inquiryType}
                        onChange={(e) => setInquiryType(e.target.value)}
                        className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none"
                      >
                        <option value="Đặt lịch hẹn thử đồ Salon riêng">Đặt lịch hẹn thử đồ Salon riêng</option>
                        <option value="May đo Haute Couture Sur Mesure">May đo Haute Couture Sur Mesure</option>
                        <option value="Hỗ trợ đơn hàng & Giao vận ngoại giao">Hỗ trợ đơn hàng & Giao vận ngoại giao</option>
                        <option value="Liên hệ hợp tác nghệ thuật & Báo chí">Liên hệ hợp tác nghệ thuật & Báo chí</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/60 mb-1.5">Nội dung trao đổi *</label>
                    <textarea
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      placeholder="Quý khách vui lòng cho biết thời gian mong muốn, địa điểm salon hoặc thông tin tác phẩm quý khách quan tâm..."
                      className="w-full px-4 py-3 bg-noir-950 border border-white/15 rounded-lg text-white focus:border-champagne outline-none leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 px-6 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01]"
                  >
                    <span>Gửi tin nhắn bảo mật</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

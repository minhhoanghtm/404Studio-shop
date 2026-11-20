import React, { useState } from 'react';
import { Phone, MapPin, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [inquiryType, setInquiryType] = useState('Đặt lịch hẹn thử đồ Salon riêng');
  const [message, setMessage] = useState('');
  const [agreeContact, setAgreeContact] = useState(false);
  const [agreeLookbook, setAgreeLookbook] = useState(false);
  const [consentError, setConsentError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeContact) {
      setConsentError('Quý khách vui lòng đồng ý cho phép xử lý thông tin liên hệ để nhận tư vấn.');
      return;
    }
    setConsentError('');
    setIsSent(true);
  };

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-screen py-16 px-4 sm:px-6 lg:px-8 pt-28">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)]">
            DỊCH VỤ CONCIERGE & HẸN SALON
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl text-[var(--text)] tracking-wide font-medium">
            Liên Hệ Maison Atelier
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-sans font-light leading-relaxed">
            Dịch vụ chăm sóc riêng biệt cho khách hàng danh dự, các buổi hẹn thử đồ riêng tư tại Paris, Tokyo và TP. Hồ Chí Minh.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Salon Hubs */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-6">
              <h3 className="font-serif text-2xl text-[var(--text)]">Paris Salon Privé</h3>
              <div className="space-y-4 text-xs font-sans text-[var(--text-muted)]">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[var(--text)] block font-medium">18 Place Vendôme, 75001</strong>
                    <span>Paris, Cộng hòa Pháp</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
                  <span className="text-[var(--text)] font-mono">+33 1 42 68 00 00</span>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-6">
              <h3 className="font-serif text-2xl text-[var(--text)]">Việt Nam Concierge Desk</h3>
              <div className="space-y-4 text-xs font-sans text-[var(--text-muted)]">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[var(--text)] block font-medium">18 Đồng Khởi, Bến Nghé, Quận 1</strong>
                    <span>TP. Hồ Chí Minh, Việt Nam</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
                  <span className="text-[var(--text)] font-mono">1900 8924 / +84 28 3822 5500</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-xl">
              <h3 className="font-serif text-2xl text-[var(--text)] mb-6 font-medium">Gửi Yêu Cầu Riêng Tới Concierge</h3>

              {isSent ? (
                <div className="py-16 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-[var(--accent)] mx-auto" />
                  <h4 className="font-serif text-2xl text-[var(--text)]">Yêu Cầu Đã Được Tiếp Nhận</h4>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto font-light leading-relaxed">
                    Thông tin của quý khách đã được chuyển tới Giám đốc Salon Privé. Chúng tôi rất hân hạnh được đón tiếp quý khách.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 text-xs font-sans">
                  
                  {/* Prior Notice Box */}
                  <div className="p-3.5 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] space-y-1 leading-relaxed font-light">
                    <div className="flex items-center gap-1.5 font-medium text-xs text-[var(--accent)]">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Thông Báo Xử Lý Dữ Liệu Liên Hệ</span>
                    </div>
                    <p>
                      Dữ liệu: Tên, email, số điện thoại, nội dung yêu cầu. Mục đích: Phản hồi thắc mắc và sắp xếp lịch tư vấn salon theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[var(--text-muted)] mb-1.5">Họ và tên quý khách *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="VD: Nguyễn Văn An"
                        className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-muted)] mb-1.5">Email liên hệ riêng *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="patron@domain.com"
                        className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[var(--text-muted)] mb-1.5">Số điện thoại</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+84 90 123 4567"
                        className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[var(--text-muted)] mb-1.5">Loại hình yêu cầu</label>
                      <select
                        value={inquiryType}
                        onChange={(e) => setInquiryType(e.target.value)}
                        className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-lg text-[var(--text)] focus:border-[var(--accent)] outline-none"
                      >
                        <option value="Đặt lịch hẹn thử đồ Salon riêng">Đặt lịch hẹn thử đồ Salon riêng</option>
                        <option value="May đo Haute Couture Sur Mesure">May đo Haute Couture Sur Mesure</option>
                        <option value="Hỗ trợ đơn hàng & Giao vận ngoại giao">Hỗ trợ đơn hàng & Giao vận ngoại giao</option>
                        <option value="Liên hệ hợp tác nghệ thuật & Báo chí">Liên hệ hợp tác nghệ thuật & Báo chí</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[var(--text-muted)] mb-1.5">Nội dung trao đổi *</label>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      placeholder="Quý khách vui lòng cho biết thời gian mong muốn, địa điểm salon hoặc thông tin sản phẩm quý khách quan tâm..."
                      className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border)] rounded-lg text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] outline-none leading-relaxed"
                    />
                  </div>

                  {/* Consent Checkboxes */}
                  <div className="space-y-2 pt-1 text-[11px] text-[var(--text-muted)] leading-relaxed">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeContact}
                        onChange={(e) => {
                          setAgreeContact(e.target.checked);
                          if (e.target.checked) setConsentError('');
                        }}
                        className="w-4 h-4 rounded mt-0.5 accent-[var(--accent)] cursor-pointer"
                      />
                      <span>
                        Tôi đồng ý cho phép Atelier Vérité xử lý thông tin liên hệ để tư vấn và sắp xếp lịch hẹn salon. <span className="text-[var(--accent)]">*</span>
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeLookbook}
                        onChange={(e) => setAgreeLookbook(e.target.checked)}
                        className="w-4 h-4 rounded mt-0.5 accent-[var(--accent)] cursor-pointer"
                      />
                      <span>
                        Tôi đồng ý nhận ấn phẩm Lookbook độc quyền và thư mời Runway qua email (Tùy chọn).
                      </span>
                    </label>

                    {consentError && (
                      <p className="text-[11px] text-[var(--status-error)] font-medium">{consentError}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 px-6 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
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

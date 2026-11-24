import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, ArrowRight, CheckCircle2, ShieldCheck, Mail } from 'lucide-react';
import { useConsentStore } from '../consent';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const Footer: React.FC = () => {
  const [currency, setCurrency] = useState('VND (₫)');
  const openPreferences = useConsentStore((state) => state.openPreferences);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newsletterMsg, setNewsletterMsg] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();

    if (!trimmed) {
      setNewsletterStatus('error');
      setNewsletterMsg('Quý khách vui lòng nhập địa chỉ email.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setNewsletterStatus('error');
      setNewsletterMsg('Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    if (!newsletterConsent) {
      setNewsletterStatus('error');
      setNewsletterMsg('Quý khách vui lòng đánh dấu đồng ý chính sách bảo mật.');
      return;
    }

    setNewsletterStatus('success');
    setNewsletterMsg(`Trân trọng cảm ơn quý khách. Thư mời đã được gửi tới ${trimmed}.`);
    setNewsletterEmail('');
  };

  return (
    <footer className="w-full bg-[var(--bg-alt)] border-t border-[var(--border)] text-[var(--text)] pt-10 pb-6 transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* =========================================
            HÀNG 1: LOGO, TÔN CHỈ & NEWSLETTER INVITATION (HỢP NHẤT GỌN GÀNG)
            ========================================= */}
        <div className="pb-8 border-b border-[var(--border)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Brand Intro & Locations */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center gap-3">
                <Link
                  to="/"
                  className="font-serif text-2xl tracking-[0.14em] text-[var(--text)] hover:text-[var(--accent)] transition-colors font-medium"
                  aria-label="Trang chủ Atelier Vérité"
                >
                  ATELIER VÉRITÉ
                </Link>
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] border-l border-[var(--border)] pl-3">
                  PARIS · MILAN · TOKYO · SÀI GÒN
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed font-light max-w-md">
                Nhà mốt may đo kiến trúc và phục trang đương đại. Từng phom dáng được định hình để chuyển động tự nhiên cùng cơ thể trong đời sống thực.
              </p>
            </div>

            {/* Newsletter Private Invitation */}
            <div className="lg:col-span-7">
              {newsletterStatus === 'success' ? (
                <div className="p-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{newsletterMsg}</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--accent)] font-mono font-medium">
                    <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                      <Mail className="w-3 h-3" /> THƯ MỜI RIÊNG · ĐẶC QUYỀN HỘI VIÊN KÍN
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => {
                        setNewsletterEmail(e.target.value);
                        if (newsletterStatus === 'error') setNewsletterStatus('idle');
                      }}
                      placeholder="Nhập địa chỉ email của quý khách..."
                      className="flex-1 bg-[var(--surface)] border border-[var(--border)] px-3.5 py-2.5 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] font-light"
                      aria-label="Email nhận thư mời"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--text-primary)] text-[var(--bg-page)] text-xs uppercase tracking-[0.2em] font-medium hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
                    >
                      <span>Đăng Ký</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="checkbox"
                      id="footer-newsletter-consent"
                      checked={newsletterConsent}
                      onChange={(e) => setNewsletterConsent(e.target.checked)}
                      className="accent-[var(--accent)] cursor-pointer"
                    />
                    <label
                      htmlFor="footer-newsletter-consent"
                      className="text-[11px] text-[var(--text-muted)] font-light cursor-pointer select-none leading-none"
                    >
                      Tôi đồng ý nhận thư mời và xác nhận đã đọc{' '}
                      <Link to="/privacy-policy" className="underline hover:text-[var(--text)]">
                        Chính sách bảo mật
                      </Link>{' '}
                      (Luật 91/2025/QH15).
                    </label>
                  </div>

                  {newsletterStatus === 'error' && (
                    <p className="text-xs text-red-500 pt-0.5">{newsletterMsg}</p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>

        {/* =========================================
            HÀNG 2: 4 CỘT LINK TINH GỌN (THIẾT KẾ CÂN ĐỐI 1 MÀN HÌNH)
            ========================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 py-8 border-b border-[var(--border)] text-xs">
          {/* Cột 1: BỘ SƯU TẬP */}
          <div className="space-y-2.5">
            <h4 className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">
              BỘ SƯU TẬP
            </h4>
            <ul className="space-y-1.5 text-[var(--text-muted)] font-light text-[11px]">
              <li>
                <Link to="/collections" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Noir Absolu (FW26)
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-[var(--text)] hover:underline transition-colors">
                  L'Ombre Claire (SS26)
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Géométrie Pure (Couture)
                </Link>
              </li>
              <li>
                <Link to="/lookbooks" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Ấn phẩm Lookbooks mùa mới
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Toàn bộ danh mục sản phẩm
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 2: PHÁP LÝ & QUYỀN RIÊNG TƯ */}
          <div className="space-y-2.5">
            <h4 className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">
              PHÁP LÝ & QUYỀN RIÊNG TƯ
            </h4>
            <ul className="space-y-1.5 text-[var(--text-muted)] font-light text-[11px]">
              <li>
                <Link to="/privacy-policy" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Chính sách bảo mật (Luật 91/2025)
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Điều khoản sử dụng dịch vụ
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Chính sách Cookie riêng biệt
                </Link>
              </li>
              <li>
                <Link to="/returns-refunds" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Chính sách đổi trả & hoàn tiền
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openPreferences}
                  className="text-[var(--accent)] hover:underline flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  <SlidersHorizontal className="w-2.5 h-2.5" /> Cài đặt Cookie
                </button>
              </li>
            </ul>
          </div>

          {/* Cột 3: DỊCH VỤ KHÁCH HÀNG */}
          <div className="space-y-2.5">
            <h4 className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">
              DỊCH VỤ KHÁCH HÀNG
            </h4>
            <ul className="space-y-1.5 text-[var(--text-muted)] font-light text-[11px]">
              <li>
                <Link to="/support#faq" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Câu hỏi thường gặp (FAQ)
                </Link>
              </li>
              <li>
                <Link to="/support#shipping" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Vận chuyển găng tay trắng
                </Link>
              </li>
              <li>
                <Link to="/returns-refunds" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Đổi trả trong 07 ngày
                </Link>
              </li>
              <li>
                <Link to="/order-lookup" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Tra cứu đơn hàng vãng lai
                </Link>
              </li>
              <li>
                <Link to="/vouchers" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Kho ưu đãi & Mã đặc quyền
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: ATELIER */}
          <div className="space-y-2.5">
            <h4 className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">
              ATELIER
            </h4>
            <ul className="space-y-1.5 text-[var(--text-muted)] font-light text-[11px]">
              <li>
                <Link to="/about" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Tôn chỉ sáng tạo & Lịch sử
                </Link>
              </li>
              <li>
                <Link to="/journal" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Tạp chí chuyên đề & Khảo luận
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Không gian Quý khách (Patron Portal)
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Liên hệ Concierge riêng
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-[var(--text)] hover:underline transition-colors text-[var(--text-muted)] opacity-60">
                  Cổng quản trị Atelier (Admin)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* =========================================
            HÀNG CUỐI: COPYRIGHT, PHÁP LÝ & CHỌN TIỀN TỆ
            ========================================= */}
        <div className="pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[var(--text-muted)] font-mono">
            {/* Copyright & Legal */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <span>© 2026 ATELIER VÉRITÉ. MỌI QUYỀN ĐƯỢC BẢO LƯU.</span>
              <span className="hidden md:inline">•</span>
              <span className="text-[10px] text-[var(--text-muted)] opacity-80 inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[var(--accent)]" />
                TUÂN THỦ LUẬT 91/2025/QH15 &amp; NĐ 13/2023/NĐ-CP
              </span>
            </div>

            {/* Chọn Tiền Tệ */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Tiền tệ:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-[10px] font-mono px-2 py-1 rounded-none focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                aria-label="Lựa chọn tiền tệ hiển thị"
              >
                <option value="VND (₫)">VND (₫) — Việt Nam Đồng</option>
                <option value="USD ($)">USD ($) — USD Dollar</option>
                <option value="EUR (€)">EUR (€) — Euro</option>
                <option value="JPY (¥)">JPY (¥) — Japanese Yen</option>
              </select>
            </div>
          </div>

          {/* Dòng Mono Châm Ngôn */}
          <div className="text-center">
            <p className="font-mono text-[9px] sm:text-[10px] tracking-[0.16em] uppercase text-[var(--text-muted)] opacity-40 select-none">
              [ THIẾT KẾ VÌ ĐỜI SỐNG THỰC · MAY ĐO CÓ CHỦ ĐÍCH · 0% POLYESTER ]
            </p>
          </div>
        </div>

        {/* =========================================
            SIGNATURE WATERMARK WORDMARK (TỐI ƯU CHIỀU CAO VỪA 1 TRANG)
            ========================================= */}
        <div className="mt-4 overflow-hidden select-none pointer-events-none text-center">
          <p className="font-serif text-[6.5vw] font-bold tracking-tight uppercase leading-none opacity-[0.035] text-[var(--text-primary)] whitespace-nowrap">
            ATELIER VÉRITÉ
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

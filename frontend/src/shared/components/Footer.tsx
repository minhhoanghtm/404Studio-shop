import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { vi } from '../locales/vi/common';
import { ArrowRight, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { useConsentStore } from '../consent';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [agreeNewsletter, setAgreeNewsletter] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currency, setCurrency] = useState('VND (₫)');
  const [errorMsg, setErrorMsg] = useState('');

  const openPreferences = useConsentStore((state) => state.openPreferences);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (!agreeNewsletter) {
      setErrorMsg('Quý khách vui lòng xác nhận đồng ý nhận thư tiếp thị.');
      return;
    }

    setErrorMsg('');
    setIsSubscribed(true);
  };

  return (
    <footer className="w-full bg-ivory-100 dark:bg-[#070709] border-t border-black/10 dark:border-white/10 text-noir-900 dark:text-white pt-20 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Top Newsletter & Brand Narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-black/10 dark:border-white/10">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#d4af37]">
              {vi.footer.newsletterBadge}
            </span>
            <h4 className="font-serif text-2xl sm:text-3xl text-noir-950 dark:text-white tracking-wide font-medium">
              {vi.footer.newsletterTitle}
            </h4>
            <p className="text-xs text-noir-600 dark:text-white/60 leading-relaxed font-sans max-w-md font-light">
              {vi.footer.newsletterDesc}
            </p>

            {isSubscribed ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs text-[#d4af37]">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>Trân trọng cảm ơn quý khách. Chúng tôi sẽ gửi thư mời chuyên khảo sớm nhất.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row max-w-md gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={vi.footer.newsletterPlaceholder}
                    className="flex-1 px-4 py-3 bg-white dark:bg-[#0f0f14] border border-black/15 dark:border-white/15 focus:border-[#d4af37] text-noir-950 dark:text-white placeholder:text-noir-400 dark:placeholder:text-white/30 text-xs tracking-wider outline-none rounded-xl transition-colors"
                    required
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#d4af37] hover:bg-[#e5c158] text-noir-950 text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 rounded-xl shrink-0"
                  >
                    <span>{vi.footer.newsletterCta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Consent Checkbox for Marketing Subscription */}
                <div className="space-y-1">
                  <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-noir-600 dark:text-white/60 leading-relaxed">
                    <input
                      type="checkbox"
                      checked={agreeNewsletter}
                      onChange={(e) => {
                        setAgreeNewsletter(e.target.checked);
                        if (e.target.checked) setErrorMsg('');
                      }}
                      className="w-3.5 h-3.5 rounded mt-0.5 accent-[#d4af37] cursor-pointer"
                    />
                    <span>
                      Tôi đồng ý nhận nội dung tiếp thị và thư mời sự kiện qua email. Quý khách có thể hủy nhận tin bất cứ lúc nào.
                    </span>
                  </label>
                  {errorMsg && <p className="text-[11px] text-rose-500 dark:text-rose-400">{errorMsg}</p>}
                </div>
              </form>
            )}
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-black/10 dark:border-white/10 lg:pl-12 pt-8 lg:pt-0">
            <div>
              <span className="font-serif text-3xl sm:text-4xl text-noir-950 dark:text-white tracking-widest block font-medium">
                {vi.brand.name}
              </span>
              <p className="font-serif italic text-base text-[#d4af37] dark:text-[#d4af37]/90 mt-2">
                {vi.brand.tagline}
              </p>
              <p className="text-xs text-noir-600 dark:text-white/60 mt-4 leading-relaxed font-light">
                {vi.footer.brandDesc}
              </p>
            </div>

            <div className="flex items-center gap-6 mt-8 text-xs font-sans tracking-widest uppercase text-noir-500 dark:text-white/50">
              <span>Paris</span>
              <span className="w-1 h-1 rounded-full bg-[#d4af37]" />
              <span>Milan</span>
              <span className="w-1 h-1 rounded-full bg-[#d4af37]" />
              <span>Tokyo</span>
              <span className="w-1 h-1 rounded-full bg-[#d4af37]" />
              <span>TP. Hồ Chí Minh</span>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-14 border-b border-black/10 dark:border-white/10 text-xs font-sans">
          {/* Column 1: Collections */}
          <div className="space-y-4">
            <h5 className="font-semibold text-champagne-dark dark:text-[#d4af37] uppercase tracking-widest text-[11px]">
              {vi.footer.collectionsCol}
            </h5>
            <ul className="space-y-2.5 text-noir-600 dark:text-white/60">
              <li>
                <Link to="/collections/noir-absolu" className="hover:text-black dark:hover:text-white transition-colors">
                  Noir Absolu (FW26)
                </Link>
              </li>
              <li>
                <Link to="/collections/l-ombre-claire" className="hover:text-black dark:hover:text-white transition-colors">
                  L'Ombre Claire (SS26)
                </Link>
              </li>
              <li>
                <Link to="/collections/geometrie-pure" className="hover:text-black dark:hover:text-white transition-colors">
                  Géométrie Pure (Couture)
                </Link>
              </li>
              <li>
                <Link to="/lookbooks" className="hover:text-black dark:hover:text-white transition-colors">
                  Ấn phẩm Lookbooks mùa mới
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-black dark:hover:text-white transition-colors">
                  Toàn bộ danh mục sản phẩm
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Legal & Privacy */}
          <div className="space-y-4">
            <h5 className="font-semibold text-champagne-dark dark:text-[#d4af37] uppercase tracking-widest text-[11px]">
              Pháp Lý & Quyền Riêng Tư
            </h5>
            <ul className="space-y-2.5 text-noir-600 dark:text-white/60">
              <li>
                <Link to="/privacy-policy" className="hover:text-black dark:hover:text-white transition-colors">
                  Chính sách bảo mật (Luật 91/2025)
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-black dark:hover:text-white transition-colors">
                  Điều khoản sử dụng dịch vụ
                </Link>
              </li>
              <li>
                <Link to="/cookie-policy" className="hover:text-black dark:hover:text-white transition-colors">
                  Chính sách Cookie riêng biệt
                </Link>
              </li>
              <li>
                <Link to="/returns-refunds" className="hover:text-black dark:hover:text-white transition-colors">
                  Chính sách đổi trả & hoàn tiền
                </Link>
              </li>
              <li>
                <Link to="/data-privacy" className="hover:text-black dark:hover:text-white transition-colors">
                  Trung tâm quyền riêng tư
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openPreferences}
                  className="text-champagne-dark dark:text-[#d4af37] hover:underline flex items-center gap-1.5 pt-1 font-medium"
                >
                  <SlidersHorizontal className="w-3 h-3" /> Cài đặt Cookie
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Client Service */}
          <div className="space-y-4">
            <h5 className="font-semibold text-champagne-dark dark:text-[#d4af37] uppercase tracking-widest text-[11px]">
              {vi.footer.conciergeCol}
            </h5>
            <ul className="space-y-2.5 text-noir-600 dark:text-white/60">
              <li>
                <Link to="/support#faq" className="hover:text-black dark:hover:text-white transition-colors">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link to="/support#shipping" className="hover:text-black dark:hover:text-white transition-colors">
                  Vận chuyển găng tay trắng
                </Link>
              </li>
              <li>
                <Link to="/returns-refunds" className="hover:text-black dark:hover:text-white transition-colors">
                  Đổi trả trong 07 ngày
                </Link>
              </li>
              <li>
                <Link to="/order-lookup" className="hover:text-black dark:hover:text-white transition-colors">
                  Tra cứu đơn hàng vãng lai
                </Link>
              </li>
              <li>
                <Link to="/vouchers" className="hover:text-black dark:hover:text-white transition-colors">
                  Kho ưu đãi & Mã đặc quyền
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-black dark:hover:text-white transition-colors">
                  Liên hệ Concierge riêng
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: The Maison */}
          <div className="space-y-4">
            <h5 className="font-semibold text-champagne-dark dark:text-[#d4af37] uppercase tracking-widest text-[11px]">
              {vi.footer.maisonCol}
            </h5>
            <ul className="space-y-2.5 text-noir-600 dark:text-white/60">
              <li>
                <Link to="/about" className="hover:text-black dark:hover:text-white transition-colors">
                  Tôn chỉ sáng tạo & Lịch sử
                </Link>
              </li>
              <li>
                <Link to="/journal" className="hover:text-black dark:hover:text-white transition-colors">
                  Tạp chí chuyên đề & Khảo luận
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-black dark:hover:text-white transition-colors">
                  Không gian Quý khách (Patron Portal)
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-black dark:hover:text-white transition-colors text-noir-400 dark:text-white/40">
                  Cổng quản trị Atelier (Admin)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Currency, Disclaimer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-sans text-noir-500 dark:text-white/40">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <span>© 2026 Atelier Vérité. Mọi quyền được bảo lưu.</span>
            <span className="hidden sm:inline-block">•</span>
            <span>Tuân thủ Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & Luật BVQLNTD 19/2023/QH15</span>
          </div>

          {/* Regional Currency Selector */}
          <div className="flex items-center gap-3">
            <span className="uppercase text-[10px] tracking-wider text-noir-600 dark:text-white/50">Tiền tệ:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-white dark:bg-[#14141a] border border-black/10 dark:border-white/10 text-noir-900 dark:text-white/80 text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:border-[#d4af37]"
              aria-label="Lựa chọn tiền tệ hiển thị"
            >
              <option value="VND (₫)">VND (₫) — Việt Nam Đồng</option>
              <option value="USD ($)">USD ($) — Đô la Mỹ</option>
              <option value="EUR (€)">EUR (€) — Euro</option>
              <option value="JPY (¥)">JPY (¥) — Yên Nhật</option>
            </select>
          </div>
        </div>
      </div>
    </footer>
  );
};

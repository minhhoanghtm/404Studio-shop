import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToastStore } from '../stores/useToastStore';
import { vi } from '../locales/vi/common';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [currency, setCurrency] = useState('VND (₫)');
  const { addToast } = useToastStore();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      addToast({
        type: 'error',
        title: 'Email không hợp lệ',
        message: 'Vui lòng cung cấp địa chỉ email chính xác để nhận thư mời riêng.',
      });
      return;
    }

    setIsSubscribed(true);
    addToast({
      type: 'success',
      title: 'Đã cấp đặc quyền Patron',
      message: 'Quý khách đã được ghi danh vào danh bạ khách mời danh dự của Atelier Vérité.',
    });
  };

  return (
    <footer className="w-full bg-noir-950 text-white/80 border-t border-white/10 pt-20 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Newsletter & Brand Ethos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          <div className="lg:col-span-6 space-y-4">
            <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block">
              {vi.footer.newsletterBadge}
            </span>
            <h3 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
              {vi.footer.newsletterTitle}
            </h3>
            <p className="text-sm font-sans text-platinum-dark max-w-lg leading-relaxed font-light">
              {vi.footer.newsletterDesc}
            </p>

            {isSubscribed ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-champagne/10 border border-champagne/30 text-champagne text-xs uppercase tracking-widest font-medium">
                <CheckCircle2 className="w-4 h-4 text-champagne" />
                <span>{vi.footer.newsletterSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md pt-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={vi.footer.newsletterPlaceholder}
                  className="flex-1 px-4 py-3.5 bg-noir-900 border border-white/15 focus:border-champagne text-white placeholder-white/30 text-xs tracking-wider outline-none rounded-none transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-champagne hover:bg-champagne-hover text-noir-950 text-xs font-semibold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                >
                  <span>{vi.footer.newsletterCta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
            <p className="text-[10px] text-white/40 tracking-wider">
              Khi đăng ký, quý khách đồng ý tiếp nhận các bản tin nghiên cứu định kỳ. Có thể hủy đăng ký bất cứ lúc nào.
            </p>
          </div>

          <div className="lg:col-span-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-white/10 lg:pl-12 pt-8 lg:pt-0">
            <div>
              <span className="font-display text-4xl sm:text-5xl text-white tracking-widest block font-medium">
                {vi.brand.name}
              </span>
              <p className="font-serif italic text-base text-champagne-light/90 mt-2">
                {vi.brand.tagline}
              </p>
              <p className="text-xs text-platinum-dark mt-4 leading-relaxed font-light">
                {vi.footer.brandDesc}
              </p>
            </div>

            <div className="flex items-center gap-6 mt-8 text-xs font-sans tracking-widest uppercase text-white/50">
              <span>Paris</span>
              <span className="w-1 h-1 rounded-full bg-champagne" />
              <span>Milan</span>
              <span className="w-1 h-1 rounded-full bg-champagne" />
              <span>Tokyo</span>
              <span className="w-1 h-1 rounded-full bg-champagne" />
              <span>New York</span>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-16 border-b border-white/10 text-xs font-sans">
          {/* Column 1: Collections */}
          <div className="space-y-4">
            <h5 className="font-semibold text-champagne uppercase tracking-widest text-[11px]">
              {vi.footer.collectionsCol}
            </h5>
            <ul className="space-y-2.5 text-white/60">
              <li>
                <Link to="/collections/noir-absolu" className="hover:text-white transition-colors">
                  Noir Absolu (FW26)
                </Link>
              </li>
              <li>
                <Link to="/collections/l-ombre-claire" className="hover:text-white transition-colors">
                  L'Ombre Claire (SS26)
                </Link>
              </li>
              <li>
                <Link to="/collections/geometrie-pure" className="hover:text-white transition-colors">
                  Géométrie Pure (Couture)
                </Link>
              </li>
              <li>
                <Link to="/collections/silence-organique" className="hover:text-white transition-colors">
                  Silence Organique
                </Link>
              </li>
              <li>
                <Link to="/collections/chroma-arch" className="hover:text-white transition-colors">
                  Chroma Architecture
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Ready-To-Wear */}
          <div className="space-y-4">
            <h5 className="font-semibold text-champagne uppercase tracking-widest text-[11px]">
              {vi.footer.readyToWearCol}
            </h5>
            <ul className="space-y-2.5 text-white/60">
              <li>
                <Link to="/products?category=women" className="hover:text-white transition-colors">
                  Thời trang Nữ
                </Link>
              </li>
              <li>
                <Link to="/products?category=men" className="hover:text-white transition-colors">
                  Thời trang Nam
                </Link>
              </li>
              <li>
                <Link to="/products?category=outerwear" className="hover:text-white transition-colors">
                  Áo khoác Tailoring & Trench
                </Link>
              </li>
              <li>
                <Link to="/products?category=silk" className="hover:text-white transition-colors">
                  Đầm dạ hội & Lụa tơ tằm
                </Link>
              </li>
              <li>
                <Link to="/products?category=accessories" className="hover:text-white transition-colors">
                  Túi xách & Đồ da thủ công
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Concierge */}
          <div className="space-y-4">
            <h5 className="font-semibold text-champagne uppercase tracking-widest text-[11px]">
              {vi.footer.conciergeCol}
            </h5>
            <ul className="space-y-2.5 text-white/60">
              <li>
                <Link to="/support#faq" className="hover:text-white transition-colors">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link to="/support#shipping" className="hover:text-white transition-colors">
                  Vận chuyển găng tay trắng
                </Link>
              </li>
              <li>
                <Link to="/support#returns" className="hover:text-white transition-colors">
                  Chính sách đổi trả 30 ngày
                </Link>
              </li>
              <li>
                <Link to="/support#size-guide" className="hover:text-white transition-colors">
                  Bảng đo kích cỡ Haute Couture
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Liên hệ Concierge riêng
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: The Maison */}
          <div className="space-y-4">
            <h5 className="font-semibold text-champagne uppercase tracking-widest text-[11px]">
              {vi.footer.maisonCol}
            </h5>
            <ul className="space-y-2.5 text-white/60">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Tôn chỉ sáng tạo & Lịch sử
                </Link>
              </li>
              <li>
                <Link to="/journal" className="hover:text-white transition-colors">
                  Tạp chí chuyên đề & Khảo luận
                </Link>
              </li>
              <li>
                <Link to="/account" className="hover:text-white transition-colors">
                  Không gian Quý khách (Patron Portal)
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  Tra cứu đơn hàng
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Currency, Disclaimer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-sans text-white/40">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <span>{vi.footer.copyright}</span>
            <span className="hidden sm:inline-block">•</span>
            <span>{vi.footer.disclaimer}</span>
          </div>

          {/* Regional Currency Selector */}
          <div className="flex items-center gap-3">
            <span className="uppercase text-[10px] tracking-wider text-white/50">Tiền tệ:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-noir-900 border border-white/10 text-white/80 text-xs px-2.5 py-1 rounded focus:outline-none focus:border-champagne"
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

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import { useConsentStore } from '../consent';

export const Footer: React.FC = () => {
  const [currency, setCurrency] = useState('VND (₫)');
  const openPreferences = useConsentStore((state) => state.openPreferences);

  return (
    <footer className="w-full bg-[var(--bg-alt)] border-t border-[var(--border)] text-[var(--text)] pt-14 pb-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* =========================================
            HÀNG 1: LOGO + GIỚI THIỆU + ĐỊA ĐIỂM
            ========================================= */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pb-12 border-b border-[var(--border)]">
          <div className="space-y-3 max-w-xl">
            <Link
              to="/"
              className="inline-block font-serif text-2xl sm:text-3xl tracking-[0.14em] text-[var(--text)] hover:text-[var(--accent)] transition-colors font-medium"
              aria-label="Trang chủ Atelier Vérité"
            >
              ATELIER VÉRITÉ
            </Link>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-light">
              Nhà mốt may đo kiến trúc và phục trang đương đại. Từng phom dáng được định hình để chuyển động tự nhiên cùng cơ thể trong đời sống thực.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-[var(--accent)] font-medium">
            <span>PARIS</span>
            <span className="opacity-40">•</span>
            <span>MILAN</span>
            <span className="opacity-40">•</span>
            <span>TOKYO</span>
            <span className="opacity-40">•</span>
            <span>TP.HCM</span>
          </div>
        </div>

        {/* =========================================
            HÀNG 2: 4 CỘT LINK (TIÊU ĐỀ MONO NHỎ)
            ========================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 py-12 border-b border-[var(--border)] text-xs">
          {/* Cột 1: BỘ SƯU TẬP */}
          <div className="space-y-3.5">
            <h4 className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">
              BỘ SƯU TẬP
            </h4>
            <ul className="space-y-2 text-[var(--text-muted)] font-light">
              <li>
                <Link to="/collections/noir-absolu" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Noir Absolu (FW26)
                </Link>
              </li>
              <li>
                <Link to="/collections/l-ombre-claire" className="hover:text-[var(--text)] hover:underline transition-colors">
                  L'Ombre Claire (SS26)
                </Link>
              </li>
              <li>
                <Link to="/collections/geometrie-pure" className="hover:text-[var(--text)] hover:underline transition-colors">
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
          <div className="space-y-3.5">
            <h4 className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">
              PHÁP LÝ & QUYỀN RIÊNG TƯ
            </h4>
            <ul className="space-y-2 text-[var(--text-muted)] font-light">
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
                <Link to="/data-privacy" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Trung tâm quyền riêng tư
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={openPreferences}
                  className="text-[var(--accent)] hover:underline flex items-center gap-1.5 pt-0.5 font-mono text-[10px] uppercase tracking-wider"
                >
                  <SlidersHorizontal className="w-3 h-3" /> Cài đặt Cookie
                </button>
              </li>
            </ul>
          </div>

          {/* Cột 3: DỊCH VỤ KHÁCH HÀNG */}
          <div className="space-y-3.5">
            <h4 className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">
              DỊCH VỤ KHÁCH HÀNG
            </h4>
            <ul className="space-y-2 text-[var(--text-muted)] font-light">
              <li>
                <Link to="/support#faq" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Câu hỏi thường gặp
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
              <li>
                <Link to="/contact" className="hover:text-[var(--text)] hover:underline transition-colors">
                  Liên hệ Concierge riêng
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: ATELIER */}
          <div className="space-y-3.5">
            <h4 className="font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--accent)] font-semibold">
              ATELIER
            </h4>
            <ul className="space-y-2 text-[var(--text-muted)] font-light">
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
                <Link to="/admin" className="hover:text-[var(--text)] hover:underline transition-colors text-[var(--text-muted)] opacity-70">
                  Cổng quản trị Atelier (Admin)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* =========================================
            HÀNG CUỐI: COPYRIGHT + CHỌN TIỀN TỆ + DÒNG MONO
            ========================================= */}
        <div className="pt-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[var(--text-muted)] font-mono">
            {/* Copyright */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <span>© 2026 ATELIER VÉRITÉ. MỌI QUYỀN ĐƯỢC BẢO LƯU.</span>
              <span className="hidden md:inline">•</span>
              <span className="text-[10px] text-[var(--text-muted)] opacity-75">
                TUÂN THỦ LUẬT 91/2025/QH15 &amp; NĐ 13/2023/NĐ-CP
              </span>
            </div>

            {/* Chọn Tiền Tệ */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Tiền tệ:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-[11px] font-mono px-2.5 py-1.5 rounded-none focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                aria-label="Lựa chọn tiền tệ hiển thị"
              >
                <option value="VND (₫)">VND (₫) — Việt Nam Đồng</option>
                <option value="USD ($)">USD ($) — USD Dollar</option>
                <option value="EUR (€)">EUR (€) — Euro</option>
                <option value="JPY (¥)">JPY (¥) — Japanese Yen</option>
              </select>
            </div>
          </div>

          {/* Dòng Mono Mờ Hài Hước */}
          <div className="text-center pt-2">
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--text-muted)] opacity-50 select-none">
              [ THIẾT KẾ VÌ ĐỜI SỐNG THỰC · MAY ĐO CÓ CHỦ ĐÍCH · KHÔNG CÓ SỢI POLYESTER NÀO BỊ HẠI TRONG QUÁ TRÌNH NÀY ]
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;

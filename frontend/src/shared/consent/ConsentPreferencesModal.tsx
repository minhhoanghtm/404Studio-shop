import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Check, Shield, Info, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConsentStore } from './useConsentStore';
import { ConsentCategories } from './types';
import { useModal, ModalPortal } from '../context/ModalContext';
import { StatusToggle } from '../components/StatusToggle';

export const ConsentPreferencesModal: React.FC = () => {
  const { isPreferencesOpen, closePreferences, consentRecord, saveCustomPreferences, rejectOptional, acceptAll } = useConsentStore();

  const { overlayZIndex, contentZIndex } = useModal({
    id: 'cookie-preferences-modal',
    isOpen: isPreferencesOpen,
    onClose: closePreferences,
    priority: 160,
  });

  const [categories, setCategories] = useState<ConsentCategories>({
    necessary: true,
    analytics: false,
    personalization: false,
    marketing: false,
  });

  useEffect(() => {
    if (consentRecord) {
      setCategories(consentRecord.categories);
    } else {
      setCategories({
        necessary: true,
        analytics: false,
        personalization: false,
        marketing: false,
      });
    }
  }, [consentRecord, isPreferencesOpen]);

  if (!isPreferencesOpen) return null;

  const handleToggle = (key: keyof ConsentCategories) => {
    if (key === 'necessary') return; // Immutable
    setCategories((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    saveCustomPreferences(categories);
  };

  return (
    <ModalPortal>
      <AnimatePresence>
        <div
          className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-[rgba(26,26,23,0.45)] backdrop-blur-sm pointer-events-auto"
          style={{ zIndex: Math.max(overlayZIndex || 0, 160) }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closePreferences();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ zIndex: Math.max(contentZIndex || 0, 165) }}
            className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-32px)] text-[var(--text)]"
          >
            {/* Header */}
            <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--surface)] shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                  <Shield className="w-5 h-5" />
                </span>
                <div>
                  <h2 id="cookie-preferences-title" className="font-serif text-lg tracking-wide uppercase text-[var(--text)] font-medium">
                    Tùy Chỉnh Quyền Riêng Tư & Cookie
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">Tuân thủ Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePreferences}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors"
                aria-label="Đóng bảng tùy chọn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body: Category Toggles */}
            <div className="p-6 space-y-5 overflow-y-auto divide-y divide-[var(--border)] flex-1 min-h-0">
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-light">
              Quý khách có thể tự quyết định việc cho phép hay vô hiệu hóa từng nhóm công nghệ theo dõi. Các nhóm không thiết yếu được <strong>tắt mặc định</strong> và chỉ kích hoạt khi quý khách chủ động bật công tắc tương ứng.
            </p>

            {/* Category 1: Strictly Necessary */}
            <div className="pt-4 flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-[var(--text)] tracking-wide uppercase font-serif">
                    1. Cookie Thiết Yếu (Strictly Necessary)
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Lock className="w-2.5 h-2.5" /> Luôn Bắt Buộc
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Cần thiết cho vận hành cơ bản của website, giỏ hàng mua sắm, phiên đăng nhập bảo mật (JWT) và bảo vệ an ninh mạng. Nhóm này không thể tắt theo luật định.
                </p>
                <div className="text-[11px] text-[var(--text-muted)] font-mono">
                  Đơn vị: Atelier Vérité (First Party) • Lưu trữ: Session / 30 ngày
                </div>
              </div>
              <div className="pt-1">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="w-5 h-5 accent-[var(--accent)] opacity-60 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Category 2: Analytics & Performance */}
            <div className="pt-4 flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-[var(--text)] tracking-wide uppercase font-serif">
                    2. Cookie Phân Tích & Hiệu Năng (Analytics)
                  </h4>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--bg-alt)] text-[var(--text-muted)] border border-[var(--border)]">
                    Tùy chọn
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Đo lường số lượt truy cập ẩn danh, phân tích tốc độ phản hồi của shader ThreeUI WebGL và cải tiến trải nghiệm khách hàng. Không lưu dữ liệu định danh trực tiếp.
                </p>
                <div className="text-[11px] text-[var(--text-muted)] font-mono">
                  Đơn vị: Google LLC (GA4), Telemetry nội bộ • Lưu trữ: 14 tháng
                </div>
              </div>
              <div className="pt-1">
                <StatusToggle
                  checked={categories.analytics}
                  onChange={() => handleToggle('analytics')}
                  ariaLabel="Cookie Phân Tích & Hiệu Năng"
                />
              </div>
            </div>

            {/* Category 3: Personalization */}
            <div className="pt-4 flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-[var(--text)] tracking-wide uppercase font-serif">
                    3. Cookie Cá Nhân Hóa (Personalization)
                  </h4>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--bg-alt)] text-[var(--text-muted)] border border-[var(--border)]">
                    Tùy chọn
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Lưu nhớ tùy chọn giao diện hiển thị, bảng số đo may đo cá nhân hóa và các gợi ý thời trang phù hợp từ trợ lý AI Stylist.
                </p>
                <div className="text-[11px] text-[var(--text-muted)] font-mono">
                  Đơn vị: Atelier Vérité, OpenRouter AI Inference • Lưu trữ: 90 ngày
                </div>
              </div>
              <div className="pt-1">
                <StatusToggle
                  checked={categories.personalization}
                  onChange={() => handleToggle('personalization')}
                  ariaLabel="Cookie Cá Nhân Hóa"
                />
              </div>
            </div>

            {/* Category 4: Marketing & Advertising */}
            <div className="pt-4 flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-[var(--text)] tracking-wide uppercase font-serif">
                    4. Cookie Tiếp Thị & Quảng Cáo (Marketing)
                  </h4>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[var(--bg-alt)] text-[var(--text-muted)] border border-[var(--border)]">
                    Tùy chọn
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Đo lường hiệu quả quảng bá các ấn phẩm Runway Haute Couture trên Meta (Instagram/Facebook) và TikTok. Chỉ chia sẻ mã sự kiện kỹ thuật khi quý khách đồng thuận.
                </p>
                <div className="text-[11px] text-[var(--text-muted)] font-mono">
                  Đơn vị: Meta Platforms, TikTok Inc. • Lưu trữ: 90 ngày - 13 tháng
                </div>
              </div>
              <div className="pt-1">
                <StatusToggle
                  checked={categories.marketing}
                  onChange={() => handleToggle('marketing')}
                  ariaLabel="Cookie Tiếp Thị & Quảng Cáo"
                />
              </div>
            </div>

            {/* Read more footer note */}
            <div className="pt-4 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1">
                <Info className="w-3.5 h-3.5" /> Quý khách có thể rút lại đồng thuận bất kỳ lúc nào.
              </span>
              <Link
                to="/cookie-policy"
                onClick={closePreferences}
                className="text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                Xem chi tiết danh mục Cookie <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={rejectOptional}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] hover:bg-[var(--bg-alt)] transition-all text-xs tracking-wider uppercase font-medium flex items-center justify-center gap-1.5"
            >
              Từ chối tất cả tùy chọn
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2.5 rounded-xl border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 transition-all text-xs tracking-wider uppercase font-medium flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Lưu tùy chọn của tôi
              </button>
              <button
                type="button"
                onClick={acceptAll}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] hover:bg-[#9E7B15] transition-all text-xs tracking-wider uppercase font-semibold flex items-center justify-center gap-1.5 shadow-md"
              >
                Đồng ý tất cả
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
    </ModalPortal>
  );
};

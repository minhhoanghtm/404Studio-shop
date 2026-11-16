import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, SlidersHorizontal, Check, X, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConsentStore } from './useConsentStore';

export const ConsentBanner: React.FC = () => {
  const { isBannerOpen, acceptAll, rejectOptional, openPreferences } = useConsentStore();

  if (!isBannerOpen) return null;

  return (
    <AnimatePresence>
      <motion.aside
        aria-label="Thông báo và quản lý quyền riêng tư cookie"
        role="region"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pointer-events-none"
      >
        <div className="max-w-5xl mx-auto bg-[#0e0e12]/95 backdrop-blur-md border border-[#2a2a32] shadow-2xl rounded-2xl p-6 sm:p-8 pointer-events-auto text-[#f2f2f4]">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            
            {/* Left Column: Descriptive Text & Legal Notice */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <h3 className="font-serif text-lg tracking-wide uppercase text-white font-medium">
                  Bảo Vệ Quyền Riêng Tư & Kiểm Soát Cookie
                </h3>
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-white/70 font-mono">
                  Luật 91/2025/QH15
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light">
                Atelier Vérité áp dụng nguyên tắc <strong>Chặn trước (Prior Consent)</strong>: toàn bộ cookie phân tích và quảng cáo không thiết yếu đều <strong>bị vô hiệu hóa mặc định</strong>. Chúng tôi chỉ kích hoạt khi quý khách cho phép rõ ràng. Quý khách có thể thay đổi hoặc rút lại lựa chọn bất kỳ lúc nào.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <Link
                  to="/cookie-policy"
                  className="inline-flex items-center gap-1 text-[#d4af37] hover:underline underline-offset-4"
                >
                  Chính sách Cookie <ArrowUpRight className="w-3 h-3" />
                </Link>
                <span className="text-white/20">•</span>
                <Link
                  to="/privacy-policy"
                  className="inline-flex items-center gap-1 text-white/60 hover:text-white hover:underline underline-offset-4"
                >
                  Chính sách Bảo mật <ArrowUpRight className="w-3 h-3" />
                </Link>
                <span className="text-white/20">•</span>
                <Link
                  to="/data-privacy"
                  className="inline-flex items-center gap-1 text-white/60 hover:text-white hover:underline underline-offset-4"
                >
                  Trung tâm Quyền riêng tư <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Right Column: Equal-weight Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
              <button
                type="button"
                onClick={openPreferences}
                className="px-4 py-2.5 rounded-xl border border-white/20 text-white/80 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all text-xs tracking-wider uppercase font-medium flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Tùy chỉnh
              </button>

              <button
                type="button"
                onClick={rejectOptional}
                className="px-5 py-2.5 rounded-xl border border-white/30 text-white hover:bg-white/10 transition-all text-xs tracking-wider uppercase font-medium flex items-center justify-center gap-2"
              >
                <X className="w-3.5 h-3.5" />
                Từ chối tùy chọn
              </button>

              <button
                type="button"
                onClick={acceptAll}
                className="px-6 py-2.5 rounded-xl bg-[#d4af37] text-black hover:bg-[#e5c158] transition-all text-xs tracking-wider uppercase font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#d4af37]/20"
              >
                <Check className="w-4 h-4" />
                Chấp nhận tất cả
              </button>
            </div>

          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

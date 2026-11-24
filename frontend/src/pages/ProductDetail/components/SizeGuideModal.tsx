import React from 'react';
import { X, Ruler, Sparkles, Check } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string;
}

const SIZE_TABLE = [
  { size: 'XS (34)', bust: '80 - 84', waist: '60 - 64', hips: '86 - 90', height: '155 - 162' },
  { size: 'S (36)', bust: '84 - 88', waist: '64 - 68', hips: '90 - 94', height: '158 - 165' },
  { size: 'M (38)', bust: '88 - 92', waist: '68 - 72', hips: '94 - 98', height: '162 - 170' },
  { size: 'L (40)', bust: '92 - 96', waist: '72 - 76', hips: '98 - 102', height: '165 - 175' },
  { size: 'XL (42)', bust: '96 - 100', waist: '76 - 80', hips: '102 - 106', height: '168 - 178' },
];

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[var(--bg-page)] border border-[var(--border)] p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-[var(--accent)] font-mono font-medium">
              <Ruler className="w-3.5 h-3.5" />
              <span>ATELIER VÉRITÉ · BẢNG QUY CHUẨN THÔNG SỐ</span>
            </div>
            <h3 className="font-serif text-2xl text-[var(--text-primary)]">
              Hướng Dẫn Đo &amp; Chọn Size May Đo
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Đóng bảng size"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Measurement Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--bg-card)] border-b border-[var(--border)] text-[var(--text-muted)] uppercase tracking-wider font-mono">
              <tr>
                <th className="py-3 px-3">Kích Cỡ</th>
                <th className="py-3 px-3">Vòng Ngực (cm)</th>
                <th className="py-3 px-3">Vòng Eo (cm)</th>
                <th className="py-3 px-3">Vòng Mông (cm)</th>
                <th className="py-3 px-3">Chiều Cao (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-sans">
              {SIZE_TABLE.map((row) => (
                <tr key={row.size} className="hover:bg-[var(--bg-card)]/50 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-[var(--text-primary)]">
                    {row.size}
                  </td>
                  <td className="py-3 px-3 text-[var(--text-secondary)]">{row.bust}</td>
                  <td className="py-3 px-3 text-[var(--text-secondary)]">{row.waist}</td>
                  <td className="py-3 px-3 text-[var(--text-secondary)]">{row.hips}</td>
                  <td className="py-3 px-3 text-[var(--text-secondary)]">{row.height}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tailoring Advice */}
        <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] space-y-2 text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Đặc Quyền May Đo Riêng Theo Số Đo Cơ Thể</span>
          </div>
          <p className="font-light leading-relaxed">
            Nếu số đo của quý khách nằm giữa hai cỡ, chúng tôi khuyến nghị chọn cỡ lớn hơn để thuận tiện
            cho thợ may điều chỉnh tại gia, hoặc đặt lịch hẹn cùng nghệ nhân Atelier để may đo độc bản.
          </p>
        </div>

        {/* Close CTA */}
        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-page)] text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
          >
            Đã Hiểu Thông Số
          </button>
        </div>
      </div>
    </div>
  );
};

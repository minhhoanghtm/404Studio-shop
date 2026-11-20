import React, { useState } from 'react';
import { SIZE_CHART } from '../../../shared/data/storeInfo';
import { Ruler } from 'lucide-react';

export const SizeGuideSection: React.FC = () => {
  const [activeGender, setActiveGender] = useState<'women' | 'men'>('women');

  return (
    <div id="size-guide" className="space-y-8 scroll-mt-28">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[var(--accent)] text-xs font-mono uppercase tracking-widest">
          <Ruler className="w-4 h-4" />
          <span>Quy chuẩn may đo</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl text-[var(--text)]">
          Bảng Hướng Dẫn Đo Kích Cỡ
        </h2>
        <p className="text-xs text-[var(--text-muted)] font-sans max-w-xl">
          Quy đổi chi tiết giữa kích cỡ Pháp (FR) / Ý (IT) và số đo nhân trắc học theo cm.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-[var(--border)] pb-4">
        <button
          onClick={() => setActiveGender('women')}
          className={`px-5 py-2 rounded-full text-xs font-sans uppercase tracking-wider transition-colors ${
            activeGender === 'women'
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold'
              : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]'
          }`}
        >
          Thời trang Nữ (FR)
        </button>
        <button
          onClick={() => setActiveGender('men')}
          className={`px-5 py-2 rounded-full text-xs font-sans uppercase tracking-wider transition-colors ${
            activeGender === 'men'
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] font-bold'
              : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)]'
          }`}
        >
          Thời trang Nam (IT)
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        {activeGender === 'women' ? (
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[var(--bg-alt)] text-[var(--accent)] font-mono uppercase tracking-wider border-b border-[var(--border)]">
              <tr>
                <th className="p-4">Kích cỡ Pháp (FR)</th>
                <th className="p-4">Tương đương Mỹ (US)</th>
                <th className="p-4">Vòng ngực (cm)</th>
                <th className="p-4">Vòng eo (cm)</th>
                <th className="p-4">Vòng mông (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text)] font-mono">
              {SIZE_CHART.women.map((row) => (
                <tr key={row.fr} className="hover:bg-[var(--bg-alt)] transition-colors">
                  <td className="p-4 font-bold text-[var(--text)]">{row.fr}</td>
                  <td className="p-4 text-[var(--text-muted)]">{row.us}</td>
                  <td className="p-4">{row.bust}</td>
                  <td className="p-4">{row.waist}</td>
                  <td className="p-4">{row.hips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[var(--bg-alt)] text-[var(--accent)] font-mono uppercase tracking-wider border-b border-[var(--border)]">
              <tr>
                <th className="p-4">Kích cỡ Ý (IT)</th>
                <th className="p-4">Tương đương Mỹ (US)</th>
                <th className="p-4">Vòng ngực (cm)</th>
                <th className="p-4">Vòng eo (cm)</th>
                <th className="p-4">Vòng cổ (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-[var(--text)] font-mono">
              {SIZE_CHART.men.map((row) => (
                <tr key={row.it} className="hover:bg-[var(--bg-alt)] transition-colors">
                  <td className="p-4 font-bold text-[var(--text)]">{row.it}</td>
                  <td className="p-4 text-[var(--text-muted)]">{row.us}</td>
                  <td className="p-4">{row.chest}</td>
                  <td className="p-4">{row.waist}</td>
                  <td className="p-4">{row.collar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[11px] text-[var(--text-muted)] font-sans italic">
        * Để có độ vừa vặn hoàn hảo, quý khách có thể liên hệ Concierge để đặt lịch lấy số đo may riêng (Sur Mesure).
      </p>
    </div>
  );
};

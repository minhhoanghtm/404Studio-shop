import React, { useState } from 'react';
import { SIZE_CHART } from '../../../shared/data/storeInfo';
import { Ruler } from 'lucide-react';

export const SizeGuideSection: React.FC = () => {
  const [activeGender, setActiveGender] = useState<'women' | 'men'>('women');

  return (
    <div id="size-guide" className="space-y-8 scroll-mt-28">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-champagne text-xs font-mono uppercase tracking-widest">
          <Ruler className="w-4 h-4" />
          <span>Quy chuẩn may đo</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl text-white">
          Bảng Hướng Dẫn Đo Kích Cỡ
        </h2>
        <p className="text-xs text-platinum-dark font-sans max-w-xl">
          Quy đổi chi tiết giữa kích cỡ Pháp (FR) / Ý (IT) và số đo nhân trắc học theo cm.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveGender('women')}
          className={`px-5 py-2 rounded-full text-xs font-sans uppercase tracking-wider transition-colors ${
            activeGender === 'women'
              ? 'bg-champagne text-noir-950 font-bold'
              : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Thời trang Nữ (FR)
        </button>
        <button
          onClick={() => setActiveGender('men')}
          className={`px-5 py-2 rounded-full text-xs font-sans uppercase tracking-wider transition-colors ${
            activeGender === 'men'
              ? 'bg-champagne text-noir-950 font-bold'
              : 'bg-white/5 text-white/70 hover:text-white hover:bg-white/10'
          }`}
        >
          Thời trang Nam (IT)
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-noir-900">
        {activeGender === 'women' ? (
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-white/5 text-champagne font-mono uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">Kích cỡ Pháp (FR)</th>
                <th className="p-4">Tương đương Mỹ (US)</th>
                <th className="p-4">Vòng ngực (cm)</th>
                <th className="p-4">Vòng eo (cm)</th>
                <th className="p-4">Vòng mông (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-platinum-light font-mono">
              {SIZE_CHART.women.map((row) => (
                <tr key={row.fr} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">{row.fr}</td>
                  <td className="p-4 text-white/70">{row.us}</td>
                  <td className="p-4">{row.bust}</td>
                  <td className="p-4">{row.waist}</td>
                  <td className="p-4">{row.hips}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-white/5 text-champagne font-mono uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="p-4">Kích cỡ Ý (IT)</th>
                <th className="p-4">Tương đương Mỹ (US)</th>
                <th className="p-4">Vòng ngực (cm)</th>
                <th className="p-4">Vòng eo (cm)</th>
                <th className="p-4">Vòng cổ (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-platinum-light font-mono">
              {SIZE_CHART.men.map((row) => (
                <tr key={row.it} className="hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-white">{row.it}</td>
                  <td className="p-4 text-white/70">{row.us}</td>
                  <td className="p-4">{row.chest}</td>
                  <td className="p-4">{row.waist}</td>
                  <td className="p-4">{row.collar}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-[11px] text-white/40 font-sans italic">
        * Để có độ vừa vặn hoàn hảo, quý khách có thể liên hệ Concierge để đặt lịch lấy số đo may riêng (Sur Mesure).
      </p>
    </div>
  );
};

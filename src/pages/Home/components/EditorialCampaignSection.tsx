import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye } from 'lucide-react';

export const EditorialCampaignSection: React.FC = () => {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-noir-900 border-b border-white/10 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=80"
          alt=""
          className="w-full h-full object-cover filter grayscale contrast-125"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-noir-950 via-noir-950/80 to-noir-950 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <span className="text-xs uppercase tracking-widest text-champagne font-semibold flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" /> Chiến dịch hình ảnh toàn cầu
          </span>
          <h2 className="font-display text-4xl sm:text-6xl text-white tracking-wide leading-tight">
            Ánh sáng, Bóng tối & Cấu trúc Tinh giản
          </h2>
          <p className="font-sans text-sm sm:text-base text-platinum-dark leading-relaxed font-light max-w-xl">
            Được ghi hình tại tu viện dòng Xitô Le Thoronet nước Pháp, chiến dịch Thu/Đông 2026 nghiên cứu mối tương quan giữa đá khối thô mộc và nếp rủ lụa tơ tằm bay bổng trong không gian tĩnh mịch.
          </p>
          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              to="/journal/art-of-bias-cut"
              className="px-6 py-3.5 bg-champagne hover:bg-champagne-hover text-noir-950 text-xs font-semibold uppercase tracking-widest transition-colors flex items-center gap-2"
            >
              <span>Đọc khảo luận chuyên đề</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/products"
              className="px-6 py-3.5 bg-transparent hover:bg-white/5 border border-white/20 text-white text-xs font-semibold uppercase tracking-widest transition-colors"
            >
              <span>Mua sắm các thiết kế</span>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
            <img
              src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85"
              alt="Chiến dịch Thu Đông"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
              <span className="text-[10px] uppercase font-mono tracking-widest text-champagne">
                Le Thoronet, Pháp • Ảnh chụp bởi H. De La Tour
              </span>
              <h4 className="font-display text-lg text-white mt-1">
                Ấn bản lưu trữ số 07
              </h4>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

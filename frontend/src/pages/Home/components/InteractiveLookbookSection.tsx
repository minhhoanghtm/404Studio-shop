import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MoveRight } from 'lucide-react';
import { ThreeClothStudy } from '../../../shared/threeui/ThreeClothStudy';

export const InteractiveLookbookSection: React.FC = () => {
  const [activeLookbookIndex, setActiveLookbookIndex] = useState(0);

  const lookbookItems = [
    {
      title: 'Dáng Áo Khoác Len Khối Monolithic',
      caption: 'Look 01 • Len virgin wool hai mặt với đường cầu vai điêu khắc sắc nét',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85',
      productSlug: 'sculpted-wool-coat',
    },
    {
      title: 'Đầm Lụa Charmeuse Canh Xéo Chảy Tràn',
      caption: 'Look 04 • Lụa tơ tằm hữu cơ 30-momme rủ dài với chi tiết lưng đan dây',
      image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=85',
      productSlug: 'liquid-silk-evening-dress',
    },
    {
      title: 'Âu Phục Tailoring Phi Cấu Trúc',
      caption: 'Look 09 • Suit hai hàng khuy dáng rủ nhẹ phóng khoáng chuẩn Paris',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85',
      productSlug: 'oversized-double-breasted-suit',
    },
    {
      title: 'Túi Da Box Calfskin Hình Khối Kiến Trúc',
      caption: 'Look 14 • Túi tote hình thang điêu khắc với tay cầm gỗ sồi ebonized',
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85',
      productSlug: 'obsidian-leather-tote',
    },
  ];

  const currentLook = lookbookItems[activeLookbookIndex];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
            Không gian thị giác & Mẫu thực nghiệm
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
            Sổ phối đồ tương tác & Nghiên cứu nếp gấp
          </h2>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border border-white/10 p-1.5 rounded-full bg-noir-900">
          {lookbookItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveLookbookIndex(idx)}
              className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all ${
                activeLookbookIndex === idx
                  ? 'bg-champagne text-noir-950 font-bold'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              LOOK 0{idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Main Look Presentation */}
        <div className="lg:col-span-8 relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-noir-900 border border-white/10 group">
          <img
            src={currentLook.image}
            alt={currentLook.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-8">
            <span className="text-xs uppercase font-mono tracking-widest text-champagne mb-1">
              Phối đồ Runway Mùa FW26
            </span>
            <h3 className="font-display text-2xl sm:text-3xl text-white mb-2">
              {currentLook.title}
            </h3>
            <p className="text-xs sm:text-sm text-platinum-dark font-sans max-w-lg mb-4 font-light">
              {currentLook.caption}
            </p>
            <Link
              to={`/products/${currentLook.productSlug}`}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white hover:text-champagne transition-colors"
            >
              <span>Xem chi tiết sản phẩm</span>
              <MoveRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 3D Cloth Physics Canvas Card */}
        <div className="lg:col-span-4 flex flex-col justify-between p-6 rounded-2xl bg-noir-900 border border-white/10 space-y-6">
          <div>
            <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
              Phòng thí nghiệm vật liệu Three.js
            </span>
            <h4 className="font-display text-xl text-white">
              Nghiên cứu Nếp rủ Vải vóc
            </h4>
            <p className="text-xs text-platinum-dark mt-2 font-sans font-light leading-relaxed">
              Mô phỏng 3D tương tác thể hiện độ rủ lụa tơ tằm nguyên bản dưới tác động của trường gió toán học.
            </p>
          </div>

          <div className="w-full h-64 rounded-xl overflow-hidden border border-white/10 bg-noir-950">
            <ThreeClothStudy />
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/50">
            <span>DỆT: LỤA TƠ TẰM HỮU CƠ</span>
            <span className="text-champagne">30 MOMME</span>
          </div>
        </div>
      </div>
    </section>
  );
};

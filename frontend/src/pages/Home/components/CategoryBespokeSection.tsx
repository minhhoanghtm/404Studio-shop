import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const CategoryBespokeSection: React.FC = () => {
  const categories = [
    {
      title: 'Thời trang Nữ',
      subtitle: 'Đầm lụa cắt xéo & Áo choàng phi cấu trúc',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85',
      link: '/products?category=women',
      span: 'md:col-span-8',
    },
    {
      title: 'Đồ da & Phụ kiện',
      subtitle: 'Túi da Box thủ công đánh số riêng',
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=85',
      link: '/products?category=accessories',
      span: 'md:col-span-4',
    },
    {
      title: 'Haute Couture',
      subtitle: 'Sản phẩm độc bản đặt may riêng theo số đo',
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85',
      link: '/collections/noir-absolu',
      span: 'md:col-span-4',
    },
    {
      title: 'Thời trang Nam',
      subtitle: 'Âu phục may đo kiến trúc Savile Row & Paris',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=85',
      link: '/products?category=men',
      span: 'md:col-span-8',
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-2">
          Tuyển tập kiến trúc hình khối
        </span>
        <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
          Khám phá theo danh mục
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.title}
            to={cat.link}
            className={`group relative overflow-hidden rounded-2xl bg-noir-900 h-96 sm:h-[480px] ${cat.span} border border-white/10`}
          >
            <img
              src={cat.image}
              alt={cat.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-8">
              <span className="text-[10px] uppercase tracking-widest text-champagne font-sans font-medium mb-1">
                Atelier Vérité
              </span>
              <h3 className="font-display text-2xl sm:text-3xl text-white mb-2 group-hover:text-champagne-light transition-colors">
                {cat.title}
              </h3>
              <p className="text-xs text-white/70 font-sans max-w-md mb-4 font-light">
                {cat.subtitle}
              </p>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white group-hover:text-champagne transition-colors">
                <span>Khám phá tuyển tập</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

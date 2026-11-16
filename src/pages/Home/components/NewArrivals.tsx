import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '../../../shared/components/ProductCard';
import { PRODUCTS } from '../../../shared/data/products';

export const NewArrivals: React.FC = () => {
  const newArrivals = PRODUCTS.filter((p) => p.isNewArrival).slice(0, 4);

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
            Ấn bản tuyển chọn đợt đầu
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
            Tác phẩm mới ra mắt
          </h2>
        </div>
        <Link
          to="/products"
          className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white hover:text-champagne transition-colors"
        >
          <span>Xem tất cả tác phẩm mới</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {newArrivals.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

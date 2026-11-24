import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '../../../shared/components/ProductCard';
import { productsApi } from '../../../shared/api';
import { adaptBackendProduct } from '../../../shared/utils/productAdapter';
import { Product } from '../../../shared/types';

export const NewArrivals: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadNewArrivals() {
      try {
        const res = await productsApi.getProducts({ sort: 'newest', limit: 4 });
        if (cancelled) return;
        const rawList = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.products)
          ? (res.data as any).products
          : Array.isArray(res)
          ? res
          : [];
        if (rawList.length > 0) {
          setProducts(rawList.map(adaptBackendProduct).slice(0, 4));
        }
      } catch {
        // Safe fail
      }
    }
    void loadNewArrivals();
    return () => {
      cancelled = true;
    };
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
            Ấn bản tuyển chọn đợt đầu
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
            Sản phẩm mới ra mắt
          </h2>
        </div>
        <Link
          to="/products"
          className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white hover:text-champagne transition-colors"
        >
          <span>Xem tất cả sản phẩm mới</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="product-card-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

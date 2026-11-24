import React, { useEffect, useState } from 'react';
import { History, Trash2 } from 'lucide-react';
import { getLocalBehaviorSignals, clearLocalBehaviorSignals } from '../../../shared/tracking/useBehaviorTracking';
import { productsApi } from '../../../shared/api';
import { Product } from '../../../shared/types';
import { adaptBackendProduct } from '../../../shared/utils/productAdapter';
import { ProductCard } from '../../../shared/components/ProductCard';

export const RecentlyViewedSection: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const signals = getLocalBehaviorSignals();
    const ids = signals?.recentViewedIds || [];

    if (!ids || ids.length === 0) {
      setLoading(false);
      return;
    }

    const uniqueIds = Array.from(new Set(ids)).slice(0, 4);

    Promise.all(
      uniqueIds.map((id) =>
        productsApi
          .getProductDetail(id)
          .then((res: any) => res?.data || res)
          .catch(() => null)
      )
    )
      .then((items) => {
        if (!active) return;
        const validItems = items
          .filter(Boolean)
          .map(adaptBackendProduct)
          .filter((p: Product) => p && p.id);
        setProducts(validItems);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleClearHistory = () => {
    clearLocalBehaviorSignals();
    setProducts([]);
  };

  // If no items have been viewed yet, return null to avoid any awkward whitespace gap
  if (!loading && products.length === 0) {
    return null;
  }

  if (loading && products.length === 0) {
    return null; // Don't show skeleton if we don't know whether there's history
  }

  return (
    <section
      aria-label="Sản phẩm vừa xem"
      className="py-20 border-t border-[var(--border)] bg-[var(--bg-page)] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--accent)] font-medium mb-2">
              <History className="w-3.5 h-3.5" />
              <span>DẤU ẤN LƯU NIỆM · RECENTLY VIEWED</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)]">
              Kiệt Tác Quý Khách Đã Chiêm Ngưỡng
            </h2>
          </div>

          <button
            onClick={handleClearHistory}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors uppercase tracking-wider self-start sm:self-auto cursor-pointer"
            title="Xóa lịch sử đã xem"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa lịch sử</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

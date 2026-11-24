import React, { useEffect, useState } from 'react';
import { History, Trash2 } from 'lucide-react';
import { Product } from '@/shared/types';
import { productsApi } from '@/shared/api';
import { adaptBackendProduct } from '@/shared/utils/productAdapter';
import { ProductCard } from '@/shared/components/ProductCard';
import { getLocalBehaviorSignals, clearLocalBehaviorSignals } from '@/shared/tracking/useBehaviorTracking';

interface ProductRecentlyViewedProps {
  currentProductId: string;
}

export const ProductRecentlyViewedSection: React.FC<ProductRecentlyViewedProps> = ({
  currentProductId,
}) => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const signals = getLocalBehaviorSignals();
    const ids = (signals?.recentViewedIds || []).filter((id) => id !== currentProductId);

    if (ids.length === 0) {
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
      .then((resList) => {
        if (!active) return;
        const valid = resList
          .filter(Boolean)
          .map(adaptBackendProduct)
          .filter((p: Product) => p && p.id && p.id !== currentProductId);

        setItems(valid);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentProductId]);

  const handleClear = () => {
    clearLocalBehaviorSignals();
    setItems([]);
  };

  if (!loading && items.length === 0) return null;
  if (loading && items.length === 0) return null;

  return (
    <section
      aria-label="Sản phẩm quý khách vừa xem"
      className="w-full pt-16 pb-16 border-t border-[var(--border)] transition-colors duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--accent)] font-mono font-medium mb-2">
            <History className="w-3.5 h-3.5" />
            <span>RECENT ENGAGEMENTS · DẤU ẤN LƯU NIỆM</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)]">
            Kiệt Tác Quý Khách Vừa Chiêm Ngưỡng
          </h3>
        </div>

        <button
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-red-500 transition-colors uppercase tracking-wider self-start sm:self-auto cursor-pointer"
          title="Xóa lịch sử vừa xem"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Xóa Lịch Sử</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {items.map((prod) => (
          <ProductCard key={prod.id} product={prod} />
        ))}
      </div>
    </section>
  );
};

import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Plus } from 'lucide-react';
import { Product } from '@/shared/types';
import { productsApi } from '@/shared/api';
import { adaptBackendProduct } from '@/shared/utils/productAdapter';
import { ProductCard } from '@/shared/components/ProductCard';

interface CompleteTheLookProps {
  currentProduct: Product;
  excludeIds?: string[];
}

export const CompleteTheLookSection: React.FC<CompleteTheLookProps> = ({
  currentProduct,
  excludeIds = [],
}) => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Fetch newest products from catalog and filter client-side for complementary styling
    productsApi
      .getProducts({ limit: 12, sort: 'newest' })
      .then((res: any) => {
        if (!active) return;
        const list = res?.data?.products || res?.data || (Array.isArray(res) ? res : []);
        const allExcluded = new Set([currentProduct.id, ...excludeIds]);
        const adapted = list
          .map(adaptBackendProduct)
          .filter((p: Product) => p && p.id && !allExcluded.has(p.id));

        // Complementary: look for items in different category
        const complementary = adapted.filter((p: Product) => p.category !== currentProduct.category);
        const finalItems = (complementary.length >= 2 ? complementary : adapted).slice(0, 3);

        setItems(finalItems);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [currentProduct.id, currentProduct.category, excludeIds]);

  if (!loading && items.length === 0) return null;

  return (
    <section
      aria-label="Phối đồ hoàn hảo cùng tác phẩm"
      className="w-full pt-16 pb-12 border-t border-[var(--border)] transition-colors duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--accent)] font-mono font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>EDITORIAL CURATION · OUTFIT HARMONY</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)]">
            Phối Đồ Hoàn Hảo Cùng Thiết Kế Này
          </h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)] font-light max-w-sm sm:text-right leading-relaxed">
          Gợi ý kết hợp phụ kiện và y phục may đo tương thích được cố vấn bởi Stylist Atelier Vérité.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {items.map((prod) => (
          <div key={prod.id} className="group relative">
            <ProductCard product={prod} />
          </div>
        ))}
      </div>
    </section>
  );
};

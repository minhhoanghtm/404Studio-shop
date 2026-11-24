import React, { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { Product } from '@/shared/types';
import { productsApi } from '@/shared/api';
import { adaptBackendProduct } from '@/shared/utils/productAdapter';
import { ProductCard } from '@/shared/components/ProductCard';

interface SimilarProductsProps {
  currentProduct: Product;
  excludeIds?: string[];
}

export const SimilarProductsSection: React.FC<SimilarProductsProps> = ({
  currentProduct,
  excludeIds = [],
}) => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    productsApi
      .getProducts({
        limit: 12,
        sort: 'newest',
      })
      .then((res: any) => {
        if (!active) return;
        const list = res?.data?.products || res?.data || (Array.isArray(res) ? res : []);
        const allExcluded = new Set([currentProduct.id, ...excludeIds]);

        const adapted = list
          .map(adaptBackendProduct)
          .filter((p: Product) => p && p.id && !allExcluded.has(p.id));

        // Prioritize same category silhouettes, fallback to general curated
        const sameCategory = adapted.filter((p: Product) => p.category === currentProduct.category);
        const others = adapted.filter((p: Product) => p.category !== currentProduct.category);
        const valid = [...sameCategory, ...others].slice(0, 4);

        setItems(valid);
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
      aria-label="Kiệt tác tương tự cùng danh mục"
      className="w-full pt-16 pb-12 border-t border-[var(--border)] transition-colors duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--accent)] font-mono font-medium mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>ARCHITECTURAL COUTURE · THIẾT KẾ CÙNG PHONG CÁCH</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)]">
            Kiệt Tác Tương Tự
          </h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)] font-light max-w-sm sm:text-right leading-relaxed">
          Những cấu trúc may đo mang cùng tinh thần thẩm mỹ và chất liệu thượng thừa trong bộ sưu tập.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {items.map((prod) => (
          <ProductCard key={prod.id} product={prod} />
        ))}
      </div>
    </section>
  );
};

import React, { useEffect, useState } from 'react';
import { Compass } from 'lucide-react';
import { Product } from '@/shared/types';
import { recommendationsApi, productsApi } from '@/shared/api';
import { adaptBackendProduct } from '@/shared/utils/productAdapter';
import { ProductCard } from '@/shared/components/ProductCard';
import { useConsentStore } from '@/shared/consent';

interface YouMayAlsoLikeProps {
  currentProduct: Product;
  excludeIds?: string[];
}

export const YouMayAlsoLikeSection: React.FC<YouMayAlsoLikeProps> = ({
  currentProduct,
  excludeIds = [],
}) => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const hasPersonalization = useConsentStore((s) =>
    Boolean(s.consentRecord?.categories?.personalization)
  );

  useEffect(() => {
    let active = true;

    // Request recommendations or curated catalog
    const fetchRecs = async () => {
      try {
        const allExcluded = new Set([currentProduct.id, ...excludeIds]);
        let rawList: any[] = [];

        try {
          const recRes: any = await recommendationsApi.getRecommendations({ limit: 8 });
          const data = recRes?.data?.recommendations || recRes?.data?.products || recRes?.data || [];
          if (Array.isArray(data) && data.length > 0) {
            rawList = data;
          }
        } catch {
          // Fallback to catalog
        }

        if (rawList.length === 0) {
          const catRes: any = await productsApi.getProducts({ limit: 8, sort: 'newest' });
          rawList = catRes?.data?.products || catRes?.data || [];
        }

        if (!active) return;
        const valid = rawList
          .map(adaptBackendProduct)
          .filter((p: Product) => p && p.id && !allExcluded.has(p.id))
          .slice(0, 4);

        setItems(valid);
        setLoading(false);
      } catch {
        if (active) setLoading(false);
      }
    };

    void fetchRecs();

    return () => {
      active = false;
    };
  }, [currentProduct.id, excludeIds]);

  if (!loading && items.length === 0) return null;

  return (
    <section
      aria-label="Có thể quý khách sẽ thích"
      className="w-full pt-16 pb-12 border-t border-[var(--border)] transition-colors duration-300"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--accent)] font-mono font-medium mb-2">
            <Compass className="w-3.5 h-3.5" />
            <span>PERSONALIZED SELECTION · TUYỂN CHỌN DÀNH CHO BẠN</span>
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)]">
            Có Thể Quý Khách Sẽ Thích
          </h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)] font-light max-w-sm sm:text-right leading-relaxed">
          {hasPersonalization
            ? 'Đề xuất may đo được cá nhân hóa dựa trên gu thẩm mỹ và phong cách quý khách yêu thích.'
            : 'Những kiệt tác mùa mới nhận được sự quan tâm nhiều nhất từ giới mộ điệu.'}
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

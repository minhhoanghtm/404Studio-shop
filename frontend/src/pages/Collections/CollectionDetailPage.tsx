import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { COLLECTIONS } from '@/shared/data/collections';
import { productsApi } from '@/shared/api';
import { adaptBackendProduct } from '@/shared/utils/productAdapter';
import { Product } from '@/shared/types';
import { ProductCard } from '@/shared/components/ProductCard';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const collection = COLLECTIONS.find((c) => c.slug === slug) || COLLECTIONS[0];

  const [collectionProducts, setCollectionProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await productsApi.getProducts({ limit: 8 });
        if (cancelled) return;
        const rawList = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.products)
          ? (res.data as any).products
          : Array.isArray(res)
          ? res
          : [];
        if (rawList.length > 0) {
          setCollectionProducts(rawList.map(adaptBackendProduct));
        }
      } catch {}
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Hero Banner with Dark Contrast Gradient Overlay for Text Readability */}
      <div className="relative w-full h-[50vh] sm:h-[65vh] min-h-[380px] sm:min-h-[480px] overflow-hidden flex items-end">
        <img
          src={collection.heroImage}
          alt={collection.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-16 w-full space-y-3 sm:space-y-4">
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-amber-300 hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Trở lại danh sách Runway
          </Link>

          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-300/40 bg-black/60 backdrop-blur-md text-amber-300 text-[10px] uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> Trình diễn Runway
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-6xl lg:text-7xl text-white tracking-wide break-words">
            {collection.title}
          </h1>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono uppercase tracking-widest text-stone-200">
            <span>{collection.season} {collection.year}</span>
            <span>•</span>
            <span className="break-words">{collection.subtitle}</span>
          </div>
        </div>
      </div>

      {/* Editorial Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-16 sm:space-y-24">
        {/* Curatorial Text & Quote */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-4 sm:space-y-6">
            <span className="text-[10px] uppercase tracking-widest text-[var(--accent)] font-semibold block">
              Khảo luận Giám tuyển
            </span>
            <p className="font-serif text-lg sm:text-2xl text-[var(--text)] leading-relaxed font-light">
              &ldquo;{collection.editorialQuote}&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-sans font-light">
              {collection.description}
            </p>
          </div>

          {/* Lookbook Preview Mosaic */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-3 sm:gap-4">
            {collection.lookbookImages.slice(0, 4).map((img, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-xl overflow-hidden bg-[var(--bg-alt)] border border-[var(--border)] shadow-md"
              >
                <img
                  src={img}
                  alt={`Lookbook số ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Collection Products */}
        <div className="space-y-8 sm:space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
            <div>
              <span className="text-[10px] font-sans font-semibold tracking-widest text-[var(--accent)] uppercase block mb-1">
                Y phục Sàn diễn
              </span>
              <h3 className="font-display text-xl sm:text-3xl text-[var(--text)] break-words">
                Các sản phẩm thuộc Bộ sưu tập ({collectionProducts.length})
              </h3>
            </div>
          </div>

          <div className="product-card-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {collectionProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

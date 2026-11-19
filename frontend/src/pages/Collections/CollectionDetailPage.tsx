import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { COLLECTIONS } from '@/shared/data/collections';
import { PRODUCTS } from '@/shared/data/products';
import { ProductCard } from '@/shared/components/ProductCard';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const CollectionDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const collection = COLLECTIONS.find((c) => c.slug === slug) || COLLECTIONS[0];

  const collectionProducts = PRODUCTS.filter(
    (p) => collection.productSlugs.includes(p.slug) || p.collectionSlug === collection.slug
  );

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen">
      {/* Hero Banner */}
      <div className="relative w-full h-[65vh] min-h-[480px] overflow-hidden flex items-end">
        <img
          src={collection.heroImage}
          alt={collection.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noir-950 via-noir-950/50 to-noir-950/20" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full space-y-4">
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-champagne hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Trở lại danh sách Runway
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-champagne/30 bg-noir-950/60 backdrop-blur-md text-champagne text-[10px] uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Trình diễn Runway
          </div>

          <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl text-white tracking-wide">
            {collection.title}
          </h1>

          <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest text-platinum-light">
            <span>{collection.season} {collection.year}</span>
            <span>•</span>
            <span>{collection.subtitle}</span>
          </div>
        </div>
      </div>

      {/* Editorial Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-24">
        {/* Curatorial Text & Quote */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="text-[10px] uppercase tracking-widest text-champagne font-semibold block">
              Khảo luận Giám tuyển
            </span>
            <p className="font-serif text-xl sm:text-2xl text-white leading-relaxed font-light">
              &ldquo;{collection.editorialQuote}&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
              {collection.description}
            </p>
          </div>

          {/* Lookbook Preview Mosaic */}
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            {collection.lookbookImages.slice(0, 4).map((img, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-xl overflow-hidden bg-noir-900 border border-white/10 shadow-lg"
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
        <div className="space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
                Y phục Sàn diễn
              </span>
              <h3 className="font-display text-2xl sm:text-3xl text-white">
                Các sản phẩm thuộc Bộ sưu tập ({collectionProducts.length})
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {collectionProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus, Eye, Sparkles } from 'lucide-react';
import { productsApi } from '../../../shared/api';
import { Product } from '../../../shared/types';
import { adaptBackendProduct } from '../../../shared/utils/productAdapter';
import { formatCurrency } from '../../../shared/utils/formatters';
import { useCartStore } from '../../../shared/stores/useCartStore';

export const NewArrivalsSection: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    let active = true;
    productsApi
      .getProducts({ sort: 'newest', limit: 5 })
      .then((res: any) => {
        if (!active) return;
        const list = res?.data?.products || res?.data || res?.items || [];
        const adapted = list.map(adaptBackendProduct).filter((p: Product) => p && p.id);
        setProducts(adapted);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const variant = product.variants?.[0];
    const size = variant?.sizes?.find((s) => s.inStock)?.size || 'M';
    addItem({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      price: product.price,
      quantity: 1,
      selectedColor: variant?.colorName || 'Phiên bản tiêu chuẩn',
      selectedColorHex: variant?.colorHex || '#d4af37',
      selectedSize: size,
      image: product.featuredImage,
    });
  };

  const starProduct = products[0];
  const sideProducts = products.slice(1, 5);

  return (
    <section
      data-testid="section-new-arrivals"
      className="w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header Meta */}
        <div className="flex items-center justify-between pb-6 mb-16 border-b border-[var(--border)] text-[11px] font-mono tracking-[0.25em] text-[var(--accent)] uppercase font-semibold">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30">05</span>
            <span>TUYỂN TẬP MỚI RA MẮT · THE EDIT (SS26)</span>
          </div>
          <span className="hidden sm:inline-block text-[var(--text-muted)]">CÁC THIẾT KẾ MỚI NHẤT TRONG TUẦN</span>
        </div>

        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="space-y-3 max-w-2xl">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[var(--accent)] font-medium">
              LIMITED FIRST DROP
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[var(--text-primary)] font-normal tracking-tight">
              Tuyệt tác vừa hoàn thiện từ xưởng may
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans font-light leading-relaxed">
              Mỗi sản phẩm xuất hiện trong The Edit được may đo giới hạn theo từng xấp vải nhập khẩu, kiểm định nghiêm ngặt về độ bền cơ học và phom dáng đứng.
            </p>
          </div>

          <Link
            to="/products?sort=newest"
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest font-mono text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors self-start md:self-end font-semibold pb-1 border-b border-[var(--text-primary)]/40 hover:border-[var(--accent)]"
          >
            <span>Xem toàn bộ The Edit</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Editorial Asymmetric Composition */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-7 aspect-[4/5] bg-[var(--bg-card)] rounded-2xl animate-pulse" />
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="aspect-[3/4] bg-[var(--bg-card)] rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : starProduct ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            {/* Left: Featured Star Product Spotlight */}
            <div className="lg:col-span-7 group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl flex flex-col justify-between">
              <Link to={`/products/${starProduct.slug}`} className="block relative aspect-[4/5] overflow-hidden">
                <img
                  src={starProduct.featuredImage}
                  alt={starProduct.name}
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                
                <div className="absolute top-6 left-6">
                  <span className="px-3.5 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-black/60 text-[#D4AF37] border border-[#D4AF37]/40 backdrop-blur-md font-semibold">
                    STAR PIECE · TIÊU ĐIỂM
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#D4AF37]">
                    {starProduct.subCategory || 'Haute Couture'}
                  </span>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-2xl sm:text-3xl text-white font-normal group-hover:text-[#D4AF37] transition-colors">
                        {starProduct.name}
                      </h3>
                      <p className="text-xs text-white/70 font-sans font-light line-clamp-2 mt-1">
                        {starProduct.composition || 'Chất liệu lụa tơ tằm hữu cơ và len virgin wool cao cấp'}
                      </p>
                    </div>
                    <span className="font-serif text-xl sm:text-2xl text-white font-medium shrink-0">
                      {formatCurrency(starProduct.price)}
                    </span>
                  </div>
                </div>
              </Link>

              <div className="p-6 bg-[var(--bg-card)] border-t border-[var(--border)] flex items-center justify-between gap-4">
                <span className="text-xs text-[var(--text-muted)] font-mono">
                  Sản xuất giới hạn đợt 1
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => handleQuickAdd(starProduct, e)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider font-semibold bg-[var(--text-primary)] text-[var(--inverse-text)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm nhanh</span>
                  </button>
                  <Link
                    to={`/products/${starProduct.slug}`}
                    className="px-4 py-2.5 rounded-full text-xs font-mono uppercase tracking-wider font-semibold border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] transition-colors"
                  >
                    Chi tiết
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: 4 Side Products Grid */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4 sm:gap-6">
              {sideProducts.map((p) => (
                <div
                  key={p.id}
                  className="group flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <Link to={`/products/${p.slug}`} className="relative aspect-[3/4] overflow-hidden block">
                    <img
                      src={p.featuredImage}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-[var(--bg-card)]/90 backdrop-blur-md text-[var(--accent)] border border-[var(--border)] font-semibold">
                        NEW
                      </span>
                    </div>
                  </Link>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-mono tracking-wider uppercase text-[var(--text-muted)] truncate">
                        {p.subCategory || 'Atelier'}
                      </p>
                      <Link
                        to={`/products/${p.slug}`}
                        className="font-serif text-sm text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors line-clamp-1 font-medium mt-0.5"
                      >
                        {p.name}
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-[var(--border)]/60 flex items-center justify-between gap-2">
                      <span className="text-xs font-serif font-semibold text-[var(--accent)]">
                        {formatCurrency(p.price)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(p, e)}
                        className="w-7 h-7 rounded-full bg-[var(--border)]/60 hover:bg-[var(--accent)] hover:text-white flex items-center justify-center text-[var(--text-primary)] transition-colors"
                        title="Thêm nhanh vào túi"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};

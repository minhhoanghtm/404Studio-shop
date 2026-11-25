import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsApi } from '@/shared/api';
import { adaptBackendProduct } from '@/shared/utils/productAdapter';
import { Product } from '@/shared/types';
import { PRODUCTS } from '@/shared/data/products';
import { useCartStore } from '@/shared/stores/useCartStore';
import { useWishlistStore } from '@/shared/stores/useWishlistStore';
import { useToastStore } from '@/shared/stores/useToastStore';
import { formatCurrency } from '@/shared/utils/formatters';
import { vi } from '@/shared/locales/vi/common';
import { ProductGallery } from './components/ProductGallery';
import { ColorVariantSelector } from './components/ColorVariantSelector';
import { SizeSelector } from './components/SizeSelector';
import { AddToCartButton } from './components/AddToCartButton';
import { ProductAccordion } from './components/ProductAccordion';
import { ProductReviewsSection } from './components/ProductReviewsSection';
import {
  CompleteTheLookSection,
  YouMayAlsoLikeSection,
  SimilarProductsSection,
  ProductRecentlyViewedSection,
} from './components/discovery';
import { Sparkles, Star, AlertCircle, ShoppingBag, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useBehaviorTracking } from '@/shared/tracking/useBehaviorTracking';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCartStore();
  const { isInWishlist, toggleWishlist, isSyncing: wishlistPending } = useWishlistStore();
  const { addToast } = useToastStore();
  const { trackProductView, trackAddToCart: trackAddCartEvent } = useBehaviorTracking();

  useEffect(() => {
    let isCancelled = false;
    async function fetchProduct() {
      if (!slug) return;
      setIsLoading(true);
      setNotFound(false);

      try {
        const response = await productsApi.getProductBySlug(slug);
        if (isCancelled) return;

        const raw = response.data || (response as any);
        if (response.success !== false && raw && (raw._id || raw.id)) {
          const adapted = adaptBackendProduct(raw);
          setProduct(adapted);
          const firstVar = adapted.variants[0];
          const defaultSize = firstVar?.sizes.find((s) => s.inStock)?.size || firstVar?.sizes[0]?.size || '';
          setSelectedSize(defaultSize);
        } else {
          const fallback = PRODUCTS.find((p) => p.slug === slug || p.id === slug);
          if (fallback) {
            setProduct(fallback);
            const firstVar = fallback.variants[0];
            const defaultSize = firstVar?.sizes.find((s) => s.inStock)?.size || firstVar?.sizes[0]?.size || '';
            setSelectedSize(defaultSize);
          } else {
            setNotFound(true);
          }
        }
      } catch {
        if (!isCancelled) {
          const fallback = PRODUCTS.find((p) => p.slug === slug || p.id === slug);
          if (fallback) {
            setProduct(fallback);
            const firstVar = fallback.variants[0];
            const defaultSize = firstVar?.sizes.find((s) => s.inStock)?.size || firstVar?.sizes[0]?.size || '';
            setSelectedSize(defaultSize);
          } else {
            setNotFound(true);
          }
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    void fetchProduct();
    return () => {
      isCancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (product?.id) {
      trackProductView(product.id, product.category, product.name);
    }
  }, [product?.id]);

  const activeVariant = product?.variants?.[selectedVariantIndex] || product?.variants?.[0];
  const isWishlisted = product ? isInWishlist(product.id) : false;

  // Sync size whenever variant changes
  useEffect(() => {
    if (!activeVariant) return;
    const firstInStockSize =
      activeVariant.sizes.find((s) => s.inStock)?.size || activeVariant.sizes[0]?.size || '';
    setSelectedSize(firstInStockSize);
  }, [activeVariant]);

  const activeSizeObj = activeVariant?.sizes.find((s) => s.size === selectedSize);
  const isAvailable = activeSizeObj?.inStock ?? (product?.inStock !== false);

  const currentGalleryImages =
    activeVariant?.images && activeVariant.images.length > 0
      ? activeVariant.images
      : product?.galleryImages || [];

  const handleAddToCart = async () => {
    if (!product || !activeVariant) return false;
    const sizeToUse = selectedSize || activeVariant.sizes.find((s) => s.inStock)?.size || activeVariant.sizes[0]?.size || 'M';

    const matchedSizeObj = activeVariant.sizes.find((s) => s.size === sizeToUse);

    const added = await addItem({
      productId: product.id,
      variantId: matchedSizeObj?.variantId || activeVariant.id,
      productSlug: product.slug,
      name: product.name,
      price: product.price,
      quantity,
      selectedColor: activeVariant.colorName,
      selectedColorHex: activeVariant.colorHex,
      selectedSize: sizeToUse,
      image: currentGalleryImages[0] || product.featuredImage,
    });

    if (!added) return false;
    trackAddCartEvent(product.id, quantity);
    addToast({
      type: 'success',
      title: 'Đã thêm vào giỏ hàng',
      message: `${quantity}x ${product.name} (${activeVariant.colorName} / Size ${sizeToUse}) đã được lưu vào túi mua sắm.`,
    });
    return true;
  };

  const handleShare = () => {
    if (!product) return;
    if (navigator.share) {
      navigator.share({
        title: `${product.name} | ${vi.brand.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast({
        type: 'info',
        title: 'Đã sao chép liên kết',
        message: 'Đường dẫn tác phẩm đã được lưu vào bộ nhớ tạm của quý khách.',
      });
    }
  };

  const scrollToReviews = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('customer-reviews');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="w-full bg-[var(--bg-page)] text-[var(--text-primary)] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-800 w-1/4 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
            <div className="lg:col-span-7 aspect-[4/5] bg-neutral-200 dark:bg-neutral-800 rounded-none" />
            <div className="lg:col-span-5 space-y-6">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
              <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
              <div className="h-10 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
              <div className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
              <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Not Found State
  if (notFound || !product) {
    return (
      <div className="w-full bg-[var(--bg-page)] text-[var(--text-primary)] min-h-[75vh] flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center space-y-6 border border-[var(--border)] bg-[var(--bg-card)] p-8 shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full border border-dashed border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold">
              Mã sản phẩm: {slug}
            </span>
            <h1 className="font-serif text-2xl text-[var(--text-primary)]">
              Thiết Kế Không Khả Dụng
            </h1>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-light">
              Thiết kế này hiện không tồn tại trên hệ thống hoặc đã kết thúc đợt phát hành độc bản. Kính mời quý khách khám phá các tác phẩm mới nhất trong danh mục chính thức.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[var(--text-primary)] text-[var(--bg-page)] text-xs font-medium uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
            >
              <ShoppingBag className="w-4 h-4" /> Khám Phá Danh Mục Sản Phẩm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--bg-page)] text-[var(--text-primary)] min-h-screen pt-3 pb-16 sm:pt-5 sm:pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center flex-wrap gap-2 text-[11px] font-mono tracking-widest uppercase text-[var(--text-muted)]"
        >
          <Link to="/" className="hover:text-[var(--text-primary)] transition-colors">
            {vi.nav.home}
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-[var(--text-primary)] transition-colors">
            {vi.nav.products}
          </Link>
          <span>/</span>
          <Link
            to={`/products?category=${product.category}`}
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-[var(--text-primary)] font-semibold truncate max-w-[240px]">
            {product.name}
          </span>
        </nav>

        {/* =========================================================================
            STAGE 1: PRODUCT DETAILS (2 COLUMNS)
            Left: Sticky Gallery (Contained strictly within this stage)
            Right: Product Information & Spec Accordion (Natural document scroll)
            ========================================================================= */}
        <div className="product-details-stage grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start relative">
          {/* Cột Trái: Sticky Product Gallery (6 cols) */}
          <div className="lg:col-span-6 w-full">
            <ProductGallery
              images={currentGalleryImages}
              productName={product.name}
              badge={product.badge}
            />
          </div>

          {/* Cột Phải: Thông tin tác phẩm & Tương tác mua sắm (6 cols) */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-7">
            {/* Header info */}
            <div className="space-y-3 pb-6 border-b border-[var(--border)]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-[var(--accent)] font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ATELIER VÉRITÉ · HAUTE COUTURE</span>
                </span>
                <span className="text-[11px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
                  Mã #{product.id.slice(0, 8).toUpperCase()}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[var(--text-primary)] tracking-tight leading-tight">
                {product.name}
              </h1>

              {product.subtitle && (
                <p className="font-serif italic text-base text-[var(--text-secondary)] font-light">
                  {product.subtitle}
                </p>
              )}

              {/* Rating Summary with smooth scroll anchor to full-width review section */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1 text-[var(--accent)]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(product.rating || 5)
                          ? 'fill-[var(--accent)] text-[var(--accent)]'
                          : 'text-neutral-300 dark:text-neutral-700'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={scrollToReviews}
                  className="text-xs font-mono text-[var(--text-muted)] hover:text-[var(--accent)] underline transition-colors cursor-pointer"
                >
                  {(product.rating || 5.0).toFixed(1)} / 5.0 ({product.reviewCount || 12} đánh giá)
                </button>
              </div>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 pt-3">
                <span className="font-mono text-2xl sm:text-3xl text-[var(--text-primary)] font-semibold">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="font-mono text-base text-[var(--text-muted)] line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-mono uppercase font-bold tracking-wider">
                    Ưu đãi -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                  </span>
                )}
              </div>
            </div>

            {/* Short Description */}
            {product.description && (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-light leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Color Variant Selector */}
            {product.variants.length > 0 && (
              <ColorVariantSelector
                variants={product.variants}
                selectedVariantIndex={selectedVariantIndex}
                onSelectVariant={setSelectedVariantIndex}
              />
            )}

            {/* Size Selector with Size Guide Modal */}
            {activeVariant && activeVariant.sizes.length > 0 && (
              <SizeSelector
                sizes={activeVariant.sizes}
                selectedSize={selectedSize}
                onSelectSize={setSelectedSize}
                category={product.category}
              />
            )}

            {/* Stock & Delivery Status */}
            <div className="flex items-center gap-2 text-xs py-1">
              <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-[var(--text-secondary)] font-light">
                {isAvailable
                  ? 'Sẵn sàng chế tác & giao hàng bảo đảm tận nơi trong 24-48h'
                  : 'Đang chuẩn bị đợt dệt thủ công tiếp theo'}
              </span>
            </div>

            {/* Add to Cart Actions */}
            <AddToCartButton
              quantity={quantity}
              onQuantityChange={setQuantity}
              isAvailable={isAvailable}
              onAddToCart={handleAddToCart}
              isWishlisted={isWishlisted}
              wishlistPending={wishlistPending}
              onToggleWishlist={() => toggleWishlist(product)}
              onShare={handleShare}
            />

            {/* Accordion Specifications */}
            <ProductAccordion product={product} />
          </div>
        </div>

        {/* =========================================================================
            STAGE 2: FULL-WIDTH CUSTOMER REVIEWS
            Extracted out of right accordion into full-width section
            Sticky gallery ends naturally before this section begins
            ========================================================================= */}
        <ProductReviewsSection
          productId={product.id}
          productName={product.name}
          initialRating={product.rating}
          initialReviewCount={product.reviewCount}
        />

        {/* =========================================================================
            STAGE 3: SMART PRODUCT DISCOVERY (BEFORE FOOTER)
            01. Complete the Look (Outfit coordination)
            02. You May Also Like (Personalized recommendations)
            03. Similar Products (Same silhouette category)
            04. Recently Viewed (Behavior tracking memory)
            ========================================================================= */}
        <div className="space-y-4">
          {/* 01. Complete The Look */}
          <CompleteTheLookSection currentProduct={product} />

          {/* 02. You May Also Like */}
          <YouMayAlsoLikeSection currentProduct={product} />

          {/* 03. Similar Products */}
          <SimilarProductsSection currentProduct={product} />

          {/* 04. Recently Viewed (Auto-hides if empty) */}
          <ProductRecentlyViewedSection currentProductId={product.id} />
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;

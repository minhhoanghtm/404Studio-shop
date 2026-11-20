import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsApi } from '@/shared/api';
import { adaptBackendProduct } from '@/shared/utils/productAdapter';
import { Product } from '@/shared/types';
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
import { RelatedProducts } from './components/RelatedProducts';
import { Sparkles, ArrowLeft, AlertCircle, ShoppingBag } from 'lucide-react';
import { useBehaviorTracking } from '@/shared/tracking/useBehaviorTracking';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
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

          // Fetch related real products
          try {
            const relatedRes = await productsApi.getProducts({ limit: 4 });
            const relatedRaw = relatedRes.data || (relatedRes as any);
            if (Array.isArray(relatedRaw)) {
              const adaptedRelated = relatedRaw
                .filter((r: any) => (r._id || r.id) !== adapted.id)
                .slice(0, 4)
                .map(adaptBackendProduct);
              if (!isCancelled) setRelatedProducts(adaptedRelated);
            }
          } catch {
            // Non-critical
          }
        } else {
          setNotFound(true);
        }
      } catch {
        if (!isCancelled) setNotFound(true);
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
  const isAvailable = activeSizeObj?.inStock ?? false;

  const currentGalleryImages =
    activeVariant?.images && activeVariant.images.length > 0
      ? activeVariant.images
      : product?.galleryImages || [];

  const handleAddToCart = () => {
    if (!product || !activeVariant) return;
    const sizeToUse = selectedSize || activeVariant.sizes.find((s) => s.inStock)?.size || activeVariant.sizes[0]?.size || '';
    if (!sizeToUse) return;

    trackAddCartEvent(product.id, quantity);

    const matchedSizeObj = activeVariant.sizes.find((s) => s.size === sizeToUse);

    addItem({
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
        message: 'Đường dẫn sản phẩm đã được lưu vào bộ nhớ tạm của quý khách.',
      });
    }
  };

  // 1. Loading Skeleton State
  if (isLoading) {
    return (
      <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="h-4 atelier-skeleton rounded w-1/4" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7 aspect-[3/4] atelier-skeleton rounded-sm" />
            <div className="lg:col-span-5 space-y-6">
              <div className="h-8 atelier-skeleton rounded w-3/4" />
              <div className="h-5 atelier-skeleton rounded w-1/2" />
              <div className="h-10 atelier-skeleton rounded w-1/3" />
              <div className="h-24 atelier-skeleton rounded" />
              <div className="h-12 atelier-skeleton rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Not Found State (NO fallback to mock PRODUCTS)
  if (notFound || !product) {
    return (
      <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-[75vh] flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center space-y-6 border border-[var(--border)] bg-[var(--surface)] p-8 rounded-sm shadow-md">
          <div className="w-14 h-14 mx-auto rounded-full border border-dashed border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--accent)] font-semibold">
              Mã sản phẩm: {slug}
            </span>
            <h1 className="font-display font-serif text-2xl text-[var(--text)]">
              Sản phẩm không khả dụng
            </h1>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              Thiết kế này hiện không tồn tại trên hệ thống hoặc đã ngừng kinh doanh. Quý khách vui lòng khám phá các tác phẩm mới nhất trong danh mục chính thức.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-sans font-semibold uppercase tracking-widest hover:bg-[#9E7B15] rounded-sm transition-colors shadow-lg"
            >
              <ShoppingBag className="w-4 h-4" /> Khám phá danh mục sản phẩm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-[11px] font-sans tracking-widest uppercase text-[var(--text-muted)]">
          <Link to="/" className="hover:text-[var(--text)] transition-colors">{vi.nav.home}</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-[var(--text)] transition-colors">{vi.nav.products}</Link>
          <span>/</span>
          <Link
            to={`/products?category=${product.category}`}
            className="hover:text-[var(--text)] transition-colors"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-[var(--text)] truncate max-w-[200px] font-medium">{product.name}</span>
        </nav>

        {/* Product Stage: Gallery + Information */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Gallery Column */}
          <div className="lg:col-span-7">
            <ProductGallery
              images={currentGalleryImages}
              productName={product.name}
              badge={product.badge}
            />
          </div>

          {/* Details / Action Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-2 border-b border-[var(--border)] pb-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--accent)] flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3" /> Mã hệ thống #{product.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-[11px] font-sans text-[var(--text-muted)] uppercase tracking-widest">
                  {product.origin}
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl text-[var(--text)] tracking-wide leading-tight">
                {product.name}
              </h1>

              <p className="font-serif italic text-base text-[var(--text-muted)]">
                {product.subtitle}
              </p>

              <div className="flex items-baseline gap-3 pt-3">
                <span className="font-mono text-2xl text-[var(--text)] font-semibold">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="font-mono text-base text-[var(--text-muted)] line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Color Variant Selector */}
            {product.variants.length > 0 && (
              <ColorVariantSelector
                variants={product.variants}
                selectedVariantIndex={selectedVariantIndex}
                onSelectVariant={setSelectedVariantIndex}
              />
            )}

            {/* Size Selector */}
            {activeVariant && activeVariant.sizes.length > 0 && (
              <SizeSelector
                sizes={activeVariant.sizes}
                selectedSize={selectedSize}
                onSelectSize={setSelectedSize}
              />
            )}

            {/* Add to Cart Actions */}
            <AddToCartButton
              quantity={quantity}
              onQuantityChange={setQuantity}
              isAvailable={isAvailable}
              onAddToCart={handleAddToCart}
              isWishlisted={isWishlisted}
              onToggleWishlist={() => toggleWishlist(product)}
              onShare={handleShare}
            />

            {/* Accordion Specs */}
            <ProductAccordion product={product} />
          </div>
        </div>

        {/* Related Creations */}
        {relatedProducts.length > 0 && (
          <RelatedProducts products={relatedProducts} />
        )}
      </div>
    </div>
  );
};

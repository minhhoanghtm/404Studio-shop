import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { useWishlistStore } from '../stores/useWishlistStore';
import { useCartStore } from '../stores/useCartStore';
import { formatCurrency } from '../utils/formatters';
import { vi } from '../locales/vi/common';
import { useBehaviorTracking } from '../tracking/useBehaviorTracking';

interface ProductCardProps {
  product: Product;
  aspectRatio?: 'editorial' | 'square' | 'tall';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  aspectRatio = 'editorial',
}) => {
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { trackProductClick, trackAddToCart: trackAddCart, trackWishlist } = useBehaviorTracking();
  const prefersReducedMotion = useReducedMotion();
  const isWishlisted = isInWishlist(product.id);

  const [isHovered, setIsHovered] = useState(false);
  const [selectedQuickSize, setSelectedQuickSize] = useState<string | null>(null);
  const [isQuickAdded, setIsQuickAdded] = useState(false);

  const primaryVariant = product.variants[0];
  const secondaryImage =
    primaryVariant?.images[1] || product.galleryImages[1] || product.featuredImage;

  // Normalize sizes list with stock status (supports strings and object formats)
  const cardSizes: Array<{ size: string; inStock: boolean }> = useMemo(() => {
    if (primaryVariant?.sizes && primaryVariant.sizes.length > 0) {
      return primaryVariant.sizes.map((s: any) =>
        typeof s === 'string' ? { size: s, inStock: true } : { size: s.size, inStock: s.inStock !== false }
      );
    }
    if (product.sizes && product.sizes.length > 0) {
      return product.sizes.map((s: any) =>
        typeof s === 'string' ? { size: s, inStock: true } : { size: s.size, inStock: s.inStock !== false }
      );
    }
    return [
      { size: '36 FR', inStock: true },
      { size: '38 FR', inStock: true },
      { size: '40 FR', inStock: true },
      { size: '42 FR', inStock: false },
    ];
  }, [primaryVariant, product.sizes]);

  const handleQuickAdd = (size: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedQuickSize(size);
    trackAddCart(product.id, 1);

    addItem({
      productId: product.id,
      variantId: primaryVariant?.id,
      productSlug: product.slug,
      name: product.name,
      price: product.price,
      quantity: 1,
      selectedColor: primaryVariant?.colorName || 'Tiêu chuẩn',
      selectedColorHex: primaryVariant?.colorHex || '#141416',
      selectedSize: size,
      image: product.featuredImage,
    });

    setIsQuickAdded(true);
    setTimeout(() => setIsQuickAdded(false), 2000);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackWishlist(product.id);
    toggleWishlist(product);
  };

  // Compact fashion proportion: 3/4 aspect ratio for neat display
  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : 'aspect-[3/4]';

  return (
    <motion.div
      className="group relative flex flex-col min-w-0"
      initial={prefersReducedMotion === false ? { opacity: 0, y: 14 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      whileHover={prefersReducedMotion === false ? { y: -3 } : undefined}
      transition={prefersReducedMotion === false ? { duration: 0.48, ease: 'easeOut' } : { duration: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Stage (Aspect 3/4, Reduced height, Compact) */}
      <div className={`relative w-full ${aspectClass} overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--bg-alt)] mb-2 sm:mb-2.5 transition-all duration-500`}>
        <Link
          to={`/products/${product.slug}`}
          onClick={() => trackProductClick(product.id, product.category, 'product_card')}
          className="block w-full h-full"
        >
          {/* Primary Image */}
          <img
            src={product.featuredImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-opacity duration-700 ${isHovered && secondaryImage ? 'opacity-0' : 'opacity-100'
              }`}
            loading="lazy"
          />

          {/* Secondary Hover Reveal Image */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                } transition-transform duration-700`}
              loading="lazy"
            />
          )}
        </Link>

        {/* Subtle Gradient Shadow under photo to keep controls legible on any image */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 via-black/20 to-transparent pointer-events-none z-[1]" />
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/35 to-transparent pointer-events-none z-[1]" />

        {/* Compact Badge (FW26) */}
        {product.badge && (
          <div className="absolute top-2 left-2 z-10">
            <span className="px-2 py-0.5 rounded bg-[var(--bg-card)]/95 backdrop-blur-md border border-[var(--border)] text-[9px] uppercase font-sans font-bold tracking-wider text-[var(--accent)] shadow-sm">
              {product.badge}
            </span>
          </div>
        )}

        {/* Compact Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? `Bỏ ${product.name} khỏi danh sách yêu thích` : `Thêm ${product.name} vào danh sách yêu thích`}
          className={`absolute top-2 right-2 z-10 p-1.5 sm:p-2 rounded-full transition-all duration-300 ${isWishlisted
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-lg scale-105'
              : 'bg-[var(--bg-card)]/90 backdrop-blur-md text-[var(--text-primary)] hover:text-[var(--accent)] hover:bg-[var(--bg-card)] border border-[var(--border)] shadow-sm'
            }`}
        >
          <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Compact Quick Size Flyout on Hover */}
        <div
          className={`absolute inset-x-2 bottom-2 z-10 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
        >
          <div className="p-2 rounded-lg bg-[var(--bg-card)]/95 backdrop-blur-xl border border-[var(--border)] shadow-xl flex flex-col gap-1.5">
            <span className="text-[9px] font-sans font-semibold uppercase tracking-wider text-[var(--text-primary)] text-center flex items-center justify-center gap-1">
              <ShoppingBag className="w-2.5 h-2.5 text-[var(--accent)]" />
              <span>{isQuickAdded ? 'Đã thêm vào giỏ' : 'Thêm nhanh'}</span>
            </span>
            <div className="flex items-center justify-center gap-1 flex-wrap">
              {cardSizes.map((s) => {
                const isSelected = selectedQuickSize === s.size && isQuickAdded;
                return (
                  <button
                    key={s.size}
                    disabled={!s.inStock}
                    onClick={(e) => s.inStock && handleQuickAdd(s.size, e)}
                    className={`px-1.5 py-0.5 text-[9px] font-mono rounded border transition-all ${
                      isSelected
                        ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)] font-semibold shadow-sm'
                        : !s.inStock
                        ? 'opacity-40 cursor-not-allowed line-through bg-[var(--bg-page)] text-[var(--text-muted)] border-[var(--border)]'
                        : 'bg-[var(--bg-page)] hover:bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                    }`}
                    title={!s.inStock ? `${s.size} (Hết hàng)` : s.size}
                  >
                    {s.size}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Meta / Info (Compact Typography & Spacing) */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-baseline justify-between gap-1.5">
          <span className="text-[11px] font-sans tracking-wider uppercase text-[var(--accent)] font-medium truncate">
            {product.category}
          </span>
          <span className="text-[11px] font-sans text-[var(--text-muted)] tracking-wider shrink-0">
            {product.origin}
          </span>
        </div>

        <Link
          to={`/products/${product.slug}`}
          className="font-display text-[14px] sm:text-[15px] leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors line-clamp-2"
          title={product.name}
        >
          {product.name}
        </Link>

        {product.subtitle && (
          <p className="text-[11px] text-[var(--text-muted)] font-sans line-clamp-1 font-light hidden sm:block">
            {product.subtitle}
          </p>
        )}

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[13px] sm:text-[14px] text-[var(--text-primary)] font-semibold">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="font-mono text-[11px] sm:text-[12px] text-[var(--text-muted)] line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Color Indicators */}
          {product.variants && product.variants.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              {product.variants.slice(0, 4).map((v) => (
                <span
                  key={v.colorName}
                  title={v.colorName}
                  className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-[var(--border)]"
                  style={{ backgroundColor: v.colorHex }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
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

  const aspectClass =
    aspectRatio === 'tall'
      ? 'aspect-[3/4]'
      : aspectRatio === 'square'
        ? 'aspect-square'
        : 'aspect-[4/5]';

  return (
    <motion.div
      className="group relative flex flex-col"
      initial={prefersReducedMotion === false ? { opacity: 0, y: 14 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      whileHover={prefersReducedMotion === false ? { y: -3 } : undefined}
      transition={prefersReducedMotion === false ? { duration: 0.48, ease: 'easeOut' } : { duration: 0 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Stage */}
      <div className={`relative w-full ${aspectClass} overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--bg-alt)] mb-4 transition-all duration-500`}>
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

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 rounded bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] text-[10px] uppercase font-sans font-semibold tracking-widest text-[var(--accent)]">
              {product.badge}
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? `Bỏ ${product.name} khỏi danh sách yêu thích` : `Thêm ${product.name} vào danh sách yêu thích`}
          className={`absolute top-3 right-3 z-10 p-2.5 rounded-full transition-all duration-300 ${isWishlisted
              ? 'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-lg scale-105'
              : 'bg-[var(--surface)]/80 backdrop-blur-md text-[var(--text)] hover:text-[var(--accent)] hover:bg-[var(--surface)] border border-[var(--border)]'
            }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Size Flyout on Hover */}
        <div
          className={`absolute inset-x-3 bottom-3 z-10 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
        >
          <div className="p-2.5 rounded-xl bg-[var(--surface)]/95 backdrop-blur-xl border border-[var(--border)] shadow-xl flex flex-col gap-1.5">
            <span className="text-[9px] font-sans font-medium uppercase tracking-widest text-[var(--text-muted)] text-center">
              {isQuickAdded ? 'Đã thêm vào giỏ hàng' : vi.catalog.quickSize}
            </span>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {(product.sizes || primaryVariant?.sizes?.map((s) => s.size) || ['36 FR', '38 FR', '40 FR']).map((size) => (
                <button
                  key={size}
                  onClick={(e) => handleQuickAdd(size, e)}
                  className={`px-2 py-1 text-[10px] font-mono rounded border transition-all ${selectedQuickSize === size && isQuickAdded
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)] border-[var(--accent)]'
                      : 'bg-[var(--bg-alt)] hover:bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:border-[var(--accent)]'
                    }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Meta / Info */}
      <div className="flex flex-col space-y-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[10px] font-sans tracking-widest uppercase text-[var(--accent)] font-medium">
            {product.category}
          </span>
          <span className="text-[10px] font-sans text-[var(--text-muted)] tracking-wider">
            {product.origin}
          </span>
        </div>

        <Link
          to={`/products/${product.slug}`}
          className="font-display text-base text-[var(--text)] group-hover:text-[var(--accent)] transition-colors line-clamp-1"
        >
          {product.name}
        </Link>

        <p className="text-xs text-[var(--text-muted)] font-sans line-clamp-1 font-light">
          {product.subtitle}
        </p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm text-[var(--text)] font-semibold">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="font-mono text-xs text-[var(--text-muted)] line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Color Indicators */}
          <div className="flex items-center gap-1">
            {product.variants.map((v) => (
              <span
                key={v.colorName}
                title={v.colorName}
                className="w-2.5 h-2.5 rounded-full border border-[var(--border)]"
                style={{ backgroundColor: v.colorHex }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

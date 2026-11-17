import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Check } from 'lucide-react';
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
      productSlug: product.slug,
      name: product.name,
      price: product.price,
      quantity: 1,
      selectedColor: primaryVariant.colorName,
      selectedColorHex: primaryVariant.colorHex,
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
    <div
      className="group relative flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Stage */}
      <div className={`relative w-full ${aspectClass} overflow-hidden rounded-xl bg-ivory-200 dark:bg-noir-900 mb-4 transition-all duration-500`}>
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
            <span className="px-2.5 py-1 rounded bg-noir-950/80 backdrop-blur-md border border-white/10 text-[10px] uppercase font-sans font-semibold tracking-widest text-champagne">
              {product.badge}
            </span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          aria-label={isWishlisted ? `Bỏ ${product.name} khỏi danh sách yêu thích` : `Thêm ${product.name} vào danh sách yêu thích`}
          className={`absolute top-3 right-3 z-10 p-2.5 rounded-full transition-all duration-300 ${isWishlisted
              ? 'bg-champagne text-noir-950 shadow-lg scale-105'
              : 'bg-black/40 dark:bg-noir-950/70 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/60 dark:hover:bg-noir-950'
            }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Size Flyout on Hover */}
        <div
          className={`absolute inset-x-3 bottom-3 z-10 transition-all duration-300 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
        >
          <div className="p-2.5 rounded-xl bg-white/95 dark:bg-noir-950/90 backdrop-blur-xl border border-black/10 dark:border-white/15 shadow-2xl flex flex-col gap-1.5">
            <span className="text-[9px] font-sans font-medium uppercase tracking-widest text-noir-500 dark:text-white/50 text-center">
              {isQuickAdded ? 'Đã thêm vào giỏ hàng' : vi.catalog.quickSize}
            </span>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              {(product.sizes || primaryVariant?.sizes?.map((s) => s.size) || ['36 FR', '38 FR', '40 FR']).map((size) => (
                <button
                  key={size}
                  onClick={(e) => handleQuickAdd(size, e)}
                  className={`px-2 py-1 text-[10px] font-mono rounded border transition-all ${selectedQuickSize === size && isQuickAdded
                      ? 'bg-champagne text-noir-950 border-champagne'
                      : 'bg-black/5 hover:bg-black/10 text-noir-900 border-black/10 dark:bg-white/5 dark:hover:bg-white/15 dark:text-white/90 dark:border-white/10'
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
          <span className="text-[10px] font-sans tracking-widest uppercase text-champagne-dark dark:text-champagne/80 font-medium">
            {product.category}
          </span>
          <span className="text-[10px] font-sans text-noir-400 dark:text-white/40 tracking-wider">
            {product.origin}
          </span>
        </div>

        <Link
          to={`/products/${product.slug}`}
          className="font-display text-base text-noir-950 dark:text-white group-hover:text-champagne transition-colors line-clamp-1"
        >
          {product.name}
        </Link>

        <p className="text-xs text-noir-600 dark:text-platinum-dark font-sans line-clamp-1 font-light">
          {product.subtitle}
        </p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm text-noir-950 dark:text-white font-medium">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="font-mono text-xs text-noir-400 dark:text-white/40 line-through">
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
                className="w-2.5 h-2.5 rounded-full border border-black/20 dark:border-white/20"
                style={{ backgroundColor: v.colorHex }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

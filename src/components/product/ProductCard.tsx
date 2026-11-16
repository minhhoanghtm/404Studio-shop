import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, Check } from 'lucide-react';
import { Product } from '../../types';
import { useWishlistStore } from '../../stores/useWishlistStore';
import { useCartStore } from '../../stores/useCartStore';

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
      <div className={`relative w-full ${aspectClass} overflow-hidden rounded-xl bg-noir-900 mb-4 transition-all duration-500`}>
        <Link to={`/products/${product.slug}`} className="block w-full h-full">
          {/* Primary Image */}
          <img
            src={product.featuredImage}
            alt={product.name}
            className={`w-full h-full object-cover transition-opacity duration-700 ${
              isHovered && secondaryImage ? 'opacity-0' : 'opacity-100'
            }`}
            loading="lazy"
          />

          {/* Secondary Hover Reveal Image */}
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                isHovered ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
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
          className={`absolute top-3 right-3 z-10 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${
            isWishlisted
              ? 'bg-champagne text-noir-950 shadow-lg'
              : 'bg-noir-950/70 text-white/80 hover:text-champagne hover:bg-noir-950'
          }`}
          aria-label={isWishlisted ? 'Remove from curated list' : 'Save to curated list'}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Add Size Bar (Reveals on Desktop Hover) */}
        <div className="absolute inset-x-3 bottom-3 z-10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hidden md:block">
          <div className="p-2 rounded-lg bg-noir-950/90 backdrop-blur-md border border-white/10 flex items-center justify-between gap-1 shadow-2xl">
            <span className="text-[10px] font-sans uppercase tracking-widest text-white/60 pl-2">
              Quick Size:
            </span>
            <div className="flex items-center gap-1">
              {primaryVariant.sizes.map((s) => (
                <button
                  key={s.size}
                  disabled={!s.inStock}
                  onClick={(e) => handleQuickAdd(s.size, e)}
                  className={`px-2 py-1 text-[10px] font-mono rounded transition-colors ${
                    !s.inStock
                      ? 'text-white/20 line-through cursor-not-allowed'
                      : isQuickAdded && selectedQuickSize === s.size
                      ? 'bg-champagne text-noir-950 font-bold'
                      : 'bg-white/10 hover:bg-champagne hover:text-noir-950 text-white'
                  }`}
                  title={s.inStock ? `Add size ${s.size}` : 'Sold out'}
                >
                  {isQuickAdded && selectedQuickSize === s.size ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    s.size.split(' ')[0]
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Product Meta */}
      <div className="flex flex-col space-y-1">
        {/* Color Variants Dot Indicator */}
        <div className="flex items-center gap-1.5 mb-1">
          {product.variants.map((v) => (
            <span
              key={v.id}
              className="w-2.5 h-2.5 rounded-full border border-white/20"
              style={{ backgroundColor: v.colorHex }}
              title={v.colorName}
            />
          ))}
          <span className="text-[10px] uppercase font-sans tracking-widest text-platinum-dark ml-1">
            {product.subCategory}
          </span>
        </div>

        {/* Product Name */}
        <Link
          to={`/products/${product.slug}`}
          className="font-serif text-base sm:text-lg font-medium text-white group-hover:text-champagne transition-colors line-clamp-1"
        >
          {product.name}
        </Link>

        {/* Subtitle */}
        <p className="text-xs text-platinum-dark line-clamp-1 font-sans font-light">
          {product.subtitle}
        </p>

        {/* Price */}
        <div className="flex items-center gap-2 pt-1 font-mono text-sm">
          <span className="text-white font-medium">
            ${product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-white/40 line-through text-xs">
              ${product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

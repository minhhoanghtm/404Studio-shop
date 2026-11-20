import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '@/shared/stores/useWishlistStore';
import { useCartStore } from '@/shared/stores/useCartStore';
import { ProductCard } from '@/shared/components/ProductCard';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { vi } from '@/shared/locales/vi/common';
import { Product } from '@/shared/types';

export const WishlistPage: React.FC = () => {
  const { items, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const handleMoveAllToBag = () => {
    items.forEach((p: Product) => {
      const primaryVar = p.variants[0];
      const availableSize =
        primaryVar.sizes.find((s) => s.inStock)?.size ||
        primaryVar.sizes[0]?.size ||
        'One Size';
      addItem({
        productId: p.id,
        productSlug: p.slug,
        name: p.price ? p.name : p.name,
        price: p.price,
        quantity: 1,
        selectedColor: primaryVar.colorName,
        selectedColorHex: primaryVar.colorHex,
        selectedSize: availableSize,
        image: p.featuredImage,
      });
    });
  };

  if (items.length === 0) {
    return (
      <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-[75vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md space-y-6">
          <div className="w-20 h-20 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 flex items-center justify-center mx-auto text-[var(--accent)]">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-[var(--text)]">
            {vi.wishlist.emptyTitle}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-sans font-light leading-relaxed">
            {vi.wishlist.emptySubtitle}
          </p>
          <div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-widest transition-colors shadow-lg rounded-lg"
            >
              <span>{vi.wishlist.discoverCta}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-[var(--border)] pb-6 gap-4">
          <div>
            <span className="text-[10px] font-sans font-semibold tracking-widest text-[var(--accent)] uppercase block mb-1">
              Tuyển tập cá nhân
            </span>
            <h1 className="font-display text-3xl sm:text-5xl text-[var(--text)] tracking-wide">
              {vi.wishlist.title}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-sans">
            <button
              onClick={handleMoveAllToBag}
              className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold uppercase tracking-widest transition-colors flex items-center gap-2 rounded-lg"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{vi.wishlist.moveAllToCart}</span>
            </button>
            <button
              onClick={clearWishlist}
              className="text-[var(--text-muted)] hover:text-red-500 underline transition-colors"
            >
              {vi.wishlist.clearAll}
            </button>
          </div>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {items.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

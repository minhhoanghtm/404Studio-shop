import React from 'react';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '../stores/useWishlistStore';
import { useCartStore } from '../stores/useCartStore';
import { ProductCard } from '../components/product/ProductCard';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';

export const WishlistPage: React.FC = () => {
  const { items, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();

  const handleMoveAllToBag = () => {
    items.forEach((p) => {
      const primaryVar = p.variants[0];
      const availableSize = primaryVar.sizes.find((s) => s.inStock)?.size || primaryVar.sizes[0]?.size || 'One Size';
      addItem({
        productId: p.id,
        productSlug: p.slug,
        name: p.name,
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
      <div className="w-full bg-noir-950 text-white min-h-[75vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md space-y-6">
          <div className="w-20 h-20 rounded-full border border-champagne/30 flex items-center justify-center mx-auto text-champagne">
            <Heart className="w-8 h-8" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-white">Your Curated List is Empty</h1>
          <p className="text-xs sm:text-sm text-platinum-dark font-sans font-light leading-relaxed">
            Preserve your favorite runway silhouettes, couture gowns, and leather accessories for future acquisition.
          </p>
          <div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest transition-colors shadow-lg"
            >
              <span>Discover Collections</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-white/10 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
              Private Selections
            </span>
            <h1 className="font-display text-3xl sm:text-5xl text-white tracking-wide">
              Curated Wishlist
            </h1>
          </div>
          <div className="flex items-center gap-4 text-xs font-sans">
            <button
              onClick={handleMoveAllToBag}
              className="px-5 py-2.5 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold uppercase tracking-widest transition-colors flex items-center gap-2 rounded"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Move All to Bag</span>
            </button>
            <button
              onClick={clearWishlist}
              className="text-white/40 hover:text-red-400 underline transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

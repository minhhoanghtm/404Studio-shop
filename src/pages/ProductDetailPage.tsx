import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PRODUCTS } from '../data/products';
import { useCartStore } from '../stores/useCartStore';
import { useWishlistStore } from '../stores/useWishlistStore';
import { ProductCard } from '../components/product/ProductCard';
import {
  Heart,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  Check,
  Truck,
  ShieldCheck,
  RefreshCw,
  Star,
  Ruler,
  Share2,
} from 'lucide-react';
import { useToastStore } from '../stores/useToastStore';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const product = PRODUCTS.find((p) => p.slug === slug) || PRODUCTS[0];

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>('details');

  const { addItem } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { addToast } = useToastStore();

  const activeVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const isWishlisted = isInWishlist(product.id);

  // Set initial selected size when variant changes
  useEffect(() => {
    const firstInStockSize = activeVariant.sizes.find((s) => s.inStock)?.size || activeVariant.sizes[0]?.size || '';
    setSelectedSize(firstInStockSize);
    setSelectedImageIndex(0);
  }, [activeVariant]);

  const activeSizeObj = activeVariant.sizes.find((s) => s.size === selectedSize);
  const isAvailable = activeSizeObj?.inStock ?? false;

  const currentGalleryImages = activeVariant.images?.length > 0 
    ? activeVariant.images 
    : product.galleryImages;

  const handleAddToCart = () => {
    if (!selectedSize || !isAvailable) return;

    addItem({
      productId: product.id,
      productSlug: product.slug,
      name: product.name,
      price: product.price,
      quantity,
      selectedColor: activeVariant.colorName,
      selectedColorHex: activeVariant.colorHex,
      selectedSize,
      image: currentGalleryImages[0] || product.featuredImage,
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${product.name} | Atelier Vérité`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast({
        type: 'info',
        title: 'Link Copied',
        message: 'Product link copied to clipboard.',
      });
    }
  };

  const relatedProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-[11px] font-sans tracking-widest uppercase text-white/50 mb-8">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-white transition-colors">Shop</Link>
          <span>/</span>
          <Link to={`/shop/${product.category}`} className="hover:text-white transition-colors capitalize">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-champagne truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Product Grid Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column: Gallery Images */}
          <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
            {/* Vertical Thumbnail Column */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto no-scrollbar md:w-24 flex-shrink-0">
              {currentGalleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`relative aspect-[3/4] w-20 md:w-full rounded-lg overflow-hidden border transition-all ${
                    selectedImageIndex === idx
                      ? 'border-champagne ring-1 ring-champagne'
                      : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>

            {/* Main Stage Image */}
            <div className="flex-1 relative aspect-[3/4] rounded-2xl overflow-hidden bg-noir-900 border border-white/10 shadow-2xl">
              <img
                src={currentGalleryImages[selectedImageIndex] || product.featuredImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {product.badge && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 rounded bg-noir-950/80 backdrop-blur-md border border-white/10 text-xs uppercase font-sans font-semibold tracking-widest text-champagne">
                    {product.badge}
                  </span>
                </div>
              )}

              <button
                onClick={handleShare}
                className="absolute top-4 right-4 z-10 p-3 rounded-full bg-noir-950/70 hover:bg-noir-950 text-white/80 hover:text-white backdrop-blur-md transition-colors"
                aria-label="Share product"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Details & Purchasing Controls */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              {/* Product Titles & Ratings */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center text-champagne text-xs">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-mono text-platinum-dark">
                    ({product.reviewCount} patron reviews)
                  </span>
                </div>

                <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
                  {product.name}
                </h1>
                <p className="text-sm font-sans text-platinum-dark mt-1">
                  {product.subtitle}
                </p>

                <div className="flex items-baseline gap-3 mt-4">
                  <span className="font-mono text-2xl font-semibold text-white">
                    ${product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-white/40 line-through font-mono text-base">
                      ${product.originalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-[11px] uppercase tracking-widest text-champagne font-sans ml-2">
                    Tax Included • Free Courier
                  </span>
                </div>
              </div>

              {/* Color Variant Selector */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="uppercase tracking-widest text-white/70">
                    Color: <span className="text-white font-medium">{activeVariant.colorName}</span>
                  </span>
                  <span className="text-platinum-dark font-mono text-[11px]">
                    {product.variants.length} Tonalities Available
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {product.variants.map((v, idx) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantIndex(idx)}
                      className={`relative w-8 h-8 rounded-full border-2 transition-all p-0.5 ${
                        selectedVariantIndex === idx
                          ? 'border-champagne scale-110'
                          : 'border-transparent hover:border-white/40'
                      }`}
                      title={v.colorName}
                    >
                      <span
                        className="w-full h-full rounded-full block border border-black/20"
                        style={{ backgroundColor: v.colorHex }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="uppercase tracking-widest text-white/70">
                    Select Sizing:
                  </span>
                  <Link
                    to="/size-guide"
                    className="text-champagne hover:underline flex items-center gap-1 text-[11px] uppercase tracking-wider"
                  >
                    <Ruler className="w-3.5 h-3.5" /> Size Guide
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {activeVariant.sizes.map((s) => (
                    <button
                      key={s.size}
                      disabled={!s.inStock}
                      onClick={() => setSelectedSize(s.size)}
                      className={`py-3 px-2 text-xs font-mono rounded-lg border transition-all text-center ${
                        !s.inStock
                          ? 'border-white/5 bg-white/5 text-white/20 line-through cursor-not-allowed'
                          : selectedSize === s.size
                          ? 'border-champagne bg-champagne text-noir-950 font-bold shadow-md'
                          : 'border-white/10 hover:border-champagne/40 bg-noir-900 text-white'
                      }`}
                    >
                      {s.size}
                    </button>
                  ))}
                </div>

                {activeSizeObj && activeSizeObj.inStock && activeSizeObj.stockCount <= 3 && (
                  <p className="text-[11px] font-mono text-champagne">
                    ⚡ Only {activeSizeObj.stockCount} editions remaining in this size
                  </p>
                )}
              </div>

              {/* Purchase Actions */}
              <div className="pt-4 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={!isAvailable}
                    className="flex-1 py-4 bg-champagne hover:bg-champagne-hover disabled:bg-white/10 disabled:text-white/30 disabled:cursor-not-allowed text-noir-950 font-semibold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isAvailable ? 'Add to Shopping Bag' : 'Size Sold Out'}</span>
                  </button>

                  <button
                    onClick={() => toggleWishlist(product)}
                    className={`p-4 rounded border transition-colors ${
                      isWishlisted
                        ? 'border-champagne bg-champagne text-noir-950'
                        : 'border-white/15 hover:border-champagne text-white'
                    }`}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] text-platinum-dark text-center font-sans uppercase tracking-widest">
                  <div className="flex flex-col items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-champagne" />
                    <span>Courier Express</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-champagne" />
                    <span>Numbered Edition</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5 text-champagne" />
                    <span>30-Day Returns</span>
                  </div>
                </div>
              </div>

              {/* Accordions */}
              <div className="pt-6 border-t border-white/10 divide-y divide-white/10 text-xs font-sans">
                {/* Details */}
                <div className="py-4">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === 'details' ? null : 'details')}
                    className="w-full flex items-center justify-between text-left font-medium uppercase tracking-widest text-white"
                  >
                    <span>Sartorial Details & Cut</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'details' ? 'rotate-180' : ''}`} />
                  </button>
                  {openAccordion === 'details' && (
                    <div className="pt-3 text-platinum-dark space-y-2">
                      <p className="leading-relaxed">{product.description}</p>
                      <ul className="list-disc pl-4 space-y-1 text-white/80">
                        {product.details.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Composition */}
                <div className="py-4">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === 'comp' ? null : 'comp')}
                    className="w-full flex items-center justify-between text-left font-medium uppercase tracking-widest text-white"
                  >
                    <span>Composition & Provenance</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'comp' ? 'rotate-180' : ''}`} />
                  </button>
                  {openAccordion === 'comp' && (
                    <div className="pt-3 text-platinum-dark space-y-2">
                      <p><span className="text-white font-medium">Textile:</span> {product.composition}</p>
                      <p><span className="text-white font-medium">Crafted:</span> {product.origin}</p>
                    </div>
                  )}
                </div>

                {/* Care */}
                <div className="py-4">
                  <button
                    onClick={() => setOpenAccordion(openAccordion === 'care' ? null : 'care')}
                    className="w-full flex items-center justify-between text-left font-medium uppercase tracking-widest text-white"
                  >
                    <span>White-Glove Care & Preservation</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${openAccordion === 'care' ? 'rotate-180' : ''}`} />
                  </button>
                  {openAccordion === 'care' && (
                    <div className="pt-3 text-platinum-dark space-y-1">
                      {product.careInstructions.map((c, i) => (
                        <p key={i}>• {c}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curated Companions Section */}
        {relatedProducts.length > 0 && (
          <section className="mt-28 pt-16 border-t border-white/10">
            <div className="mb-10">
              <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
                Atelier Pairing
              </span>
              <h3 className="font-display text-2xl sm:text-3xl text-white">
                Curated Wardrobe Companions
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

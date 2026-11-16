import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { RelatedProducts } from './components/RelatedProducts';
import { Sparkles } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const product = PRODUCTS.find((p) => p.slug === slug) || PRODUCTS[0];

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  const { addItem } = useCartStore();
  const { isInWishlist, toggleWishlist } = useWishlistStore();
  const { addToast } = useToastStore();

  const activeVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const isWishlisted = isInWishlist(product.id);

  // Sync size whenever variant changes
  useEffect(() => {
    const firstInStockSize =
      activeVariant.sizes.find((s) => s.inStock)?.size || activeVariant.sizes[0]?.size || '';
    setSelectedSize(firstInStockSize);
  }, [activeVariant]);

  const activeSizeObj = activeVariant.sizes.find((s) => s.size === selectedSize);
  const isAvailable = activeSizeObj?.inStock ?? false;

  const currentGalleryImages =
    activeVariant.images && activeVariant.images.length > 0
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

  const relatedProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-[11px] font-sans tracking-widest uppercase text-white/50">
          <Link to="/" className="hover:text-white transition-colors">{vi.nav.home}</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-white transition-colors">{vi.nav.products}</Link>
          <span>/</span>
          <Link
            to={`/products?category=${product.category}`}
            className="hover:text-white transition-colors"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-white/90 truncate max-w-[200px]">{product.name}</span>
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
            <div className="space-y-2 border-b border-white/10 pb-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-widest text-champagne flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Mã lưu trữ #{product.id.slice(0, 6).toUpperCase()}
                </span>
                <span className="text-[11px] font-sans text-white/40 uppercase tracking-widest">
                  {product.origin}
                </span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl text-white tracking-wide leading-tight">
                {product.name}
              </h1>

              <p className="font-serif italic text-base text-champagne-light">
                {product.subtitle}
              </p>

              <div className="flex items-baseline gap-3 pt-3">
                <span className="font-mono text-2xl text-white font-medium">
                  {formatCurrency(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="font-mono text-base text-white/40 line-through">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Color Variant Selector */}
            <ColorVariantSelector
              variants={product.variants}
              selectedVariantIndex={selectedVariantIndex}
              onSelectVariant={setSelectedVariantIndex}
            />

            {/* Size Selector */}
            <SizeSelector
              sizes={activeVariant.sizes}
              selectedSize={selectedSize}
              onSelectSize={setSelectedSize}
            />

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
        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
};

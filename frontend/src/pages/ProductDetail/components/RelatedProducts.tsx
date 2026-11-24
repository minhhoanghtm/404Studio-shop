import React from 'react';
import { Product } from '../../../shared/types';
import { ProductCard } from '../../../shared/components/ProductCard';

interface RelatedProductsProps {
  products: Product[];
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({ products }) => {
  if (products.length === 0) return null;

  return (
    <div className="pt-24 border-t border-[var(--border)] space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-[10px] font-sans font-semibold tracking-widest text-[var(--accent)] uppercase block">
          Cảm hứng đồng điệu
        </span>
        <h3 className="font-display text-2xl sm:text-3xl text-[var(--text)]">
          Sản phẩm cùng phong cách thiết kế
        </h3>
      </div>

      <div className="product-card-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

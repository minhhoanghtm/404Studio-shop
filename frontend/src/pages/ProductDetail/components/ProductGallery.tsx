import React, { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  badge?: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
  badge,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentImage = images[selectedIndex] || images[0];

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4">
      {/* Thumbnail Bar */}
      <div className="flex lg:flex-col gap-3 overflow-x-auto no-scrollbar py-1 lg:w-20 flex-shrink-0">
        {images.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedIndex(idx)}
            className={`relative w-16 h-20 lg:w-20 lg:h-24 rounded-lg overflow-hidden border transition-all flex-shrink-0 bg-[var(--bg-alt)] ${
              selectedIndex === idx
                ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] scale-105'
                : 'border-[var(--border)] hover:border-[var(--accent)]/50 opacity-80 hover:opacity-100'
            }`}
            aria-label={`Xem ảnh góc nhìn số ${idx + 1}`}
          >
            <img
              src={img}
              alt=""
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Main Image View */}
      <div className="relative flex-1 aspect-[4/5] rounded-2xl overflow-hidden bg-[var(--bg-alt)] border border-[var(--border)] group">
        <img
          src={currentImage}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {badge && (
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1.5 rounded bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] text-[10px] uppercase font-mono tracking-widest text-[var(--accent)] font-semibold">
              {badge}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

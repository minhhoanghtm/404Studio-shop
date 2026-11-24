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
    <div className="flex flex-col-reverse lg:flex-row gap-2.5 sm:gap-3 items-start w-full max-w-[520px] mx-auto lg:mx-0">
      {/* Thumbnail Bar (56-64px, gap 8px, clean border, no layout shifts) */}
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto no-scrollbar py-1 lg:py-0 w-full lg:w-16 flex-shrink-0 lg:max-h-[70vh]">
        {images.map((img, idx) => {
          const isSelected = selectedIndex === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-14 h-[70px] sm:w-16 sm:h-20 rounded-md overflow-hidden border-2 transition-colors flex-shrink-0 bg-[var(--bg-alt)] ${
                isSelected
                  ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] shadow-sm opacity-100'
                  : 'border-transparent hover:border-[var(--accent)]/50 opacity-70 hover:opacity-100'
              }`}
              aria-label={`Xem ảnh góc nhìn số ${idx + 1}`}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
            </button>
          );
        })}
      </div>

      {/* Main Image View (Max-height 70vh desktop, 60vh mobile, aspect 4/5, object-fit cover) */}
      <div className="relative flex-1 w-full aspect-[4/5] max-h-[60vh] lg:max-h-[70vh] rounded-xl overflow-hidden bg-[var(--bg-alt)] border border-[var(--border)] group shadow-sm">
        <img
          src={currentImage}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badge "TUYỂN CHỌN" / status badge (10-11px, high contrast with theme background blur) */}
        {badge && (
          <div className="absolute top-3 left-3 z-10">
            <span className="px-2.5 py-1 rounded bg-[var(--bg-card)]/90 dark:bg-black/80 backdrop-blur-md border border-[var(--border)] text-[10px] sm:text-[11px] uppercase font-sans font-bold tracking-wider text-[var(--accent)] shadow-md">
              {badge}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

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
            className={`relative w-16 h-20 lg:w-20 lg:h-24 rounded-lg overflow-hidden border transition-all flex-shrink-0 bg-noir-900 ${
              selectedIndex === idx
                ? 'border-champagne ring-1 ring-champagne scale-105'
                : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
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
      <div className="relative flex-1 aspect-[4/5] rounded-2xl overflow-hidden bg-noir-900 border border-white/10 group">
        <img
          src={currentImage}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {badge && (
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1.5 rounded bg-noir-950/80 backdrop-blur-md border border-white/10 text-[10px] uppercase font-mono tracking-widest text-champagne">
              {badge}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

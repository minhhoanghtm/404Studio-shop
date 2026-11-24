import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, X, Maximize2 } from 'lucide-react';

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
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Normalize images array to ensure at least one fallback
  const validImages = images.length > 0 ? images : [''];
  const currentImage = validImages[selectedIndex] || validImages[0];

  // Reset selected index if images change (e.g. variant switched)
  useEffect(() => {
    setSelectedIndex(0);
  }, [images]);

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  }, [validImages.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  }, [validImages.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLightboxOpen) {
        if (e.key === 'Escape') setIsLightboxOpen(false);
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handlePrev, handleNext]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  return (
    <>
      {/* Sticky Gallery Container:
          - lg:sticky lg:top-24 pins the gallery inside the Product Details stage
          - Available height bounded to clamp(380px, calc(100dvh - 230px), 620px)
          - Fits 100% inside initial viewport across 1280x720, 1366x768, 1440x900, 1920x1080
          - No crop: uses object-contain with luxury neutral canvas background
      */}
      <div className="w-full lg:sticky lg:top-24 self-start flex flex-col-reverse lg:flex-row gap-3 items-stretch lg:h-[clamp(380px,calc(100dvh-230px),620px)]">
        {/* Thumbnails Strip */}
        {validImages.length > 1 && (
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto no-scrollbar py-1 lg:py-0 w-full lg:w-16 flex-shrink-0 lg:max-h-full">
            {validImages.map((img, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className={`relative w-14 h-18 sm:w-16 sm:h-20 overflow-hidden border transition-all flex-shrink-0 bg-[var(--bg-card)] ${
                    isSelected
                      ? 'border-[var(--accent)] ring-1 ring-[var(--accent)] shadow-sm opacity-100'
                      : 'border-[var(--border)] hover:border-[var(--accent)]/50 opacity-60 hover:opacity-100'
                  }`}
                  aria-label={`Xem góc nhìn ${idx + 1}`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[var(--accent)]/5 pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Main Product Canvas Viewport */}
        <div
          className="relative flex-1 w-full h-[55vh] sm:h-[65vh] lg:h-full bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden group select-none flex items-center justify-center transition-colors duration-300"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Main Product Image (Object Contain - Full Silhouette, Never Cropped) */}
          <img
            src={currentImage}
            alt={productName}
            className="w-full h-full object-contain p-2 sm:p-4 transition-transform duration-500"
            loading="eager"
          />

          {/* Luxury Badge */}
          {badge && (
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
              <span className="px-3 py-1 bg-black/80 dark:bg-black/90 backdrop-blur-md border border-white/20 text-[10px] uppercase font-mono tracking-widest text-[var(--accent)] shadow-md">
                {badge}
              </span>
            </div>
          )}

          {/* Image Navigation Arrows (Desktop hover / Mobile visible) */}
          {validImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[var(--bg-page)]/80 hover:bg-[var(--bg-page)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 shadow-md hover:scale-105"
                aria-label="Hình trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[var(--bg-page)]/80 hover:bg-[var(--bg-page)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 shadow-md hover:scale-105"
                aria-label="Hình kế tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Action Overlay: Zoom & Counter */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2 z-10">
            {validImages.length > 1 && (
              <span className="px-2.5 py-1 bg-[var(--bg-page)]/90 backdrop-blur-sm border border-[var(--border)] text-[10px] font-mono text-[var(--text-muted)] tracking-wider">
                0{selectedIndex + 1} / 0{validImages.length}
              </span>
            )}

            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="p-2 bg-[var(--bg-page)]/90 hover:bg-[var(--bg-page)] backdrop-blur-sm border border-[var(--border)] text-[var(--text-primary)] hover:text-[var(--accent)] transition-all shadow-sm"
              title="Phóng to chi tiết tác phẩm"
              aria-label="Phóng to hình ảnh"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen High-Res Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Controls */}
          <div
            className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsZoomed((z) => !z)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              title={isZoomed ? 'Thu nhỏ' : 'Phóng đại 2X'}
              aria-label="Chuyển chế độ zoom"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              title="Đóng (Esc)"
              aria-label="Đóng xem chi tiết"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Lightbox Image Stage */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center overflow-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage}
              alt={productName}
              className={`max-w-full max-h-full object-contain transition-transform duration-300 cursor-zoom-${
                isZoomed ? 'out scale-150' : 'in scale-100'
              }`}
              onClick={() => setIsZoomed((z) => !z)}
            />
          </div>

          {/* Lightbox Navigation Buttons */}
          {validImages.length > 1 && (
            <div
              className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={handlePrev}
                className="pointer-events-auto p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                aria-label="Hình trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="pointer-events-auto p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
                aria-label="Hình kế tiếp"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Lightbox Caption & Thumbnails */}
          <div
            className="absolute bottom-4 inset-x-0 flex flex-col items-center gap-2 text-center text-white/80 pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs uppercase tracking-widest font-mono text-[var(--accent)]">
              {productName}
            </p>
            {validImages.length > 1 && (
              <div className="flex gap-2 pointer-events-auto mt-1">
                {validImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === selectedIndex ? 'bg-[var(--accent)] w-6' : 'bg-white/40 hover:bg-white'
                    }`}
                    aria-label={`Chuyển tới ảnh ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

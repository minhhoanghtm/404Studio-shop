import { useState, useEffect, useRef } from 'react';

/**
 * Hook to manage smart hide/show behavior for Header & Chrome:
 * - Hides when scrolling down (> 8px)
 * - Re-appears immediately when scrolling up slightly (< -5px)
 * - Always visible near the top of the document (<= 60px)
 */
export function useHeaderScroll() {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          const diff = currentY - lastScrollY.current;

          // Always visible near top of page
          if (currentY <= 60) {
            setIsVisible(true);
          }
          // Scroll down by more than 8px -> hide header
          else if (diff > 8 && currentY > 100) {
            setIsVisible(false);
          }
          // Scroll up slightly (diff < -5px) -> show header immediately
          else if (diff < -5) {
            setIsVisible(true);
          }

          lastScrollY.current = currentY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return isVisible;
}

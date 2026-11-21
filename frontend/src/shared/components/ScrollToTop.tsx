import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 1. Reset standard window viewport scroll immediately
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });

    // 2. Lenis smooth scroll engine synchronization if active
    if (typeof window !== 'undefined' && (window as any).lenis?.scrollTo) {
      try {
        (window as any).lenis.scrollTo(0, { immediate: true });
      } catch {}
    }

    // 3. Recalculate GSAP ScrollTrigger positions and pin triggers
    if (typeof window !== 'undefined' && (window as any).ScrollTrigger?.refresh) {
      try {
        (window as any).ScrollTrigger.refresh();
      } catch {}
    }
  }, [pathname, search]);

  return null;
};

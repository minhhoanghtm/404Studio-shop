import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { MATERIAL_STUDY_BANNER } from '../data/editorialData';

interface FullBleedBannerProps {
  data?: typeof MATERIAL_STUDY_BANNER;
}

export const FullBleedBanner: React.FC<FullBleedBannerProps> = ({
  data = MATERIAL_STUDY_BANNER,
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [inView, setInView] = useState(false);

  // IntersectionObserver to trigger reveal animation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Parallax scroll effect
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let rafId = 0;
    const handleScroll = () => {
      const el = containerRef.current;
      const img = imgRef.current;
      if (!el || !img) return;

      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.top <= windowHeight && rect.bottom >= 0) {
        // Calculate offset based on scroll position relative to viewport center
        const offset = ((rect.top + rect.height / 2) - windowHeight / 2) * 0.12;
        img.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0) scale(1.12)`;
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="we-full-bleed-banner"
      id="material-study"
      aria-label="Material Study Banner"
    >
      {/* Parallax Background Image */}
      <div className="we-banner-media">
        <img
          ref={imgRef}
          src={data.image}
          alt="Cận cảnh kết cấu sợi và kiến trúc chất liệu Atelier Vérité"
          className="we-banner-img"
          loading="lazy"
        />
        <div className="we-banner-overlay" />
      </div>

      {/* Top Left: Chip "03" + Label Mono */}
      <div className="we-banner-top-badge">
        <span className="we-number-chip">{data.number}</span>
        <span className="we-banner-label">{data.label}</span>
      </div>

      {/* Bottom Left: 3-Line Heading Reveal + Description + Border Button */}
      <div className="we-banner-content">
        <h2 className="we-banner-heading">
          {data.headingLines.map((line, index) => (
            <span key={line} className="we-mask-line">
              <span
                className={`we-reveal-line ${inView ? 'is-revealed' : ''}`}
                style={{ transitionDelay: `${index * 140 + 80}ms` }}
              >
                {line}
              </span>
            </span>
          ))}
        </h2>

        <p className={`we-banner-desc we-fade-up we-stagger-3 ${inView ? 'is-in-view' : ''}`}>
          {data.description}
        </p>

        <div className={`we-banner-action we-fade-up we-stagger-4 ${inView ? 'is-in-view' : ''}`}>
          <Link to={data.ctaLink} className="we-banner-btn">
            {data.ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FullBleedBanner;

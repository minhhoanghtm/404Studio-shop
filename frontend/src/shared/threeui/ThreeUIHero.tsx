import React, { useState, useEffect } from 'react';
import { LiquidFormBackground } from '@designcodeio/threeui';
import { WebGLErrorBoundary } from './WebGLErrorBoundary';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { vi } from '../locales/vi/common';

interface ThreeUIHeroProps {
  title?: string;
  subtitle?: string;
  season?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export const ThreeUIHero: React.FC<ThreeUIHeroProps> = ({
  title = vi.hero.title,
  subtitle = vi.hero.subtitle,
  season = vi.hero.season,
  primaryCtaText = vi.hero.exploreCollection,
  primaryCtaLink = "/collections/noir-absolu",
  secondaryCtaText = vi.hero.discoverShop,
  secondaryCtaLink = "/products",
}) => {
  const [canRenderWebGL, setCanRenderWebGL] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setCanRenderWebGL(!!gl);
    } catch {
      setCanRenderWebGL(false);
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return (
    <section className="relative w-full h-[88vh] min-h-[640px] max-h-[1080px] overflow-hidden flex items-center justify-center bg-noir-950">
      {/* 3D WebGL Background using ThreeUI LiquidFormBackground */}
      <div className="absolute inset-0 z-0 pointer-events-auto opacity-70 dark:opacity-80 transition-opacity duration-1000">
        <WebGLErrorBoundary
          fallback={
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_35%,rgba(116,55,68,0.28),transparent_48%),linear-gradient(135deg,#171316,#281b21_58%,#121012)]" />
          }
        >
          {canRenderWebGL && !prefersReducedMotion ? (
            <LiquidFormBackground
              className="w-full h-full object-cover"
              speed={0.52}
              morph={1.15}
              noiseScale={0.82}
              mouseAmount={0.18}
              metal={0.95}
              camera={5.2}
              tintHue={338}
              tintAmount={0.2}
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(116,55,68,0.24)_0%,rgba(21,17,20,0.96)_70%)]" />
          )}
        </WebGLErrorBoundary>
      </div>

      {/* Atmospheric Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-noir-950/60 via-noir-950/10 to-noir-950/95 pointer-events-none z-[1]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_25%,rgba(10,8,10,0.56)_100%)] pointer-events-none z-[1]" />

      {/* Hero Foreground Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 text-center flex flex-col items-center justify-center">
        {/* Seasonal Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-champagne/30 bg-noir-900/60 backdrop-blur-md mb-6 animate-fade-in">
          <Sparkles className="w-3.5 h-3.5 text-champagne" />
          <span className="text-[11px] font-sans font-medium uppercase tracking-ultra text-champagne-light">
            {season}
          </span>
        </div>

        {/* Brand Display Wordmark */}
        <h1 className="font-display text-6xl sm:text-8xl md:text-9xl lg:text-[130px] font-normal tracking-[-0.045em] text-white mb-4 leading-[0.9] select-none drop-shadow-2xl">
          {title}
        </h1>

        {/* Editorial Subtitle */}
        <p className="max-w-2xl text-xs sm:text-sm md:text-base font-sans tracking-editorial uppercase text-platinum/90 dark:text-platinum/80 mb-10 text-center font-light">
          {subtitle}
        </p>

        {/* Action Group */}
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <Link
            to={primaryCtaLink}
            className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-noir-950 dark:bg-white dark:text-noir-950 text-xs uppercase tracking-[0.16em] font-semibold hover:bg-champagne hover:text-white dark:hover:text-noir-950 transition-all duration-300 shadow-xl w-full sm:w-auto"
          >
            <span>{primaryCtaText}</span>
            <ArrowUpRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <Link
            to={secondaryCtaLink}
            className="inline-flex items-center justify-center px-8 py-4 border border-white/25 hover:border-champagne text-white hover:text-champagne-light text-xs uppercase tracking-[0.16em] font-medium transition-all duration-300 backdrop-blur-sm bg-noir-900/35 w-full sm:w-auto"
          >
            <span>{secondaryCtaText}</span>
          </Link>
        </div>

        {/* Interactive WebGL Status Hint */}
        <div className="mt-12 hidden md:flex items-center gap-3 text-[10px] text-platinum-dark/70 tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-champagne inline-block" />
          <span>{vi.hero.interactiveHint}</span>
        </div>
      </div>

      {/* Decorative Bottom Corner Info */}
      <div className="absolute bottom-6 left-8 z-10 hidden lg:block text-left text-[11px] uppercase tracking-widest text-platinum-dark font-sans">
        <p className="text-white/80 font-medium">Paris • Milan • Tokyo</p>
        <p className="text-platinum-dark/60">48°51&apos;24&quot;N 2°21&apos;07&quot;E</p>
      </div>

      <div className="absolute bottom-6 right-8 z-10 hidden lg:block text-right text-[11px] uppercase tracking-widest text-platinum-dark font-sans">
        <p className="text-white/80 font-medium">Sản xuất hữu hạn</p>
        <p className="text-champagne/80 font-serif italic lowercase tracking-normal">édition limitée</p>
      </div>
    </section>
  );
};

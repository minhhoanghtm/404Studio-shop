import React, { useState, useEffect } from 'react';
import { ClothStudy } from '@designcodeio/threeui';
import { WebGLErrorBoundary } from './WebGLErrorBoundary';
import { useThemeStore } from '../../stores/useThemeStore';

interface ThreeClothStudyProps {
  title?: string;
  tagline?: string;
}

export const ThreeClothStudy: React.FC<ThreeClothStudyProps> = ({
  title = "THE ANATOMY OF TEXTILE MOTION",
  tagline = "Interactive computational simulation of bias-draped mulberry silk charmeuse.",
}) => {
  const { theme } = useThemeStore();
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
  }, []);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 bg-noir-900/80 backdrop-blur-md p-6 sm:p-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
            ThreeUI Interactive Study
          </span>
          <h3 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
            {title}
          </h3>
        </div>
        <p className="text-xs text-platinum-dark max-w-md font-sans leading-relaxed">
          {tagline}
        </p>
      </div>

      <div className="relative w-full h-[420px] rounded-xl overflow-hidden bg-noir-950 flex items-center justify-center">
        <WebGLErrorBoundary
          fallback={
            <div className="w-full h-full flex flex-col items-center justify-center bg-noir-950 p-6 text-center">
              <div className="w-12 h-12 rounded-full border border-champagne/40 flex items-center justify-center text-champagne mb-3">
                ✦
              </div>
              <p className="font-serif italic text-xl text-white">Silk Drape Archival Study</p>
              <p className="text-xs text-platinum-dark mt-1">Rendered at 30-momme organic density</p>
            </div>
          }
        >
          {canRenderWebGL && !prefersReducedMotion ? (
            <div className="w-full h-full transform scale-100 transition-transform duration-500">
              <ClothStudy
                mode={theme === 'dark' ? 'dark' : 'light'}
                scale={1}
                opacity={0.9}
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-noir-900 to-noir-950">
              <img
                src="https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1000&q=80"
                alt="Silk drape reference"
                className="w-full h-full object-cover opacity-60 filter grayscale contrast-125"
              />
            </div>
          )}
        </WebGLErrorBoundary>
        
        {/* Overlay instructions */}
        <div className="absolute bottom-4 left-4 z-10 px-3 py-1.5 rounded-full bg-noir-900/80 backdrop-blur-md border border-white/10 text-[10px] uppercase tracking-widest text-platinum-dark">
          Drag to deform textile • ThreeUI Cloth Physics
        </div>
      </div>
    </div>
  );
};

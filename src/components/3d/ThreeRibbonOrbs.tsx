import React, { useState, useEffect } from 'react';
import { BrandOrbs } from '@designcodeio/threeui';
import { WebGLErrorBoundary } from './WebGLErrorBoundary';

interface ThreeRibbonOrbsProps {
  className?: string;
}

export const ThreeRibbonOrbs: React.FC<ThreeRibbonOrbsProps> = ({ className = "h-80" }) => {
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
    <div className={`relative w-full rounded-2xl overflow-hidden bg-noir-950 border border-white/5 ${className}`}>
      <WebGLErrorBoundary
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-noir-900">
            <span className="text-xs uppercase tracking-widest text-platinum-dark">
              Atelier Vérité Visual Matrix
            </span>
          </div>
        }
      >
        {canRenderWebGL && !prefersReducedMotion ? (
          <BrandOrbs className="w-full h-full" />
        ) : (
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.15),transparent_70%)]" />
        )}
      </WebGLErrorBoundary>
    </div>
  );
};

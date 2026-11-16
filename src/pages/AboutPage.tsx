import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Compass, Shield, Feather } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-24">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            MAISON FONDÉE À PARIS • 2026
          </span>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
            Atelier Vérité
          </h1>
          <p className="font-serif italic text-xl sm:text-2xl text-champagne-light max-w-2xl mx-auto">
            &ldquo;In the architecture of garments, every millimeter of drape defines the human silhouette.&rdquo;
          </p>
        </div>

        {/* Hero Narrative Image */}
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-noir-900 border border-white/10 shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=85"
            alt="Atelier Vérité Parisian Workshop"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir-950/80 via-transparent to-transparent flex items-end p-8">
            <span className="text-xs uppercase tracking-widest text-white/70 font-sans">
              Salons Privés • 14 Place Vendôme, 75001 Paris
            </span>
          </div>
        </div>

        {/* Core Philosophy Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm text-platinum-dark leading-relaxed font-sans font-light">
          <div className="space-y-4">
            <h3 className="font-display text-2xl text-white">The Antidote to Ephemeral Fashion</h3>
            <p>
              Founded as an autonomous sanctuary for modern sartorial excellence, Atelier Vérité rejects the relentless churn of industrial fast fashion. We propose instead a permanent wardrobe founded upon brutalist architectural proportions, timeless bias cutting, and radical textile honesty.
            </p>
            <p>
              Our collections are conceived not as seasonal trends, but as evolutionary volumes. Each garment is assigned an archival registration number and crafted from raw materials that age with distinguished character.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-2xl text-white">The Mathematical Bias Cut</h3>
            <p>
              By aligning fabrics precisely across their 45-degree diagonal grain, our tailors liberate woven fibers from mechanical tension. The garment no longer imposes an artificial armor upon the anatomy; instead, it behaves as a liquid membrane that responds organically to every cadence of human movement.
            </p>
            <p>
              From 650-gram double-faced Italian virgin wools to 30-momme organic Lyon silk charmeuse, our textile weights are commissioned to our proprietary specifications.
            </p>
          </div>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-white/10">
          <div className="p-6 rounded-xl bg-noir-900 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-champagne/10 flex items-center justify-center text-champagne">
              <Compass className="w-5 h-5" />
            </div>
            <h4 className="font-display text-lg text-white">Architectural Rigor</h4>
            <p className="text-xs text-platinum-dark leading-relaxed font-sans">
              Proportions mapped according to golden ratio harmonies, cantilevered shoulders, and internal spiral steel corsetry.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-noir-900 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-champagne/10 flex items-center justify-center text-champagne">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="font-display text-lg text-white">Absolute Provenance</h4>
            <p className="text-xs text-platinum-dark leading-relaxed font-sans">
              100% traceable supply lines partnering exclusively with generational family-owned mills in Biella, Lyon, and Florence.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-noir-900 border border-white/5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-champagne/10 flex items-center justify-center text-champagne">
              <Feather className="w-5 h-5" />
            </div>
            <h4 className="font-display text-lg text-white">Zero Overproduction</h4>
            <p className="text-xs text-platinum-dark leading-relaxed font-sans">
              Strictly finite production runs. When a fabric batch is exhausted, the silhouette is retired to our permanent archive.
            </p>
          </div>
        </div>

        {/* Private Concierge CTA */}
        <div className="p-10 rounded-2xl bg-gradient-to-br from-noir-900 via-noir-850 to-noir-950 border border-white/10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-champagne/30 text-champagne text-[10px] uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Salon Privé Concierge
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-white">
            Schedule a Private Fitting in Paris or Tokyo
          </h2>
          <p className="text-xs sm:text-sm text-platinum-dark max-w-lg mx-auto font-sans">
            Our atelier doors on Place Vendôme are open for personalized styling, bespoke measurements, and private viewings of archived haute couture pieces.
          </p>
          <div>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest transition-colors shadow-lg"
            >
              <span>Request Private Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

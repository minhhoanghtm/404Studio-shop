import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, MoveRight, Eye, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import { ThreeUIHero } from '../components/3d/ThreeUIHero';
import { ThreeClothStudy } from '../components/3d/ThreeClothStudy';
import { ThreeRibbonOrbs } from '../components/3d/ThreeRibbonOrbs';
import { ProductCard } from '../components/product/ProductCard';
import { PRODUCTS } from '../data/products';
import { COLLECTIONS } from '../data/collections';
import { JOURNAL_ARTICLES } from '../data/journal';

export const HomePage: React.FC = () => {
  const [activeLookbookIndex, setActiveLookbookIndex] = useState(0);

  const newArrivals = PRODUCTS.filter((p) => p.isNewArrival).slice(0, 4);
  const trendingProducts = PRODUCTS.filter((p) => p.isTrending).slice(0, 4);
  const featuredCollection = COLLECTIONS[0]; // Noir Absolu

  const lookbookItems = [
    {
      title: 'Monolithic Wool Silhouette',
      caption: 'Look 01 • Double-faced virgin wool with sculpted shoulder line',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=85',
      productSlug: 'sculpted-wool-coat',
    },
    {
      title: 'Liquid Bias Charmeuse',
      caption: 'Look 04 • Cascading 30-momme organic silk with cord back',
      image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=85',
      productSlug: 'liquid-silk-evening-dress',
    },
    {
      title: 'Deconstructed Tailoring',
      caption: 'Look 09 • Relaxed soft-shoulder double-breasted suit',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85',
      productSlug: 'oversized-double-breasted-suit',
    },
    {
      title: 'Architectural Box Calfskin',
      caption: 'Look 14 • Sculpted trapezoid tote with ebonized oak handle',
      image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=85',
      productSlug: 'obsidian-leather-tote',
    },
  ];

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen">
      {/* SECTION 3: Immersive ThreeUI Hero */}
      <ThreeUIHero
        title="VÉRITÉ"
        subtitle="AUTUMN / WINTER 2026 ARCHITECTURAL COUTURE"
        season="RUNWAY PRESENTATION VOL. VII"
        primaryCtaText="Explore Runway"
        primaryCtaLink="/collections/noir-absolu"
        secondaryCtaText="Shop Ready-to-Wear"
        secondaryCtaLink="/shop"
      />

      {/* SECTION 4: New Season Introduction */}
      <section className="relative py-24 sm:py-32 px-6 sm:px-8 border-b border-white/10 bg-noir-900/40">
        <div className="max-w-5xl mx-auto text-center">
          <span className="text-xs uppercase tracking-widest text-champagne font-semibold block mb-4">
            Maison Manifesto
          </span>
          <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl text-white tracking-wide leading-tight mb-8">
            &ldquo;We do not decorate the body; we sculpt the space that surrounds it.&rdquo;
          </h2>
          <p className="text-sm sm:text-base text-platinum-dark max-w-2xl mx-auto font-sans font-light leading-relaxed mb-10">
            Atelier Vérité operates at the intersection of architectural discipline and organic human grace. Every piece is drafted by hand on Parisian dress forms, cut on the true bias, and tailored in single-batch editions using centenary European looms.
          </p>
          <div className="flex items-center justify-center gap-8 text-xs uppercase tracking-widest text-white/50">
            <span>Virgin Cashmere</span>
            <span className="w-1.5 h-1.5 rounded-full bg-champagne" />
            <span>30-Momme Silk</span>
            <span className="w-1.5 h-1.5 rounded-full bg-champagne" />
            <span>Vegetable Hides</span>
          </div>
        </div>
      </section>

      {/* SECTION 5: New Arrivals */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
              Curated First Edition
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
              New Arrivals
            </h2>
          </div>
          <Link
            to="/shop"
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white hover:text-champagne transition-colors"
          >
            <span>View All Additions</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* SECTION 6: Shop By Category */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
        <div className="text-center mb-16">
          <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-2">
            The Wardrobe Anatomy
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
            Shop By Discipline
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Women */}
          <Link
            to="/shop/women"
            className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-noir-900 border border-white/10"
          >
            <img
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85"
              alt="Women's Collection"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-8">
              <span className="text-[10px] uppercase tracking-widest text-champagne font-semibold mb-1">
                Volume I
              </span>
              <h3 className="font-display text-2xl text-white">Women&apos;s Ready-to-Wear</h3>
              <p className="text-xs text-white/70 mt-1 mb-4 font-sans font-light">
                Sculpted overcoats, bias-draped column gowns, and corseted tailleurs.
              </p>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-champagne group-hover:underline">
                <span>Explore Discipline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>

          {/* Men */}
          <Link
            to="/shop/men"
            className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-noir-900 border border-white/10"
          >
            <img
              src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1000&q=85"
              alt="Men's Tailoring"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-8">
              <span className="text-[10px] uppercase tracking-widest text-champagne font-semibold mb-1">
                Volume II
              </span>
              <h3 className="font-display text-2xl text-white">Men&apos;s Tailoring</h3>
              <p className="text-xs text-white/70 mt-1 mb-4 font-sans font-light">
                Deconstructed double-breasted suits, heavy rollnecks, and shearling.
              </p>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-champagne group-hover:underline">
                <span>Explore Discipline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>

          {/* Accessories */}
          <Link
            to="/shop/accessories"
            className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-noir-900 border border-white/10"
          >
            <img
              src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=85"
              alt="Artisanal Accessories"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-8">
              <span className="text-[10px] uppercase tracking-widest text-champagne font-semibold mb-1">
                Volume III
              </span>
              <h3 className="font-display text-2xl text-white">Leather & Objects</h3>
              <p className="text-xs text-white/70 mt-1 mb-4 font-sans font-light">
                Box calfskin totes with carved oak handles, boots, and molten vermeil.
              </p>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-champagne group-hover:underline">
                <span>Explore Discipline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* SECTION 7: Featured Collection Spotlight */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-champagne/30 text-champagne text-[10px] uppercase tracking-widest">
              <Sparkles className="w-3 h-3" /> Runway Feature
            </div>
            <h2 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
              {featuredCollection.title}
            </h2>
            <p className="font-serif italic text-lg sm:text-xl text-champagne-light">
              {featuredCollection.editorialQuote}
            </p>
            <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
              {featuredCollection.description}
            </p>
            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                to={`/collections/${featuredCollection.slug}`}
                className="px-8 py-4 bg-white text-noir-950 font-semibold text-xs uppercase tracking-widest hover:bg-champagne transition-colors"
              >
                View Runway Lookbook
              </Link>
              <Link
                to="/collections"
                className="px-8 py-4 border border-white/20 text-white font-medium text-xs uppercase tracking-widest hover:border-champagne transition-colors"
              >
                All Runway Archives
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <img
                src={featuredCollection.heroImage}
                alt={featuredCollection.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-noir-950/80 backdrop-blur-md border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-champagne font-mono">
                    Season {featuredCollection.year}
                  </span>
                  <p className="text-xs text-white font-serif">{featuredCollection.subtitle}</p>
                </div>
                <Link
                  to={`/collections/${featuredCollection.slug}`}
                  className="p-2 rounded-full bg-champagne text-noir-950 hover:bg-white transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: Editorial Campaign Banner */}
      <section className="relative w-full py-32 px-6 sm:px-8 overflow-hidden bg-noir-950 border-b border-white/10">
        <div className="absolute inset-0 opacity-20">
          <ThreeRibbonOrbs className="h-full" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <span className="text-[11px] font-mono uppercase tracking-ultra text-champagne">
            FALL / WINTER 2026 CAMPAIGN
          </span>
          <h2 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
            THE ARCHITECTURE OF SILENCE
          </h2>
          <p className="text-sm sm:text-base text-platinum-dark max-w-xl mx-auto font-sans leading-relaxed">
            Captured on the Brutalist geometry of London and the Poissy countryside. A radical celebration of monolithic scale and pure silhouette.
          </p>
          <div className="pt-4">
            <Link
              to="/journal/the-architecture-of-draping"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-champagne text-champagne hover:bg-champagne hover:text-noir-950 text-xs font-semibold uppercase tracking-widest transition-all duration-300"
            >
              <span>Read Editorial Monograph</span>
              <MoveRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 9: Trending Products */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
              Patron Favorites
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
              Trending Silhouettes
            </h2>
          </div>
          <Link
            to="/shop"
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white hover:text-champagne transition-colors"
          >
            <span>Explore All 32 Pieces</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* SECTION 10: Interactive Lookbook with ThreeUI Cloth Study */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10 space-y-16">
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
                Visual Curation
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
                Interactive Runway Lookbook
              </h2>
            </div>
            <p className="text-xs text-platinum-dark max-w-md">
              Select runway looks below to inspect high-resolution tailoring details and discover their corresponding atelier items.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Active Look Stage */}
            <div className="lg:col-span-7 relative aspect-[4/5] rounded-2xl overflow-hidden bg-noir-900 border border-white/10">
              <img
                src={lookbookItems[activeLookbookIndex].image}
                alt={lookbookItems[activeLookbookIndex].title}
                className="w-full h-full object-cover transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                <span className="text-[10px] font-mono text-champagne uppercase tracking-widest">
                  {lookbookItems[activeLookbookIndex].caption}
                </span>
                <h3 className="font-display text-2xl text-white mt-1">
                  {lookbookItems[activeLookbookIndex].title}
                </h3>
                <Link
                  to={`/products/${lookbookItems[activeLookbookIndex].productSlug}`}
                  className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-champagne hover:underline"
                >
                  <span>Acquire Garment</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Thumbnail Navigation */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              {lookbookItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveLookbookIndex(idx)}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    activeLookbookIndex === idx
                      ? 'bg-white/10 border-champagne shadow-lg'
                      : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}
                >
                  <img
                    src={item.image}
                    alt=""
                    className="w-16 h-20 object-cover rounded-lg flex-shrink-0 bg-noir-900"
                  />
                  <div>
                    <span className="text-[10px] font-mono text-champagne uppercase">
                      Look {String(idx + 1).padStart(2, '0')}
                    </span>
                    <h4 className="font-serif text-base text-white font-medium">{item.title}</h4>
                    <p className="text-[11px] text-platinum-dark mt-0.5 line-clamp-1">
                      {item.caption}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ThreeUI Cloth Physics Study */}
        <ThreeClothStudy />
      </section>

      {/* SECTION 11: Brand Philosophy & White-Glove Pillars */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-2">
            The Atelier Standard
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
            Couture Craftsmanship Pillars
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
          <div className="p-8 rounded-2xl bg-noir-900 border border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-champagne/10 border border-champagne/30 flex items-center justify-center text-champagne">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl text-white">White-Glove Courier</h3>
            <p className="text-xs text-platinum-dark leading-relaxed font-sans">
              Complimentary worldwide delivery on curations over $500. Shipped in signature cedar boxes with custom brass garment hangers and breathable dust shields.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-noir-900 border border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-champagne/10 border border-champagne/30 flex items-center justify-center text-champagne">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl text-white">Numbered Editions</h3>
            <p className="text-xs text-platinum-dark leading-relaxed font-sans">
              Every creation features an internal hand-stitched silk plaque bearing its individual edition number, artisan seal, and French registry certificate.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-noir-900 border border-white/5 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-champagne/10 border border-champagne/30 flex items-center justify-center text-champagne">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl text-white">Complimentary Returns</h3>
            <p className="text-xs text-platinum-dark leading-relaxed font-sans">
              Experience the garments in the comfort of your home with our 30-day return concierge. Prepaid return courier dispatch is included with every delivery.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 12: Journal & Editorial Stories */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase block mb-1">
              Editorial Dispatches
            </span>
            <h2 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
              The Atelier Journal
            </h2>
          </div>
          <Link
            to="/journal"
            className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-white hover:text-champagne transition-colors"
          >
            <span>Read All Articles</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {JOURNAL_ARTICLES.map((article) => (
            <Link
              key={article.id}
              to={`/journal/${article.slug}`}
              className="group flex flex-col space-y-4"
            >
              <div className="aspect-[16/10] rounded-xl overflow-hidden bg-noir-900 border border-white/10">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div>
                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-champagne font-mono">
                  <span>{article.category}</span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
                <h3 className="font-serif text-lg sm:text-xl text-white group-hover:text-champagne transition-colors mt-1 font-medium">
                  {article.title}
                </h3>
                <p className="text-xs text-platinum-dark mt-2 font-sans font-light line-clamp-2 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

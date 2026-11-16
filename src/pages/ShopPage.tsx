import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ProductCard } from '../components/product/ProductCard';
import { FilterBar, SortOption } from '../components/product/FilterBar';
import { PRODUCTS } from '../data/products';
import { Category } from '../types';
import { Sparkles, SlidersHorizontal } from 'lucide-react';

interface ShopPageProps {
  initialCategory?: Category | 'all';
}

export const ShopPage: React.FC<ShopPageProps> = ({ initialCategory = 'all' }) => {
  const { category: routeCategory } = useParams<{ category?: string }>();
  
  const activeCategory: Category | 'all' = 
    (routeCategory as Category) || initialCategory;

  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>(activeCategory);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('curated');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Sync category if prop changes
  React.useEffect(() => {
    if (routeCategory) {
      setSelectedCategory(routeCategory as Category);
    } else if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [routeCategory, initialCategory]);

  // Extract available subcategories based on current category selection
  const availableSubCategories = useMemo(() => {
    const list = selectedCategory === 'all'
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.category === selectedCategory);
    return Array.from(new Set(list.map((p) => p.subCategory)));
  }, [selectedCategory]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...PRODUCTS];

    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (selectedSubCategory) {
      result = result.filter((p) => p.subCategory === selectedSubCategory);
    }

    if (onlyInStock) {
      result = result.filter((p) =>
        p.variants.some((v) => v.sizes.some((s) => s.inStock))
      );
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0));
        break;
      case 'curated':
      default:
        // Featured and trending first
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return result;
  }, [selectedCategory, selectedSubCategory, onlyInStock, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getCategoryTitle = () => {
    switch (selectedCategory) {
      case 'women':
        return "Women's Ready-to-Wear";
      case 'men':
        return "Men's Tailoring & Outerwear";
      case 'accessories':
        return "Artisanal Leather Goods & Objects";
      case 'couture':
        return "Haute Couture & Sur Mesure";
      default:
        return "The Atelier Archive";
    }
  };

  const getCategoryDescription = () => {
    switch (selectedCategory) {
      case 'women':
        return "Architectural overcoats, bias-draped mulberry silk gowns, and structured corseted tailoring designed in our Paris salon.";
      case 'men':
        return "Deconstructed soft-shoulder tailoring, 4-ply Mongolian cashmere, and Spanish merino shearling crafted by master artisans.";
      case 'accessories':
        return "French box calfskin bags with carved ebonized oak handles, Goodyear-welted horsehide boots, and lost-wax cast 18k gold vermeil.";
      default:
        return "A complete curation of Autumn/Winter 2026 runway creations, limited editions, and core wardrobe silhouettes.";
    }
  };

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Editorial Header */}
        <div className="text-center max-w-3xl mx-auto pt-6 pb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-champagne/30 text-champagne text-[10px] uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Paris Salon Collection
          </div>
          <h1 className="font-display text-4xl sm:text-6xl text-white tracking-wide">
            {getCategoryTitle()}
          </h1>
          <p className="text-xs sm:text-sm text-platinum-dark leading-relaxed font-sans font-light">
            {getCategoryDescription()}
          </p>
        </div>

        {/* Filter & Sorting Bar */}
        <FilterBar
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setCurrentPage(1);
          }}
          selectedSubCategory={selectedSubCategory}
          onSelectSubCategory={(sub) => {
            setSelectedSubCategory(sub);
            setCurrentPage(1);
          }}
          availableSubCategories={availableSubCategories}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onlyInStock={onlyInStock}
          onToggleInStock={setOnlyInStock}
          totalCount={filteredProducts.length}
        />

        {/* Products Grid */}
        {paginatedProducts.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl text-white italic mb-2">No matching silhouettes found</p>
            <p className="text-xs text-platinum-dark mb-6">Try adjusting your filters or resetting the category selection.</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSubCategory(null);
                setOnlyInStock(false);
              }}
              className="px-6 py-3 bg-champagne text-noir-950 font-semibold text-xs uppercase tracking-widest"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-16 pt-8 border-t border-white/10 flex items-center justify-between text-xs font-sans">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 border border-white/15 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-champagne"
            >
              Previous Page
            </button>

            <span className="font-mono text-platinum-dark">
              Page {currentPage} of {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-4 py-2 border border-white/15 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:border-champagne"
            >
              Next Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

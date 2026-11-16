import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, Category } from '../../../shared/types';
import { PRODUCTS } from '../../../shared/data/products';

export type SortOption = 'curated' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export const useProductFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') as Category | null;

  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>(
    categoryParam || 'all'
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('curated');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setSelectedSubCategory(null);
      setCurrentPage(1);
    } else {
      setSelectedCategory('all');
    }
  }, [categoryParam]);

  const handleSelectCategory = (cat: Category | 'all') => {
    setSelectedCategory(cat);
    setSelectedSubCategory(null);
    setCurrentPage(1);
    if (cat === 'all') {
      searchParams.delete('category');
      setSearchParams(searchParams);
    } else {
      searchParams.set('category', cat);
      setSearchParams(searchParams);
    }
  };

  const availableSubCategories = useMemo(() => {
    const list =
      selectedCategory === 'all'
        ? PRODUCTS
        : PRODUCTS.filter((p) => p.category === selectedCategory);
    return Array.from(new Set(list.map((p) => p.subCategory)));
  }, [selectedCategory]);

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
        result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        break;
    }

    return result;
  }, [selectedCategory, selectedSubCategory, onlyInStock, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return {
    selectedCategory,
    handleSelectCategory,
    selectedSubCategory,
    setSelectedSubCategory,
    sortBy,
    setSortBy,
    onlyInStock,
    setOnlyInStock,
    currentPage,
    setCurrentPage,
    totalPages,
    totalCount: filteredProducts.length,
    availableSubCategories,
    paginatedProducts,
    resetFilters: () => {
      setSelectedCategory('all');
      setSelectedSubCategory(null);
      setSortBy('curated');
      setOnlyInStock(false);
      setCurrentPage(1);
      searchParams.delete('category');
      setSearchParams(searchParams);
    },
  };
};

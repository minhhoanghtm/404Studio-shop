import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, Category } from '../../../shared/types';
import { productsApi } from '../../../shared/api';
import { adaptBackendProduct } from '../../../shared/utils/productAdapter';

export type SortOption = 'curated' | 'price-asc' | 'price-desc' | 'rating' | 'newest';

export const useProductFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') as Category | null;

  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>(
    categoryParam || 'all'
  );
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('curated');
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  useEffect(() => {
    let cancelled = false;
    async function loadProducts() {
      setIsLoading(true);
      try {
        const res = await productsApi.getProducts({ limit: 100 });
        if (cancelled) return;
        const rawList = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.products)
          ? (res.data as any).products
          : Array.isArray(res)
          ? res
          : [];
        if (rawList.length > 0) {
          const adapted = rawList.map(adaptBackendProduct);
          setDbProducts(adapted);
        } else {
          setDbProducts([]);
        }
      } catch (err) {
        if (!cancelled) setDbProducts([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

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
        ? dbProducts
        : dbProducts.filter((p) => p.category === selectedCategory);
    return Array.from(new Set(list.map((p) => p.subCategory).filter(Boolean)));
  }, [selectedCategory, dbProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...dbProducts];

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
  }, [dbProducts, selectedCategory, selectedSubCategory, onlyInStock, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
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
    isLoading,
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

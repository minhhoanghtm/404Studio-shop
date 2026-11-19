import React from 'react';
import { useProductFilters } from './hooks/useProductFilters';
import { ProductFilterBar } from './components/ProductFilterBar';
import { ProductGrid } from './components/ProductGrid';
import { Sparkles } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const {
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
    totalCount,
    availableSubCategories,
    paginatedProducts,
    resetFilters,
  } = useProductFilters();

  const getCategoryHeader = () => {
    switch (selectedCategory) {
      case 'women':
        return {
          title: 'Thời trang Nữ May sẵn',
          subtitle: 'Những đường cắt xéo toán học, lụa 30-momme và áo khoác len nguyên chất.',
        };
      case 'men':
        return {
          title: 'Thời trang Nam May đo & Áo khoác',
          subtitle: 'Kỹ nghệ may đo Savile Row giao hòa cùng chủ nghĩa tối giản kiến trúc Paris.',
        };
      case 'accessories':
        return {
          title: 'Đồ da Thủ công & Vật phẩm Điêu khắc',
          subtitle: 'Thuộc da thảo mộc truyền thống, hoàn thiện cạnh thủ công và đánh số định danh.',
        };
      case 'couture':
        return {
          title: 'Haute Couture & Độc bản May đo',
          subtitle: 'Sản phẩm may đo riêng theo số đo nhân trắc học, chế tác tại xưởng Paris.',
        };
      case 'all':
      default:
        return {
          title: 'Kho Lưu Trữ Sản Phẩm Toàn Diện',
          subtitle: 'Khám phá các thiết kế trình diễn sàn runway Thu/Đông 2026 và các ấn phẩm giới hạn.',
        };
    }
  };

  const header = getCategoryHeader();

  return (
    <div className="w-full bg-noir-950 text-white min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Page Editorial Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Danh mục lưu trữ Atelier Vérité
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-white tracking-wide">
            {header.title}
          </h1>
          <p className="text-xs sm:text-sm text-platinum-dark font-sans max-w-xl mx-auto font-light leading-relaxed">
            {header.subtitle}
          </p>
        </div>

        {/* Filter Controls */}
        <ProductFilterBar
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          selectedSubCategory={selectedSubCategory}
          onSelectSubCategory={setSelectedSubCategory}
          availableSubCategories={availableSubCategories}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onlyInStock={onlyInStock}
          onToggleInStock={setOnlyInStock}
          totalCount={totalCount}
        />

        {/* Product Grid */}
        <ProductGrid
          products={paginatedProducts}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onResetFilters={resetFilters}
        />
      </div>
    </div>
  );
};

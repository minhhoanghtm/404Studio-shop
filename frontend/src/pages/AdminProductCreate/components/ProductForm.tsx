import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Plus, X, Image as ImageIcon, Tag, CheckCircle2, AlertCircle } from 'lucide-react';
import { AdminProductFormValues, CategoryOption, ProductVariantItem } from '../../AdminProducts/types';
import { VariantTable } from './VariantTable';
import { categoriesApi } from '@/shared/api';
import { formatCurrency } from '@/shared/utils/formatters';

interface ProductFormProps {
  initialValues?: Partial<AdminProductFormValues>;
  onSubmit: (values: AdminProductFormValues) => Promise<void>;
  isLoading?: boolean;
  isEdit?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialValues,
  onSubmit,
  isLoading = false,
  isEdit = false,
}) => {
  const navigate = useNavigate();

  // Basic Information
  const [name, setName] = useState(initialValues?.name || '');
  const [categoryId, setCategoryId] = useState(initialValues?.category_id || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [oldPrice, setOldPrice] = useState(initialValues?.old_price || 45000000);
  const [newPrice, setNewPrice] = useState(initialValues?.new_price || 42000000);
  const [weight, setWeight] = useState(initialValues?.weight || 0.5);
  const [isActive, setIsActive] = useState(initialValues?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(initialValues?.is_featured ?? false);

  // Images
  const [displayProduct, setDisplayProduct] = useState<string[]>(
    initialValues?.displayProduct && initialValues.displayProduct.length > 0
      ? initialValues.displayProduct
      : ['https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80']
  );
  const [newImageUrl, setNewImageUrl] = useState('');

  // Variants & Inventory
  const [variants, setVariants] = useState<ProductVariantItem[]>(
    initialValues?.variants || [
      {
        color: 'Đen (Noir)',
        size: 'S',
        stock: 10,
        image_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80',
        price: initialValues?.new_price || 42000000,
      },
      {
        color: 'Đen (Noir)',
        size: 'M',
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80',
        price: initialValues?.new_price || 42000000,
      },
      {
        color: 'Trắng (Ivory)',
        size: 'M',
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80',
        price: initialValues?.new_price || 42000000,
      },
    ]
  );

  // Categories list
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The edit page fetches asynchronously; keep local fields aligned if its source changes.
  useEffect(() => {
    if (!initialValues) return;
    setName(initialValues.name || '');
    setCategoryId(initialValues.category_id || '');
    setDescription(initialValues.description || '');
    setOldPrice(initialValues.old_price ?? 45000000);
    setNewPrice(initialValues.new_price ?? 42000000);
    setWeight(initialValues.weight ?? 0.5);
    setIsActive(initialValues.is_active ?? true);
    setIsFeatured(initialValues.is_featured ?? false);
    if (initialValues.displayProduct?.length) setDisplayProduct(initialValues.displayProduct);
    if (initialValues.variants) setVariants(initialValues.variants);
  }, [initialValues]);

  // Compute Total Stock automatically: TotalStock = SUM(VariantStock)
  const totalStock = variants.length > 0
    ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
    : Number(initialValues?.stock) || 0;

  const categoryName = categories.find((category) => (category._id || category.id) === categoryId)?.name?.toLowerCase() || '';
  const categorySizes = categoryName.includes('giày') ? ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45']
    : categoryName.includes('jean') || categoryName.includes('kaki') ? ['28', '29', '30', '31', '32', '33', '34', '35', '36']
    : categoryName.includes('phụ kiện') || categoryName.includes('accessor') ? ['Free Size']
    : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  // Load real categories from backend
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoriesApi.getCategories();
        const cats = res?.data;
        if (cats && Array.isArray(cats)) {
          setCategories(cats);
          if (cats.length > 0) {
            const firstId = cats[0]._id || cats[0].id || '';
            setCategoryId((prev) => prev || firstId);
          }
        }
      } catch {
        // Fallback standard luxury categories if network disconnected
        const fallback = [
          { _id: '64f1a2b00000000000000001', name: 'Áo Khoác Haute', slug: 'outerwear' },
          { _id: '64f1a2b00000000000000002', name: 'Đầm Dạ Tiệc', slug: 'gowns' },
          { _id: '64f1a2b00000000000000003', name: 'Đồ May Đo Nam', slug: 'tailoring' },
          { _id: '64f1a2b00000000000000004', name: 'Phụ Kiện Da Thật', slug: 'accessories' },
        ];
        setCategories(fallback);
        setCategoryId((prev) => prev || '64f1a2b00000000000000001');
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCats();
  }, []);

  // Add new image URL
  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setDisplayProduct([...displayProduct, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    if (displayProduct.length > 1) {
      setDisplayProduct(displayProduct.filter((_, idx) => idx !== index));
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Tên sản phẩm là bắt buộc.');
      return;
    }

    if (!categoryId) {
      setErrorMessage('Vui lòng chọn danh mục cho sản phẩm.');
      return;
    }

    if (newPrice < 0 || oldPrice < 0) {
      setErrorMessage('Giá bán sản phẩm không được là số âm.');
      return;
    }

    if (newPrice > oldPrice) {
      setErrorMessage('Giá bán khuyến mãi không được lớn hơn giá niêm yết.');
      return;
    }

    // Validate variants
    if (variants.length > 0) {
      for (const v of variants) {
        if (!v.color.trim()) {
          setErrorMessage('Tất cả các biến thể phải có thông tin màu sắc.');
          return;
        }
        if (v.stock < 0 || isNaN(v.stock)) {
          setErrorMessage(`Số lượng tồn kho của biến thể ${v.color} không hợp lệ.`);
          return;
        }
      }

      // Check duplicate color + size
      const pairSet = new Set<string>();
      for (const v of variants) {
        const key = `${v.color.trim().toLowerCase()}_${v.size.trim().toLowerCase()}`;
        if (pairSet.has(key)) {
          setErrorMessage(`Tổ hợp Màu "${v.color}" và Cỡ "${v.size}" bị trùng lặp. Mỗi biến thể phải là một tổ hợp duy nhất.`);
          return;
        }
        pairSet.add(key);
      }
    }

    // Prepare payload conforming 100% to backend schema
    const primaryImage = displayProduct[0] || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80';
    const sanitizedVariants = variants.map((v) => ({
      ...v,
      stock: Math.max(0, Math.floor(v.stock)),
      image_url: v.image_url || primaryImage,
    }));

    const formValues: AdminProductFormValues = {
      id: initialValues?.id || initialValues?._id,
      _id: initialValues?._id || initialValues?.id,
      name: name.trim(),
      // Kept only for local variant SKU previews; it is never submitted by this form.
      slug: initialValues?.slug || '',
      category_id: categoryId,
      description: description.trim(),
      old_price: Number(oldPrice),
      new_price: Number(newPrice),
      stock: totalStock,
      weight: Number(weight) || 0.5,
      is_active: isActive,
      is_featured: isFeatured,
      displayProduct,
      variants: sanitizedVariants,
    };

    try {
      await onSubmit(formValues);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Có lỗi xảy ra khi lưu sản phẩm. Vui lòng kiểm tra lại dữ liệu.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="inline-flex items-center gap-2 text-xs uppercase font-medium text-platinum-dark hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay Lại Danh Sách Sản Phẩm</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-4 py-2 border border-white/10 hover:border-white/20 text-xs text-white rounded-sm transition-colors"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-champagne text-noir-950 font-semibold text-xs uppercase tracking-wider rounded-sm hover:bg-champagne/90 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Đang Lưu...' : isEdit ? 'Cập Nhật Sản Phẩm' : 'Khởi Tạo Sản Phẩm'}</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <Tag className="w-4 h-4 text-champagne" />
          <h3 className="text-xs uppercase tracking-wider text-white font-semibold">
            1. Thông Tin Cơ Bản Sản Phẩm
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs text-platinum-light font-medium block">
              Tên Sản Phẩm Thời Trang <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Áo Khoác Dạ Len Biella Cashmere Coat..."
              className="w-full px-3 py-2.5 text-xs bg-noir-950 border border-white/10 rounded-sm text-white focus:border-champagne focus:outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs text-platinum-light font-medium block">
              Danh Mục Phân Loại <span className="text-red-400">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={categoriesLoading}
              className="w-full px-3 py-2.5 text-xs bg-noir-950 border border-white/10 rounded-sm text-white focus:border-champagne focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat._id || cat.id} value={cat._id || cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing: Old Price (MSRP) & New Price (Selling) */}
          <div className="space-y-1.5">
            <label className="text-xs text-platinum-light font-medium block">
              Giá Niêm Yết Gốc (VNĐ)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={oldPrice}
                onChange={(e) => setOldPrice(Math.max(0, parseFloat(e.target.value || '0')))}
                className="w-full pl-3 pr-16 py-2.5 text-xs bg-noir-950 border border-white/10 rounded-sm text-white font-mono focus:border-champagne focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-platinum-dark font-mono">
                {formatCurrency(oldPrice)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-platinum-light font-medium block">
              Giá Bán Khuyến Mãi Thực Tế (VNĐ) <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={newPrice}
                onChange={(e) => setNewPrice(Math.max(0, parseFloat(e.target.value || '0')))}
                className="w-full pl-3 pr-16 py-2.5 text-xs bg-noir-950 border border-white/10 rounded-sm text-champagne font-mono font-bold focus:border-champagne focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-platinum-dark font-mono">
                {formatCurrency(newPrice)}
              </span>
            </div>
          </div>

          {/* Weight */}
          <div className="space-y-1.5">
            <label className="text-xs text-platinum-light font-medium block">
              Trọng Lượng Đóng Gói (kg)
            </label>
            <input
              type="text"
              inputMode="decimal"
              min="0.1"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(Math.max(0.1, Number.parseFloat(e.target.value.replace(',', '.')) || 0.5))}
              className="w-full px-3 py-2.5 text-xs bg-noir-950 border border-white/10 rounded-sm text-white font-mono focus:border-champagne focus:outline-none"
            />
          </div>

          {/* Status Switches */}
          <div className="flex items-center gap-6 pt-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded bg-noir-950 border-white/20 accent-champagne focus:ring-champagne focus:ring-1"
              />
              <span>Đang Mở Bán (Active)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded bg-noir-950 border-white/20 accent-champagne focus:ring-champagne focus:ring-1"
              />
              <span>Sản Phẩm Tiêu Biểu (Featured Runway)</span>
            </label>
          </div>

          {/* Description */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs text-platinum-light font-medium block">
              Mô Tả Chi Tiết & Tinh Thần Thiết Kế
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chất liệu lụa tơ tằm dệt tay vùng Lyon, canh xéo kiến trúc, chi tiết ve áo thủ công..."
              className="w-full px-3 py-2.5 text-xs bg-noir-950 border border-white/10 rounded-sm text-white focus:border-champagne focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Product Images Section */}
      <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-white/10">
          <ImageIcon className="w-4 h-4 text-champagne" />
          <h3 className="text-xs uppercase tracking-wider text-white font-semibold">
            2. Thư Viện Hình Ảnh Sản Phẩm (Lookbook & Gallery)
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder="Dán đường dẫn ảnh HTTPS (VD: https://images.unsplash.com/...)..."
              className="flex-1 px-3 py-2 text-xs bg-noir-950 border border-white/10 rounded-sm text-white focus:border-champagne focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddImage}
              className="px-4 py-2 bg-white/10 hover:bg-white/15 text-xs text-white rounded-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Ảnh</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {displayProduct.map((url, idx) => (
              <div key={idx} className="relative group rounded-sm overflow-hidden border border-white/10 aspect-[3/4] bg-noir-950">
                <img
                  src={url}
                  alt={`Product img ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {idx === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-champagne text-noir-950 font-bold text-[9px] uppercase tracking-wider rounded-sm">
                    Ảnh Chính
                  </span>
                )}
                {displayProduct.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-noir-950/80 text-white/70 hover:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa ảnh này"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Variant & Inventory Management Section */}
      <VariantTable
        variants={variants}
        onChange={setVariants}
        basePrice={newPrice}
        productSlug={initialValues?.slug || name}
        allowedSizes={categorySizes}
        defaultImageUrl={displayProduct[0]}
      />

      {/* Total Stock Summary & Final Confirmation Card */}
      <div className="p-6 bg-noir-900 border border-white/10 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-950/80 border border-emerald-800 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-white">
              Sẵn Sàng Lưu Trữ Dữ Liệu Sản Phẩm
            </h4>
            <p className="text-[11px] text-platinum-dark mt-0.5">
              Tổng tồn kho tự động được tính là <span className="font-mono font-bold text-emerald-400">{totalStock}</span> sản phẩm qua <span className="font-mono text-champagne">{variants.length}</span> biến thể độc lập.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto px-8 py-3 bg-champagne text-noir-950 font-semibold text-xs uppercase tracking-widest rounded-sm hover:bg-champagne/90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-champagne/10 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Đang Xử Lý...' : isEdit ? 'Cập Nhật Sản Phẩm' : 'Hoàn Tất & Lưu Sản Phẩm'}</span>
        </button>
      </div>
    </form>
  );
};

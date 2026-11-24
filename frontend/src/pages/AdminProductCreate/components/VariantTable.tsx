import React, { useState } from 'react';
import { Plus, Trash2, Layers, AlertCircle, Sparkles, Image as ImageIcon, Info, Copy } from 'lucide-react';
import { ProductVariantItem, DEFAULT_SIZES, DEFAULT_COLORS } from '../../AdminProducts/types';
import { formatCurrency } from '@/shared/utils/formatters';
import { StatusToggle } from '@/shared/components';
import { DeleteActionButton } from '@/shared/components/AdminActionButton';

interface VariantTableProps {
  variants: ProductVariantItem[];
  onChange: (variants: ProductVariantItem[]) => void;
  basePrice: number;
  productSlug: string;
  allowedSizes?: string[];
  defaultImageUrl?: string;
}

export const VariantTable: React.FC<VariantTableProps> = ({
  variants,
  onChange,
  basePrice,
  productSlug,
  allowedSizes = DEFAULT_SIZES,
  defaultImageUrl = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80',
}) => {
  const [newColor, setNewColor] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(allowedSizes.slice(0, 3));
  const [defaultStock, setDefaultStock] = useState<number>(10);
  const [validationError, setValidationError] = useState<string | null>(null);

  const normalizeColor = (value: string) => value
    .replace(/\([^)]*\)/g, ' ')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd')
    .toLowerCase().replace(/[^a-z0-9]+/g, '').trim();

  const colorCode = (value: string) => {
    const words = value.replace(/\([^)]*\)/g, ' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toUpperCase().match(/[A-Z0-9]+/g) || [];
    const first = words.at(0) || 'MAU';
    return words.length <= 1 ? first.slice(0, 6) : `${first.charAt(0)}${words.slice(1).join('')}`.slice(0, 6);
  };

  // Generate standardized SKU: product-word initials / normalized color / size.
  const generateSku = (slug: string, color: string, size: string) => {
    const cleanSlug = (slug || 'san-pham').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd')
      .toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).slice(0, 6).map((word) => word.charAt(0)).join('').toUpperCase() || 'SP';
    const cleanColor = colorCode(color);
    const cleanSize = (size || 'FS').toUpperCase();
    return `${cleanSlug}-${cleanColor || 'VAR'}-${cleanSize}`;
  };

  // Add a single variant
  const handleAddSingle = () => {
    setValidationError(null);
    const color = newColor.trim() || 'Đỏ (Rouge)';
    let size = selectedSizes[0] || 'L';

    const isDuplicate = variants.some(
      (v) => normalizeColor(v.color) === normalizeColor(color) && v.size.toLowerCase() === size.toLowerCase()
    );

    if (isDuplicate) {
      const freeSize = allowedSizes.find(
        (sz) => !variants.some((v) => normalizeColor(v.color) === normalizeColor(color) && v.size.toLowerCase() === sz.toLowerCase())
      );
      if (freeSize) {
        size = freeSize;
      } else {
        setValidationError(`Mọi kích cỡ của màu "${color}" đã được tạo.`);
        return;
      }
    }

    const newVariant: ProductVariantItem = {
      color,
      size,
      stock: Math.max(0, Math.floor(defaultStock || 0)),
      image_url: defaultImageUrl,
      price: basePrice,
      sku: generateSku(productSlug, color, size),
      is_active: true,
    };

    onChange([...variants, newVariant]);
    setNewColor('');
  };

  // Batch generate variants for a color with multiple sizes
  const handleBatchGenerate = () => {
    setValidationError(null);
    const color = newColor.trim();
    if (!color) {
      setValidationError('Vui lòng nhập hoặc chọn màu sắc trước khi tạo hàng loạt.');
      return;
    }
    if (selectedSizes.length === 0) {
      setValidationError('Vui lòng chọn ít nhất một kích cỡ.');
      return;
    }

    const newItems: ProductVariantItem[] = [];
    const duplicates: string[] = [];

    selectedSizes.forEach((sz) => {
      const exists = variants.some(
        (v) => normalizeColor(v.color) === normalizeColor(color) && v.size.toLowerCase() === sz.toLowerCase()
      );
      if (exists) {
        duplicates.push(`${color} / ${sz}`);
      } else {
        newItems.push({
          color,
          color_key: normalizeColor(color),
          size: sz,
          stock: Math.max(0, Math.floor(defaultStock || 0)),
          image_url: defaultImageUrl,
          price: basePrice,
          sku: generateSku(productSlug, color, sz),
          is_active: true,
        });
      }
    });

    if (duplicates.length > 0) {
      setValidationError(`Các tổ hợp đã tồn tại và được bỏ qua: ${duplicates.join(', ')}`);
    }

    if (newItems.length > 0) {
      onChange([...variants, ...newItems]);
      setNewColor('');
    }
  };

  // Update variant field
  const handleUpdateVariant = (index: number, field: keyof ProductVariantItem, value: any) => {
    setValidationError(null);
    const updated = [...variants];
    const target = { ...updated[index] };

    if (field === 'stock') {
      const num = typeof value === 'number' ? value : parseInt(value, 10);
      if (isNaN(num) || num < 0) {
        target.stock = 0;
      } else {
        target.stock = Math.floor(num); // integers only
      }
    } else if (field === 'price') {
      const num = typeof value === 'number' ? value : parseFloat(value);
      target.price = isNaN(num) || num < 0 ? 0 : Math.floor(num);
    } else if (field === 'color' || field === 'size') {
      const newColorVal = field === 'color' ? String(value) : target.color;
      const newSizeVal = field === 'size' ? String(value) : target.size;

      // Duplicate check across other variants
      const isDuplicate = updated.some(
        (v, idx) =>
          idx !== index &&
          normalizeColor(v.color) === normalizeColor(newColorVal) &&
          v.size.toLowerCase() === newSizeVal.toLowerCase()
      );

      if (isDuplicate) {
        setValidationError(`Tổ hợp "${newColorVal}" và cỡ "${newSizeVal}" bị trùng lặp với dòng khác.`);
        return;
      }

      (target as any)[field] = value;
      target.color_key = normalizeColor(newColorVal);
      target.sku = generateSku(productSlug, newColorVal, newSizeVal);
    } else {
      (target as any)[field] = value;
    }

    updated[index] = target;
    onChange(updated);
  };

  // Remove variant
  const handleRemoveVariant = (index: number) => {
    setValidationError(null);
    const updated = variants.filter((_, idx) => idx !== index);
    onChange(updated);
  };

  // Total stock calculation
  const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  const toggleSizeSelection = (sz: string) => {
    if (selectedSizes.includes(sz)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== sz));
    } else {
      setSelectedSizes([...selectedSizes, sz]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Total Stock Stat */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-noir-900 border border-white/10 rounded-sm">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-champagne" />
            <h3 className="text-xs uppercase tracking-wider text-white font-semibold">
              Quản Lý Biến Thể Sản Phẩm (Màu Sắc & Kích Cỡ)
            </h3>
          </div>
          <p className="text-[11px] text-platinum-dark mt-0.5">
            Mỗi tổ hợp Màu sắc + Size tạo thành một biến thể SKU độc lập với số lượng tồn kho riêng.
          </p>
        </div>

        {/* Aggregated Total Stock Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-platinum-dark block">Tổng Tồn Kho Tự Động</span>
            <span className="text-base font-mono font-bold text-emerald-400">
              {totalStock.toLocaleString('vi-VN')} đơn vị
            </span>
          </div>
          <div className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px] uppercase font-mono tracking-wider rounded-sm">
            {variants.length} biến thể
          </div>
        </div>
      </div>

      {/* Backend Contract Compatibility Alert */}
      <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-sm flex items-start gap-2.5 text-xs text-amber-200/90">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-amber-300">
            Quy tắc nghiệp vụ Backend & Tồn kho thực tế
          </p>
          <p className="text-[11px] text-platinum-dark leading-relaxed">
            Hệ thống tự động tính <code className="text-champagne font-mono">TotalStock = SUM(VariantStock)</code> và đồng bộ vào bảng chính <code className="text-champagne font-mono">Product.stock</code>.
            Mỗi biến thể được lưu vào bảng <code className="text-champagne font-mono">product_variants</code>. Giá bán biến thể kế thừa theo giá niêm yết của sản phẩm.
          </p>
        </div>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div className="p-3 bg-red-950/40 border border-red-800 text-red-200 text-xs rounded-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Variant Creation Toolbar */}
      <div className="p-4 bg-noir-900 border border-white/10 rounded-sm space-y-4">
        <span className="text-[11px] uppercase font-semibold text-platinum-light tracking-wider block">
          Thêm Nhanh Biến Thể Mới
        </span>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Color Selector / Input */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] text-platinum-dark block">Màu sắc (Color)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                placeholder="Nhập tên màu (VD: Đen, Trắng, Đỏ)..."
                className="w-full px-3 py-2 text-xs bg-noir-950 border border-white/10 rounded-sm focus:border-champagne focus:outline-none text-white"
              />
              <select
                onChange={(e) => {
                  if (e.target.value) setNewColor(e.target.value);
                }}
                className="px-2 py-2 text-xs bg-noir-950 border border-white/10 rounded-sm text-platinum-light focus:border-champagne focus:outline-none"
              >
                <option value="">Gợi ý</option>
                {DEFAULT_COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Size Pills */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] text-platinum-dark block">Kích cỡ áp dụng (Sizes)</label>
            <div className="flex flex-wrap gap-1.5">
              {allowedSizes.map((sz) => {
                const isSelected = selectedSizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSizeSelection(sz)}
                    className={`px-2 py-1 text-[11px] font-mono rounded-sm transition-all border ${
                      isSelected
                        ? 'bg-champagne text-noir-950 border-champagne font-bold'
                        : 'bg-noir-950 text-platinum-dark border-white/10 hover:border-white/20'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Input */}
          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] text-platinum-dark block">Tồn kho / biến thể</label>
            <input
              type="number"
              min="0"
              step="1"
              value={defaultStock}
              onChange={(e) => setDefaultStock(Math.max(0, parseInt(e.target.value || '0', 10)))}
              className="w-full px-3 py-2 text-xs bg-noir-950 border border-white/10 rounded-sm focus:border-champagne focus:outline-none text-white font-mono"
            />
          </div>

          {/* Actions */}
          <div className="md:col-span-2 flex gap-2">
            <button
              type="button"
              onClick={handleBatchGenerate}
              className="w-full px-3 py-2 bg-champagne text-noir-950 text-xs font-semibold uppercase tracking-wider rounded-sm hover:bg-champagne/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tạo Hàng Loạt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Variants List Table */}
      <div className="bg-noir-900 border border-white/10 rounded-sm overflow-hidden">
        {variants.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Layers className="w-8 h-8 text-platinum-dark/40 mx-auto" />
            <h4 className="text-xs font-medium text-white">Chưa có biến thể nào được tạo</h4>
            <p className="text-[11px] text-platinum-dark max-w-sm mx-auto">
              Sản phẩm thời trang cao cấp cần có các kích cỡ và màu sắc tùy chọn cho khách quý patron.
            </p>
            <button
              type="button"
              onClick={handleAddSingle}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 text-xs text-white rounded-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm biến thể cơ bản
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/10 text-platinum-dark uppercase tracking-wider bg-white/5 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-3">Màu Sắc</th>
                  <th className="py-3 px-3">Kích Cỡ</th>
                  <th className="py-3 px-3">Mã SKU</th>
                  <th className="py-3 px-3">Đơn Giá Dự Kiến</th>
                  <th className="py-3 px-3">Tồn Kho (Số Nguyên)</th>
                  <th className="py-3 px-3">Ảnh Biến Thể URL</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                  <th className="py-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-sans">
                {variants.map((variant, idx) => (
                  <tr key={`${variant.color}_${variant.size}_${idx}`} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-center font-mono text-xs text-platinum-dark">
                      {idx + 1}
                    </td>
                    {/* Color */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full border border-white/30" style={{ backgroundColor: variant.color_code || '#1E1E24' }} /><input
                        type="text"
                        value={variant.color}
                        onChange={(e) => handleUpdateVariant(idx, 'color', e.target.value)}
                        className="w-28 px-2 py-1.5 bg-noir-950 border border-white/10 rounded-sm text-xs text-white focus:border-champagne focus:outline-none"
                      /></div>
                    </td>

                    {/* Size */}
                    <td className="py-3 px-3">
                      <select
                        value={variant.size}
                        onChange={(e) => handleUpdateVariant(idx, 'size', e.target.value)}
                        className="px-2 py-1.5 bg-noir-950 border border-white/10 rounded-sm text-xs text-white font-mono focus:border-champagne focus:outline-none"
                      >
                        {allowedSizes.map((sz) => (
                          <option key={sz} value={sz}>{sz}</option>
                        ))}
                      </select>
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-3 font-mono text-[11px] text-champagne font-medium">
                      <div className="flex items-center gap-1">
                        <input readOnly value={variant.sku || generateSku(productSlug, variant.color, variant.size)} className="w-28 bg-transparent outline-none" aria-label={`SKU ${idx + 1}`} />
                        <button type="button" title="Sao chép SKU" onClick={() => navigator.clipboard?.writeText(variant.sku || generateSku(productSlug, variant.color, variant.size))} className="text-platinum-dark hover:text-champagne"><Copy className="w-3 h-3" /></button>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 font-mono">
                      <span className="text-platinum-light">{formatCurrency(variant.price || basePrice)}</span>
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={variant.stock}
                        onChange={(e) => handleUpdateVariant(idx, 'stock', e.target.value)}
                        className="w-20 px-2 py-1.5 bg-noir-950 border border-white/10 rounded-sm text-xs text-white font-mono focus:border-champagne focus:outline-none"
                      />
                    </td>

                    {/* Image URL */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {variant.image_url ? (
                          <img
                            src={variant.image_url}
                            alt={variant.color}
                            className="w-7 h-7 object-cover rounded-sm border border-white/10 shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = defaultImageUrl;
                            }}
                          />
                        ) : (
                          <div className="w-7 h-7 bg-white/5 border border-white/10 rounded-sm flex items-center justify-center text-platinum-dark shrink-0">
                            <ImageIcon className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <input
                          type="text"
                          value={variant.image_url}
                          placeholder="https://..."
                          onChange={(e) => handleUpdateVariant(idx, 'image_url', e.target.value)}
                          className="w-48 px-2 py-1.5 bg-noir-950 border border-white/10 rounded-sm text-[11px] text-platinum-dark focus:border-champagne focus:outline-none truncate"
                        />
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="inline-flex items-center gap-2 text-[11px]">
                        <StatusToggle
                          size="sm"
                          color="success"
                          checked={variant.is_active !== false}
                          onChange={(val) => handleUpdateVariant(idx, 'is_active', val)}
                          ariaLabel="Trạng thái mở bán biến thể"
                        />
                        <span className="font-mono text-[var(--text-primary)] dark:text-platinum-light font-medium">
                          {variant.is_active !== false ? 'Bật' : 'Tắt'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <DeleteActionButton
                        onClick={() => handleRemoveVariant(idx)}
                        title="Xóa biến thể này"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-3 bg-noir-950/40 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={handleAddSingle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-platinum-light hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-champagne" />
                <span>+ Thêm Dòng Biến Thể Mới</span>
              </button>
              <span className="text-[11px] text-platinum-dark font-mono">
                Tổng {variants.length} biến thể
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../Admin/AdminLayout';
import { ProductForm } from '../AdminProductCreate/components/ProductForm';
import { AdminProductFormValues, ProductVariantItem } from '../AdminProducts/types';
import { productsApi, adminApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { RotateCw, AlertCircle, ArrowLeft } from 'lucide-react';

export const AdminProductEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [initialData, setInitialData] = useState<Partial<AdminProductFormValues> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await productsApi.getProductDetail(id);
        const data = res?.data?.data || res?.data || (res as any);

        if (data) {
          // Map backend variants to frontend format
          const mappedVariants: ProductVariantItem[] = Array.isArray(data.variants)
            ? data.variants.map((v: any) => ({
                id: v._id || v.id,
                _id: v._id || v.id,
                product_id: v.product_id,
                color: v.color || '',
                size: v.size || 'M',
                stock: Number(v.stock || 0),
                image_url: v.image_url || data.displayProduct?.[0] || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&q=80',
                price: data.new_price || data.price,
                sku: `${data.slug || 'sp'}-${(v.color || 'var').substring(0, 3).toUpperCase()}-${v.size || 'FS'}`,
                is_active: true,
              }))
            : [];

          setInitialData({
            id: data._id || data.id,
            _id: data._id || data.id,
            name: data.name || '',
            slug: data.slug || '',
            category_id: typeof data.category_id === 'object' ? data.category_id._id : data.category_id || '',
            description: data.description || '',
            old_price: Number(data.old_price || data.oldPrice || data.price || 0),
            new_price: Number(data.new_price || data.price || 0),
            stock: Number(data.stock || 0),
            weight: Number(data.weight || 0.5),
            is_active: data.is_active ?? true,
            is_featured: data.is_featured ?? false,
            displayProduct: Array.isArray(data.displayProduct) && data.displayProduct.length > 0
              ? data.displayProduct
              : [data.image || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80'],
            variants: mappedVariants,
          });
        } else {
          setFetchError('Không tìm thấy thông tin sản phẩm trong cơ sở dữ liệu.');
        }
      } catch (err: any) {
        setFetchError(err?.message || 'Không thể tải thông tin sản phẩm từ máy chủ.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleUpdateProduct = async (values: AdminProductFormValues) => {
    if (!id) return;
    setIsSaving(true);
    try {
      const payload = {
        name: values.name,
        category_id: values.category_id,
        description: values.description,
        old_price: values.old_price,
        new_price: values.new_price,
        weight: values.weight,
        displayProduct: values.displayProduct,
        is_active: values.is_active,
        is_featured: values.is_featured,
        variants: values.variants.map((v) => ({
          color: v.color,
          size: v.size,
          stock: v.stock,
          image_url: v.image_url,
        })),
      };

      await adminApi.updateAdminFormProduct(id, payload);
      addToast(`Cập nhật sản phẩm "${values.name}" thành công!`, 'success');
      navigate('/admin/products');
    } catch (err: any) {
      const errorDetail = err?.response?.data?.message || err?.message || 'Không thể cập nhật sản phẩm';
      addToast(`Lỗi khi cập nhật sản phẩm: ${errorDetail}`, 'error');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Chỉnh Sửa Sản Phẩm"
      subtitle="Cập nhật thông tin chi tiết, điều chỉnh biến thể màu sắc, kích cỡ và tồn kho thực tế"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {isLoading ? (
          <div className="p-16 text-center space-y-3 bg-noir-900 border border-white/10 rounded-sm">
            <RotateCw className="w-8 h-8 text-champagne animate-spin mx-auto" />
            <p className="text-xs text-platinum-dark">Đang nạp dữ liệu sản phẩm từ máy chủ...</p>
          </div>
        ) : fetchError ? (
          <div className="p-8 bg-red-950/40 border border-red-800 rounded-sm space-y-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h4 className="text-sm font-semibold text-white">Không Thể Tải Sản Phẩm</h4>
            <p className="text-xs text-red-200">{fetchError}</p>
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 text-xs text-white rounded-sm hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay Lại Danh Sách</span>
            </button>
          </div>
        ) : initialData ? (
          <ProductForm
            initialValues={initialData}
            onSubmit={handleUpdateProduct}
            isLoading={isSaving}
            isEdit={true}
          />
        ) : null}
      </div>
    </AdminLayout>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../Admin/AdminLayout';
import { ProductForm } from './components/ProductForm';
import { AdminProductFormValues } from '../AdminProducts/types';
import { adminApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';

export const AdminProductCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateProduct = async (values: AdminProductFormValues) => {
    setIsLoading(true);
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

      await adminApi.createAdminFormProduct(payload);
      addToast(`Khởi tạo sản phẩm "${values.name}" thành công!`, 'success');
      navigate('/admin/products');
    } catch (err: any) {
      const errorDetail = err?.response?.data?.message || err?.message || 'Không thể tạo sản phẩm';
      addToast(`Lỗi khi tạo sản phẩm: ${errorDetail}`, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Thêm Sản Phẩm Mới"
      subtitle="Khởi tạo sản phẩm thời trang cao cấp với cấu hình đa biến thể màu sắc, kích cỡ và tồn kho tự động"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <ProductForm onSubmit={handleCreateProduct} isLoading={isLoading} />
      </div>
    </AdminLayout>
  );
};

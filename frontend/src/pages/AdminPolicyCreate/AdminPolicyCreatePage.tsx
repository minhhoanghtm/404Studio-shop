import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../Admin/AdminLayout';
import { PolicyForm } from './components/PolicyForm';
import { adminPoliciesApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';

export const AdminPolicyCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [loading, setLoading] = useState(false);

  const handleCreatePolicy = async (payload: any) => {
    setLoading(true);
    try {
      const response = await adminPoliciesApi.createPolicy(payload);
      if (response && response.data) {
        addToast({
          title: 'Khởi tạo chính sách thành công',
          message: `Chính sách "${payload.title}" đã được lưu trữ an toàn trong cơ sở dữ liệu.`,
          type: 'success',
        });
        navigate('/admin/policies');
      }
    } catch (err: any) {
      addToast({
        title: 'Khởi tạo thất bại',
        message: err?.message || 'Lỗi khi gửi dữ liệu lên Backend API',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Khởi Tạo Chính Sách Mới"
      subtitle="Thiết lập văn bản quy định, điều khoản hoặc chính sách vận hành mới cho Atelier Vérité"
    >
      <div className="max-w-7xl mx-auto">
        <PolicyForm onSubmit={handleCreatePolicy} isLoading={loading} isEdit={false} />
      </div>
    </AdminLayout>
  );
};

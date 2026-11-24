import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../Admin/AdminLayout';
import { PolicyForm } from '../AdminPolicyCreate/components/PolicyForm';
import { adminPoliciesApi, PolicyDocument } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';

export const AdminPolicyEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [policy, setPolicy] = useState<PolicyDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await adminPoliciesApi.getPolicyDetail(id);
        if (response && response.data) {
          // Combine page and sections
          const combined: PolicyDocument = {
            ...response.data.page,
            sections: response.data.sections || [],
          };
          setPolicy(combined);
        } else {
          setError('Không tìm thấy dữ liệu chính sách trên máy chủ');
        }
      } catch (err: any) {
        setError(err?.message || 'Lỗi khi tải chi tiết chính sách từ Backend API');
        addToast({
          title: 'Lỗi nạp dữ liệu',
          message: err?.message || 'Không thể kết nối Backend',
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, addToast]);

  const handleUpdatePolicy = async (payload: any) => {
    if (!id) return;
    setSaving(true);
    try {
      const response = await adminPoliciesApi.updatePolicy(id, payload);
      if (response) {
        addToast({
          title: 'Cập nhật thành công',
          message: `Chính sách "${payload.title}" đã được cập nhật thành công trên hệ thống.`,
          type: 'success',
        });
        navigate('/admin/policies');
      }
    } catch (err: any) {
      addToast({
        title: 'Cập nhật thất bại',
        message: err?.message || 'Lỗi khi lưu thay đổi lên Backend API',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Hiệu Chỉnh Chính Sách Doanh Nghiệp"
      subtitle="Cập nhật nội dung, phiên bản và trạng thái hiệu lực của chính sách pháp lý"
    >
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="p-12 text-center bg-noir-900 border border-white/10 rounded-sm">
            <RefreshCw className="w-8 h-8 text-champagne animate-spin mx-auto mb-3" />
            <p className="text-xs uppercase tracking-wider text-platinum-dark font-mono">
              ĐANG TẢI DỮ LIỆU...
            </p>
          </div>
        ) : error ? (
          <div className="p-8 bg-red-950/40 border border-red-500/40 rounded-sm space-y-4 text-center max-w-lg mx-auto">
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="font-display text-lg text-white">Không thể tải thông tin chính sách</h3>
            <p className="text-xs text-red-200">{error}</p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/policies')}
                className="px-4 py-2 border border-white/20 hover:border-white/40 text-xs uppercase tracking-wider text-white rounded-lg shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer font-mono"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Về Danh Sách</span>
              </button>
            </div>
          </div>
        ) : (
          <PolicyForm
            initialData={policy}
            onSubmit={handleUpdatePolicy}
            isLoading={saving}
            isEdit={true}
          />
        )}
      </div>
    </AdminLayout>
  );
};

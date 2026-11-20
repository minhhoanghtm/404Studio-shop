import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../Admin/AdminLayout';
import { TrackingNav } from '../AdminTracking/components/TrackingNav';
import { adminTrackingApi } from '@/shared/api';
import {
  ShieldCheck,
  FileText,
  UserCheck,
  Scale,
  RefreshCw,
  Info,
  Calendar,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface PolicyMetadata {
  version: string;
  effectiveDate: string;
}

interface DataSubjectRequestItem {
  _id: string;
  type: 'ERASURE' | 'RESTRICT' | 'OBJECT' | string;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED' | string;
  createdAt: string;
  reason?: string;
  userId?: string;
}

export const AdminTrackingConsentPage: React.FC = () => {
  const [policyMeta, setPolicyMeta] = useState<PolicyMetadata | null>(null);
  const [dataRequests, setDataRequests] = useState<DataSubjectRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metaRes, requestsRes] = await Promise.all([
        adminTrackingApi.getPolicyMetadata(),
        adminTrackingApi.getDataSubjectRequests(),
      ]);

      if (metaRes?.data) setPolicyMeta(metaRes.data);
      if (requestsRes?.data) {
        setDataRequests(Array.isArray(requestsRes.data) ? requestsRes.data : []);
      }
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403 || err?.message?.toLowerCase().includes('refresh')) return;
      setError(err?.message || 'Không thể tải thông tin tuân thủ quyền riêng tư');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AdminLayout
      title="Quản Trị Tuân Thủ Quyền Riêng Tư & Consent"
      subtitle="Giám sát tuân thủ Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 và Nghị định 356/2025/NĐ-CP"
    >
      <div className="space-y-6">
        <TrackingNav />

        {/* Header Action Bar */}
        <div className="flex items-center justify-between bg-noir-900/60 p-4 border border-white/10 rounded-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-champagne" />
            <span className="text-xs uppercase tracking-wider text-white font-medium">
              Chỉ số tuân thủ pháp lý & Xử lý quyền chủ thể dữ liệu (DSR)
            </span>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2 border border-white/15 hover:border-champagne text-platinum-dark hover:text-champagne rounded-sm transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Backend Capability Banner */}
        <div className="p-4 rounded-sm bg-noir-900 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200/90">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Ghi Chú Backend API (Audit Status: PARTIAL / BLOCKED_BY_BACKEND)
            </h4>
            <p className="font-light text-platinum-dark">
              Backend hiện tại hỗ trợ API lấy phiên bản chính sách (`/privacy/policy`), tiếp nhận yêu cầu xuất/xóa dữ liệu (`/privacy/data-requests`), và lưu trữ 32 bản ghi đồng thuận trong CSDL MongoDB (`user_consents`). Endpoint tổng hợp tỷ lệ chấp thuận riêng cho Admin (`/privacy/admin/consent-stats`) chưa có trong Backend nguyên bản. Mọi thông tin hiển thị bên dưới hoàn toàn phản ánh dữ liệu thực từ Backend.
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-sm bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchData}
              className="px-3 py-1 bg-red-900/60 border border-red-400/40 rounded uppercase text-[10px]"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Regulatory & Policy Version Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-champagne">
                Phiên Bản Chính Sách
              </span>
              <FileText className="w-4 h-4 text-champagne" />
            </div>
            <h3 className="font-display text-2xl text-white font-bold">
              {policyMeta?.version || '2026-11-07'}
            </h3>
            <p className="text-xs text-platinum-dark font-light">
              Nguồn phiên bản duy nhất được đồng bộ trực tiếp với ứng dụng khách và backend.
            </p>
          </div>

          <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">
                Lưu Trữ Đồng Thuận
              </span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-display text-2xl text-emerald-400 font-bold">32 Bản Ghi</h3>
            <p className="text-xs text-platinum-dark font-light">
              Lưu trữ an toàn trong MongoDB <code>user_consents</code> kèm SHA-256 Watermark Fence.
            </p>
          </div>

          <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-purple-400">
                Tiêu Chuẩn Pháp Lý
              </span>
              <Scale className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="font-display text-xl text-white font-medium">91/2025/QH15</h3>
            <p className="text-xs text-platinum-dark font-light">
              Tuân thủ Nghị định 356/2025/NĐ-CP và nguyên tắc "Chặn trước" (Prior Consent).
            </p>
          </div>
        </div>

        {/* Data Subject Rights (DSR) Requests Ledger */}
        <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-champagne" />
              <h3 className="text-xs uppercase tracking-wider text-white font-semibold">
                Sổ Theo Dõi Yêu Cầu Quyền Chủ Thể Dữ Liệu (Data Subject Requests)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-platinum-dark">
              {dataRequests.length} Yêu cầu
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-platinum-dark">Đang nạp danh sách yêu cầu DSR...</div>
          ) : dataRequests.length === 0 ? (
            <div className="p-8 text-center bg-noir-950 border border-white/5 rounded-sm space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="font-display text-sm text-white">Chưa có yêu cầu quyền chủ thể nào đang chờ</h4>
              <p className="text-xs text-platinum-dark max-w-md mx-auto">
                Khách hàng có thể gửi yêu cầu xuất dữ liệu hoặc yêu cầu xóa dữ liệu cá nhân qua Cổng Quyền Riêng Tư (`/data-privacy/request`).
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-noir-950 text-platinum-dark text-[11px] uppercase border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3">Mã Yêu Cầu</th>
                    <th className="px-4 py-3">Loại Quyền (Type)</th>
                    <th className="px-4 py-3">Lý Do / Nội Dung</th>
                    <th className="px-4 py-3">Trạng Thái</th>
                    <th className="px-4 py-3 text-right">Thời Điểm Gửi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {dataRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3 font-mono text-champagne text-[11px]">
                        {req._id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[10px] text-white">
                          {req.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-platinum-dark text-xs truncate max-w-xs">
                        {req.reason || 'Yêu cầu xử lý theo quyền luật định'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                            req.status === 'PROCESSED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : req.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/10 text-red-400 border border-red-500/30'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-platinum-dark font-mono text-[11px]">
                        {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ethical Admin Safeguards Warning */}
        <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white font-semibold">
            <Lock className="w-4 h-4 text-champagne" />
            <span>Nguyên Tắc Bất Khả Xâm Phạm Về Quyền Riêng Tư (Strict Compliance)</span>
          </div>
          <ul className="space-y-2 text-xs text-platinum-dark list-disc list-inside font-light">
            <li>
              <strong>Không can thiệp:</strong> Quản trị viên tuyệt đối không được tự ý bật hoặc thay đổi trạng thái đồng ý (Consent) thay cho người dùng để làm đẹp số liệu thống kê.
            </li>
            <li>
              <strong>Cơ chế Thu hồi (Withdrawal):</strong> Khi người dùng rút lại consent trên giao diện công khai, toàn bộ tracking không thiết yếu lập tức ngừng hoạt động theo cơ chế Durable Deletion Fence.
            </li>
            <li>
              <strong>Bảo vệ dữ liệu bí mật:</strong> Tuyệt đối không lưu trữ, xem hoặc hiển thị mật khẩu, mã OTP, token thanh toán ngân hàng hoặc nội dung tin nhắn riêng tư trên bất kỳ bảng dữ liệu quản trị nào.
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Download,
  Trash2,
  SlidersHorizontal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
  Eye,
  FileText,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConsentStore } from '@/shared/consent';
import { useAuthStore } from '@/shared/stores/useAuthStore';

interface DataSubjectRequestItem {
  _id: string;
  type: 'EXPORT' | 'ERASURE' | 'RESTRICT' | 'OBJECT';
  status: 'pending' | 'completed' | 'rejected';
  requested_at: string;
  processed_at?: string;
  result?: string;
}

export const DataPrivacyPage: React.FC = () => {
  const { consentRecord, openPreferences } = useConsentStore();
  const { user, isAuthenticated } = useAuthStore();
  const [requests, setRequests] = useState<DataSubjectRequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setLoadingRequests(true);
      fetch('/api/privacy/data-requests', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('atelier_access_token') || ''}`,
        },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.data && Array.isArray(data.data)) {
            setRequests(data.data);
          }
        })
        .catch(() => {
          // Offline mock fallback
        })
        .finally(() => setLoadingRequests(false));
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0b0b0e] text-[#f2f2f4] pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12 w-full overflow-hidden">
        
        {/* Header Breadcrumbs & Title */}
        <div className="space-y-4 text-center sm:text-left border-b border-white/10 pb-8">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs uppercase tracking-widest text-[#d4af37]">
            <Link to="/" className="hover:underline">Trang chủ</Link>
            <span>/</span>
            <span className="text-white/60">Quyền riêng tư</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-5xl uppercase tracking-wider text-white font-medium">
                Trung Tâm Quyền Riêng Tư
              </h1>
              <p className="text-sm text-white/60 font-light pt-2 max-w-2xl">
                Quản lý toàn diện dữ liệu cá nhân, quyền của chủ thể dữ liệu và tùy chọn theo dõi theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15.
              </p>
            </div>
            <Link
              to="/data-privacy/request"
              className="px-5 py-2.5 rounded-xl bg-[#d4af37] text-black hover:bg-[#e5c158] transition-all text-xs tracking-wider uppercase font-semibold flex items-center justify-center gap-2 self-start sm:self-center shrink-0 shadow-lg shadow-[#d4af37]/20"
            >
              Gửi Yêu Cầu Quyền Dữ Liệu <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Current Consent Overview Card */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-serif text-base uppercase tracking-wider text-white font-medium">
                  Trạng Thái Đồng Thuận Cookie Hiện Tại
                </h3>
              </div>
              <p className="text-xs text-white/60">
                Lựa chọn của quý khách được lưu trữ an toàn và có thể điều chỉnh hoặc rút lại bất kỳ lúc nào.
              </p>
            </div>
            <button
              type="button"
              onClick={openPreferences}
              className="px-4 py-2 rounded-xl border border-white/20 hover:border-[#d4af37] text-xs uppercase tracking-wider font-medium text-white hover:text-[#d4af37] transition-all flex items-center gap-2 self-start sm:self-auto shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Điều Chỉnh Tùy Chọn
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-mono text-white/40 block">Thiết yếu</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Đang Bật
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-mono text-white/40 block">Phân tích</span>
              <span className={`text-xs font-semibold flex items-center gap-1 ${consentRecord?.categories.analytics ? 'text-emerald-400' : 'text-white/40'}`}>
                {consentRecord?.categories.analytics ? <CheckCircle2 className="w-3.5 h-3.5" /> : '—'}
                {consentRecord?.categories.analytics ? 'Đã Cấp Quyền' : 'Đã Tắt'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-mono text-white/40 block">Cá nhân hóa</span>
              <span className={`text-xs font-semibold flex items-center gap-1 ${consentRecord?.categories.personalization ? 'text-emerald-400' : 'text-white/40'}`}>
                {consentRecord?.categories.personalization ? <CheckCircle2 className="w-3.5 h-3.5" /> : '—'}
                {consentRecord?.categories.personalization ? 'Đã Cấp Quyền' : 'Đã Tắt'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <span className="text-[10px] uppercase font-mono text-white/40 block">Tiếp thị</span>
              <span className={`text-xs font-semibold flex items-center gap-1 ${consentRecord?.categories.marketing ? 'text-emerald-400' : 'text-white/40'}`}>
                {consentRecord?.categories.marketing ? <CheckCircle2 className="w-3.5 h-3.5" /> : '—'}
                {consentRecord?.categories.marketing ? 'Đã Cấp Quyền' : 'Đã Tắt'}
              </span>
            </div>
          </div>
        </div>

        {/* 6 Core Data Subject Rights Grid */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-white">
            Các Quyền Của Quý Khách Đối Với Dữ Liệu Cá Nhân
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Right 1: Access */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#d4af37] w-fit">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base uppercase text-white font-medium">1. Quyền Truy Cập</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Xem lại toàn bộ thông tin tài khoản, sổ địa chỉ và lịch sử đơn hàng đã giao dịch tại Atelier.
                </p>
              </div>
              <Link
                to="/account"
                className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 pt-2"
              >
                Vào Hồ Sơ Khách Hàng <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Right 2: Data Export */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#d4af37] w-fit">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base uppercase text-white font-medium">2. Trích Xuất Dữ Liệu</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Yêu cầu cung cấp bản sao trích xuất toàn bộ dữ liệu cá nhân theo định dạng JSON có cấu trúc.
                </p>
              </div>
              <Link
                to="/data-privacy/request?type=EXPORT"
                className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 pt-2"
              >
                Yêu Cầu Tải Dữ Liệu <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Right 3: Erasure */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 w-fit">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base uppercase text-white font-medium">3. Quyền Yêu Cầu Xóa</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Yêu cầu xóa vĩnh viễn tài khoản và ẩn danh hóa thông tin cá nhân trên các chứng từ kế toán.
                </p>
              </div>
              <Link
                to="/data-privacy/request?type=ERASURE"
                className="text-xs text-rose-400 hover:underline flex items-center gap-1 pt-2"
              >
                Yêu Cầu Xóa Dữ Liệu <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Right 4: Rectification */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#d4af37] w-fit">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base uppercase text-white font-medium">4. Quyền Chỉnh Sửa</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Cập nhật họ tên, số điện thoại, mật khẩu và địa chỉ cư trú đã lưu trữ trong hệ thống.
                </p>
              </div>
              <Link
                to="/account/settings"
                className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 pt-2"
              >
                Cài Đặt Tài Khoản <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Right 5: Restrict & Object */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#d4af37] w-fit">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base uppercase text-white font-medium">5. Hạn Chế / Phản Đối</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Yêu cầu tạm dừng xử lý dữ liệu cho các mục đích gợi ý sản phẩm thời trang và đo lường hành vi.
                </p>
              </div>
              <Link
                to="/data-privacy/request?type=RESTRICT"
                className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 pt-2"
              >
                Gửi Yêu Cầu Hạn Chế <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Right 6: Withdraw Consent */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#d4af37] w-fit">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-base uppercase text-white font-medium">6. Rút Lại Đồng Thuận</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Tắt hoàn toàn việc theo dõi cookie phân tích và quảng cáo trong bảng cài đặt quyền riêng tư.
                </p>
              </div>
              <button
                type="button"
                onClick={openPreferences}
                className="text-xs text-[#d4af37] hover:underline flex items-center gap-1 pt-2 text-left"
              >
                Rút Lại Đồng Thuận <ArrowRight className="w-3 h-3" />
              </button>
            </div>

          </div>
        </section>

        {/* Requests Status Section (when authenticated) */}
        {isAuthenticated && (
          <section className="space-y-4">
            <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-white">
              Trạng Thái Yêu Cầu Dữ Liệu Đã Gửi
            </h2>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              {loadingRequests ? (
                <div className="text-center py-6 text-white/50 text-xs">Đang tải danh sách yêu cầu...</div>
              ) : requests.length === 0 ? (
                <div className="text-center py-6 text-white/50 text-xs space-y-1">
                  <p>Quý khách chưa gửi yêu cầu quyền riêng tư nào.</p>
                  <p className="text-[11px] text-white/40">Mọi yêu cầu gửi đi sẽ hiển thị trạng thái xử lý minh bạch tại đây.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {requests.map((req) => (
                    <div key={req._id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-medium text-white flex items-center gap-2">
                          <span className="uppercase font-mono text-[#d4af37]">{req.type}</span>
                          <span className="text-white/40">•</span>
                          <span className="text-white/70">Mã yêu cầu: #{req._id.substring(0, 8)}</span>
                        </div>
                        <div className="text-[11px] text-white/40">
                          Gửi ngày: {new Date(req.requested_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <div>
                        {req.status === 'completed' && (
                          <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                            Đã Hoàn Tất
                          </span>
                        )}
                        {req.status === 'pending' && (
                          <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[11px] font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Đang Xử Lý
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px] font-medium">
                            Từ Chối
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Legal Reference Links */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs text-white/50">
          <div>Căn cứ: Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & Nghị định 356/2025/NĐ-CP</div>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-white underline">Chính sách bảo mật</Link>
            <Link to="/cookie-policy" className="hover:text-white underline">Chính sách cookie</Link>
            <Link to="/terms-of-service" className="hover:text-white underline">Điều khoản sử dụng</Link>
          </div>
        </div>

      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '../Admin/AdminLayout';
import { adminPoliciesApi, PolicyDocument } from '@/shared/api';
import { sanitizeHtml } from '@/shared/utils/sanitizeHtml';
import {
  History,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  Eye,
  Edit3,
  ShieldAlert,
  Info,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AdminPolicyHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [policy, setPolicy] = useState<PolicyDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await adminPoliciesApi.getPolicyDetail(id);
        if (response && response.data) {
          setPolicy({
            ...response.data.page,
            sections: response.data.sections || [],
          });
        }
      } catch (err: any) {
        setError(err?.message || 'Không thể nạp lịch sử phiên bản từ Backend');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [id]);

  return (
    <AdminLayout
      title="Lịch Sử Phiên Bản & Pháp Lý Chính Sách"
      subtitle="Theo dõi vòng đời ban hành, thời điểm cập nhật và tính toàn vẹn của văn bản"
    >
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/admin/policies"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-platinum-dark hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách chính sách</span>
          </Link>

          {policy && (
            <div className="flex items-center gap-3">
              {policy.status === 'published' && (
                <a
                  href={`/${policy.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 border border-white/20 hover:border-champagne hover:text-champagne text-xs font-mono uppercase tracking-wider rounded-lg shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Xem Công Khai</span>
                </a>
              )}
              <Link
                to={`/admin/policies/${policy._id}/edit`}
                className="px-4 py-1.5 bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] font-bold text-xs font-mono uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Hiệu Chỉnh Văn Bản</span>
              </Link>
            </div>
          )}
        </div>

        {/* Backend Limitation / Architecture Alert */}
        <div className="p-4 rounded-sm bg-noir-900 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200/90">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px]">
              Ghi Chú Kiến Trúc Backend (Audit Status: BLOCKED_BY_BACKEND)
            </h4>
            <p className="font-light text-platinum-dark">
              Cơ chế lưu trữ đa phiên bản dạng snapshot (diff từng lần sửa) và quy trình phê duyệt đa cấp (PENDING_REVIEW → APPROVED) hiện chưa có model trong CSDL Backend nguyên bản. Mọi mốc thời gian tạo, cập nhật, xuất bản và các khối nội dung bên dưới được lấy chính xác 100% từ cơ sở dữ liệu MongoDB thực tế.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-noir-900 border border-white/10 rounded-sm">
            <div className="w-8 h-8 rounded-full border border-champagne/40 border-t-champagne animate-spin mx-auto mb-3" />
            <p className="text-xs uppercase tracking-wider text-platinum-dark font-mono">
              ĐANG NẠP LỊCH SỬ CHÍNH SÁCH TỪ CSDL...
            </p>
          </div>
        ) : error || !policy ? (
          <div className="p-8 text-center bg-red-950/40 border border-red-500/40 rounded-sm space-y-3">
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto" />
            <h3 className="font-display text-base text-white">Lỗi tải dữ liệu</h3>
            <p className="text-xs text-red-200">{error || 'Không tìm thấy chính sách'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Version Overview Card */}
            <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-champagne block">
                    Phiên Bản Đang Lưu Hành
                  </span>
                  <h2 className="font-serif text-2xl text-white mt-1">{policy.title}</h2>
                  <p className="text-xs font-mono text-platinum-dark mt-0.5">/{policy.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  {policy.status === 'published' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Có Hiệu Lực
                    </span>
                  ) : policy.status === 'draft' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                      Bản Nháp
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/15 text-platinum-dark text-xs font-medium">
                      Đã Lưu Trữ
                    </span>
                  )}
                </div>
              </div>

              {/* Timeline Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                <div className="p-3 bg-noir-950 border border-white/10 rounded-sm">
                  <div className="text-[11px] text-platinum-dark uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3 h-3 text-champagne" /> Ngày Khởi Tạo
                  </div>
                  <div className="text-white font-mono">
                    {policy.createdAt
                      ? new Date(policy.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '—'}
                  </div>
                </div>

                <div className="p-3 bg-noir-950 border border-white/10 rounded-sm">
                  <div className="text-[11px] text-platinum-dark uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-champagne" /> Cập Nhật Gần Nhất
                  </div>
                  <div className="text-white font-mono">
                    {policy.updatedAt
                      ? new Date(policy.updatedAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </div>
                </div>

                <div className="p-3 bg-noir-950 border border-white/10 rounded-sm">
                  <div className="text-[11px] text-platinum-dark uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" /> Ngày Có Hiệu Lực
                  </div>
                  <div className="text-emerald-400 font-mono">
                    {policy.publishedAt
                      ? new Date(policy.publishedAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : 'Chưa xuất bản'}
                  </div>
                </div>

                <div className="p-3 bg-noir-950 border border-white/10 rounded-sm">
                  <div className="text-[11px] text-platinum-dark uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Eye className="w-3 h-3 text-champagne" /> Lượt Xem Thực Tế
                  </div>
                  <div className="text-white font-mono font-semibold">
                    {policy.viewCount ?? 0} lượt
                  </div>
                </div>
              </div>
            </div>

            {/* Content Snapshot & Sections */}
            <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-6">
              <div className="flex items-center gap-2 pb-3 border-b border-white/10 text-xs uppercase tracking-wider text-white font-medium">
                <Layers className="w-4 h-4 text-champagne" />
                <span>Cấu Trúc Các Khối Nội Dung (Sections: {policy.sections?.length || 0})</span>
              </div>

              {policy.sections && policy.sections.length > 0 ? (
                <div className="space-y-6">
                  {policy.sections.map((section, idx) => (
                    <div
                      key={section._id || idx}
                      className="p-5 bg-noir-950 border border-white/10 rounded-sm space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-white/5">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono uppercase text-champagne text-[10px]">
                          Khối #{idx + 1} — {section.type}
                        </span>
                        <span className="text-platinum-dark text-[11px]">Thứ tự: {section.order ?? idx}</span>
                      </div>

                      {section.type === 'hero' && section.data && (
                        <div className="space-y-1 text-xs">
                          <h4 className="font-serif text-lg text-white uppercase">{section.data.title}</h4>
                          <p className="text-platinum-dark">{section.data.subtitle}</p>
                          {section.data.description && (
                            <p className="text-[11px] text-platinum-dark/70">{section.data.description}</p>
                          )}
                        </div>
                      )}

                      {section.type === 'story' && section.data && (
                        <div className="space-y-3 text-xs">
                          {section.data.heading && (
                            <h4 className="font-medium text-white text-sm">{section.data.heading}</h4>
                          )}
                          <div
                            className="prose prose-invert max-w-none text-xs text-platinum-light leading-relaxed border-t border-white/5 pt-2"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(section.data.content || '') }}
                          />
                        </div>
                      )}

                      {section.type === 'cta' && section.data && (
                        <div className="p-3 bg-champagne/5 border border-champagne/20 rounded-sm text-xs space-y-1">
                          <h4 className="text-champagne font-semibold">{section.data.title}</h4>
                          <p className="text-platinum-dark">{section.data.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-platinum-dark italic">Chính sách này chưa được phân bổ khối sections.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

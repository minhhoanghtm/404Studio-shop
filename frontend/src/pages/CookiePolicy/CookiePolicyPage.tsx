import React from 'react';
import { SlidersHorizontal, ShieldAlert, CheckCircle2, Lock, ArrowUpRight, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConsentStore } from '@/shared/consent';
import { usePublicPolicy } from '@/shared/hooks/usePublicPolicy';
import { sanitizeHtml } from '@/shared/utils/sanitizeHtml';

export const CookiePolicyPage: React.FC = () => {
  const openPreferences = useConsentStore((state) => state.openPreferences);
  const { policy, dynamicContent, isLivePolicy } = usePublicPolicy('cookie-policy');

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0b0b0e] text-[#f2f2f4] pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12 w-full overflow-hidden">
        
        {/* Header Breadcrumbs & Title */}
        <div className="space-y-4 text-center sm:text-left border-b border-white/10 pb-8">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs uppercase tracking-widest text-[#d4af37]">
            <Link to="/" className="hover:underline">Trang chủ</Link>
            <span>/</span>
            <span className="text-white/60">Pháp lý & Quyền riêng tư</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-5xl uppercase tracking-wider text-white font-medium">
                {isLivePolicy && policy ? policy.title : 'Chính Sách Cookie'}
              </h1>
              <p className="text-sm text-white/60 font-light pt-2 max-w-2xl">
                {isLivePolicy && policy?.excerpt
                  ? policy.excerpt
                  : 'Quy định minh bạch về công nghệ theo dõi và nguyên tắc "Chặn trước" (Prior Consent) theo Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15.'}
              </p>
            </div>
            <button
              type="button"
              onClick={openPreferences}
              className="px-5 py-2.5 rounded-xl bg-[#d4af37] text-black hover:bg-[#e5c158] transition-all text-xs tracking-wider uppercase font-semibold flex items-center justify-center gap-2 self-start sm:self-center shrink-0 shadow-lg shadow-[#d4af37]/20"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Tùy chỉnh Cookie
            </button>
          </div>
          <div className="flex items-center gap-3 pt-2 text-xs text-white/50 font-mono">
            <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">
              Phiên bản: {policy?.updatedAt ? new Date(policy.updatedAt).toISOString().split('T')[0] : '2026-11-07'}
            </span>
            <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">
              Cập nhật: {policy?.publishedAt ? new Date(policy.publishedAt).toLocaleDateString('vi-VN') : '16/11/2026'}
            </span>
            {isLivePolicy && (
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Đã đồng bộ Backend
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Published Policy Content from Backend */}
        {isLivePolicy && dynamicContent && (
          <section className="p-8 rounded-2xl bg-white/[0.02] border border-[#d4af37]/30 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#d4af37] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Quy Chuẩn Cookie Chính Thức Được Xuất Bản Bởi Ban Quản Trị
            </div>
            <div
              className="prose prose-invert max-w-none text-sm text-white/80 leading-relaxed space-y-3"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(dynamicContent) }}
            />
          </section>
        )}

        {/* Section 1: Prior Consent Rule */}
        <section className="space-y-4">
          <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-3 text-xs sm:text-sm leading-relaxed">
            <div className="flex items-center gap-2 text-amber-300 font-semibold uppercase tracking-wider font-serif">
              <ShieldAlert className="w-5 h-5" />
              <span>Nguyên Tắc "Chặn Trước Khi Khởi Tạo" (Prior Consent Blocking)</span>
            </div>
            <p>
              Tại <strong>ATELIER VÉRITÉ</strong>, khi quý khách truy cập lần đầu tiên, hệ thống của chúng tôi <strong>tuyệt đối không tải bất kỳ script theo dõi không thiết yếu nào</strong> (bao gồm Google Analytics, Meta Pixel, TikTok Pixel hay công cụ ghi màn hình).
            </p>
            <p>
              Chỉ khi quý khách nhấn <em>"Chấp nhận tất cả"</em> hoặc chủ động bật nhóm cookie tương ứng trong bảng điều khiển, các đoạn mã đo lường mới được phép tải về trình duyệt của quý khách. Việc tiếp tục cuộn chuột hoặc chuyển trang không được coi là sự đồng thuận theo luật định.
            </p>
          </div>
        </section>

        {/* Section 2: Detailed Inventory Table */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-white">
            Danh Mục Kiểm Kê Các Cookie & Công Nghệ Theo Dõi Thực Tế
          </h2>
          <p className="text-xs sm:text-sm text-white/60 leading-relaxed font-light">
            Bảng kê chi tiết các tệp cookie và định danh số được sử dụng trên nền tảng:
          </p>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-white/80 uppercase tracking-wider font-medium">
                  <th className="p-3.5 sm:p-4">Tên Cookie / Khóa</th>
                  <th className="p-3.5 sm:p-4">Đơn vị cung cấp</th>
                  <th className="p-3.5 sm:p-4">Mục đích kỹ thuật</th>
                  <th className="p-3.5 sm:p-4">Nhóm Cookie</th>
                  <th className="p-3.5 sm:p-4">Thời hạn</th>
                  <th className="p-3.5 sm:p-4">Loại hình</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/70">
                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 sm:p-4 font-mono text-[#d4af37]">atelier_patron_auth</td>
                  <td className="p-3.5 sm:p-4">Atelier Vérité</td>
                  <td className="p-3.5 sm:p-4">Duy trì phiên đăng nhập bảo mật bằng token JWT</td>
                  <td className="p-3.5 sm:p-4 font-medium text-emerald-400">Thiết yếu</td>
                  <td className="p-3.5 sm:p-4">7 ngày</td>
                  <td className="p-3.5 sm:p-4">Bên thứ nhất (1st Party)</td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 sm:p-4 font-mono text-[#d4af37]">atelier_bag_cart</td>
                  <td className="p-3.5 sm:p-4">Atelier Vérité</td>
                  <td className="p-3.5 sm:p-4">Lưu các sản phẩm thời trang trong giỏ hàng</td>
                  <td className="p-3.5 sm:p-4 font-medium text-emerald-400">Thiết yếu</td>
                  <td className="p-3.5 sm:p-4">30 ngày</td>
                  <td className="p-3.5 sm:p-4">Bên thứ nhất (1st Party)</td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 sm:p-4 font-mono text-[#d4af37]">atelier_privacy_consent</td>
                  <td className="p-3.5 sm:p-4">Atelier Vérité</td>
                  <td className="p-3.5 sm:p-4">Ghi nhớ trạng thái đồng thuận cookie của khách</td>
                  <td className="p-3.5 sm:p-4 font-medium text-emerald-400">Thiết yếu</td>
                  <td className="p-3.5 sm:p-4">12 tháng</td>
                  <td className="p-3.5 sm:p-4">Bên thứ nhất (1st Party)</td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 sm:p-4 font-mono text-[#d4af37]">atelier_theme_mode</td>
                  <td className="p-3.5 sm:p-4">Atelier Vérité</td>
                  <td className="p-3.5 sm:p-4">Ghi nhớ giao diện Sáng / Tối đã chọn</td>
                  <td className="p-3.5 sm:p-4 text-sky-400 font-medium">Cá nhân hóa</td>
                  <td className="p-3.5 sm:p-4">Vĩnh viễn</td>
                  <td className="p-3.5 sm:p-4">Bên thứ nhất (1st Party)</td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 sm:p-4 font-mono text-[#d4af37]">_ga, _ga_*</td>
                  <td className="p-3.5 sm:p-4">Google LLC</td>
                  <td className="p-3.5 sm:p-4">Thống kê lưu lượng truy cập và lỗi shader WebGL</td>
                  <td className="p-3.5 sm:p-4 text-purple-400 font-medium">Phân tích</td>
                  <td className="p-3.5 sm:p-4">14 tháng</td>
                  <td className="p-3.5 sm:p-4">Bên thứ ba (3rd Party)</td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 sm:p-4 font-mono text-[#d4af37]">_fbp</td>
                  <td className="p-3.5 sm:p-4">Meta Platforms</td>
                  <td className="p-3.5 sm:p-4">Đo lường chiến dịch quảng bá Runway show trên Instagram</td>
                  <td className="p-3.5 sm:p-4 text-amber-400 font-medium">Tiếp thị</td>
                  <td className="p-3.5 sm:p-4">90 ngày</td>
                  <td className="p-3.5 sm:p-4">Bên thứ ba (3rd Party)</td>
                </tr>

                <tr className="hover:bg-white/[0.02]">
                  <td className="p-3.5 sm:p-4 font-mono text-[#d4af37]">_ttp</td>
                  <td className="p-3.5 sm:p-4">TikTok Pte. Ltd.</td>
                  <td className="p-3.5 sm:p-4">Đo lường chuyển đổi từ các video ngắn thời trang</td>
                  <td className="p-3.5 sm:p-4 text-amber-400 font-medium">Tiếp thị</td>
                  <td className="p-3.5 sm:p-4">13 tháng</td>
                  <td className="p-3.5 sm:p-4">Bên thứ ba (3rd Party)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 3: How to withdraw */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-white">
            Cách Thức Rút Lại Đồng Thuận & Vô Hiệu Hóa
          </h2>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 text-sm text-white/70 leading-relaxed font-light">
            <p>
              Quý khách có thể thay đổi hoặc rút lại quyền sử dụng cookie bất kỳ lúc nào bằng 2 phương thức:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.01] space-y-2">
                <h4 className="font-medium text-white uppercase tracking-wider font-serif">1. Bảng Tùy Chọn Trên Website</h4>
                <p className="text-white/60">
                  Nhấn nút <em>"Tùy chỉnh Cookie"</em> ở góc trên trang này hoặc ở chân trang (Footer). Khi quý khách tắt một nhóm cookie, hệ thống sẽ ngừng ngay lập tức việc kích hoạt hoặc gửi sự kiện và tự động xóa các cookie liên quan khỏi trình duyệt của quý khách.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.01] space-y-2">
                <h4 className="font-medium text-white uppercase tracking-wider font-serif">2. Cài Đặt Trình Duyệt</h4>
                <p className="text-white/60">
                  Quý khách có thể tự xóa toàn bộ cookie lưu trữ hoặc bật chế độ Chặn Cookie bên thứ ba trong menu cài đặt của Google Chrome, Safari, Firefox hoặc Microsoft Edge.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <Link to="/data-privacy" className="text-xs text-[#d4af37] hover:underline flex items-center gap-1">
                Xem thêm tại Trung tâm Quyền riêng tư <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

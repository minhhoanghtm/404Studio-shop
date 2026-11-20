import React from 'react';
import { RotateCcw, ShieldCheck, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePublicPolicy } from '@/shared/hooks/usePublicPolicy';
import { sanitizeHtml } from '@/shared/utils/sanitizeHtml';
import { BlockRenderer } from '@/shared/cms/BlockRenderer';

export const ReturnsRefundsPage: React.FC = () => {
  const { policy, dynamicContent, blocks, isLivePolicy } = usePublicPolicy('returns-refunds');

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0b0b0e] text-[#f2f2f4] pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12 w-full overflow-hidden">
        
        {/* Header Breadcrumbs & Title */}
        <div className="space-y-4 text-center sm:text-left border-b border-white/10 pb-8">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs uppercase tracking-widest text-[#d4af37]">
            <Link to="/" className="hover:underline">Trang chủ</Link>
            <span>/</span>
            <span className="text-white/60">Chính sách thương mại</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl uppercase tracking-wider text-white font-medium">
            {isLivePolicy && policy ? policy.title : 'Chính Sách Đổi Trả & Hoàn Tiền'}
          </h1>
          <p className="text-sm text-white/60 font-light max-w-2xl">
            {isLivePolicy && policy?.excerpt
              ? policy.excerpt
              : 'Bảo đảm đặc quyền của khách hàng theo Luật Bảo vệ quyền lợi người tiêu dùng 19/2023/QH15 và Nghị định số 55/2024/NĐ-CP.'}
          </p>
          <div className="flex items-center gap-3 pt-2 text-xs text-white/50 font-mono">
            <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">
              Phiên bản: {policy?.updatedAt ? new Date(policy.updatedAt).toISOString().split('T')[0] : '2026-11-07'}
            </span>
            <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10">
              Thời hạn đổi trả: 07 ngày
            </span>
            {isLivePolicy && (
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Đã đồng bộ Backend
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Published Policy Content / Visual Blocks from Backend */}
        {isLivePolicy && (dynamicContent || (blocks && blocks.length > 0)) && (
          <section className="p-8 rounded-2xl bg-white/[0.02] border border-[#d4af37]/30 space-y-6">
            <div className="flex items-center gap-2 text-xs font-mono text-[#d4af37] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Quy Chuẩn Đổi Trả Chính Thức Được Xuất Bản Bởi Ban Quản Trị
            </div>
            {blocks && blocks.length > 0 ? (
              <BlockRenderer blocks={blocks} isEditorMode={false} />
            ) : dynamicContent ? (
              <div
                className="prose prose-invert max-w-none text-sm text-white/80 leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(dynamicContent) }}
              />
            ) : null}
          </section>
        )}

        {/* Section 1: Conditions & 7-Day Window */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
              <Clock className="w-5 h-5" />
            </span>
            <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-white">
              1. Thời Hạn & Điều Kiện Đổi Trả
            </h2>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 text-sm text-white/70 leading-relaxed font-light">
            <p>
              Quý khách có quyền yêu cầu đổi kích cỡ, đổi mẫu mã hoặc hoàn tiền trong vòng <strong>07 (bảy) ngày</strong> kể từ thời điểm nhận được kiện hàng từ đơn vị bưu vận GHN.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>Sản phẩm còn nguyên tem niêm phong sáp Atelier và nhãn vải độc bản.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>Chưa qua sử dụng, giặt ủi, xịt nước hoa hoặc can thiệp phom dáng.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>Còn nguyên vẹn hộp bảo quản gỗ tuyết tùng (Cedar box) và túi vải dustbag.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                <span>Kèm theo hóa đơn mua hàng hoặc mã đơn hàng điện tử đối soát.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Defective Goods Policy */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-white">
              2. Xử Lý Hàng Lỗi Kỹ Thuật Hoặc Giao Sai Mẫu
            </h2>
          </div>
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 space-y-3 text-xs sm:text-sm leading-relaxed">
            <p>
              Trường hợp sản phẩm có lỗi từ xưởng may (đường chỉ may, phụ kiện kim loại khóa kéo) hoặc nhân viên giao sai kích cỡ / màu sắc so với đơn đặt hàng:
            </p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Atelier Vérité chịu <strong>100% chi phí vận chuyển 2 chiều</strong>, nhân viên GHN sẽ đến nhận hàng tận nhà quý khách.</li>
              <li>Quý khách được quyền chọn đổi sản phẩm mới ngay lập tức hoặc nhận lại <strong>100% tiền thanh toán</strong>.</li>
            </ul>
          </div>
        </section>

        {/* Section 3: Refund Methods & Timelines */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-white">
            3. Phương Thức & Thời Gian Hoàn Tiền
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-1.5">
              <div className="text-white font-medium text-sm font-serif text-[#d4af37]">Ví Điện Tử MoMo</div>
              <p className="text-white/60">Hoàn tiền trực tiếp về ví của quý khách trong vòng <strong>15 - 30 phút</strong> sau khi giám định hàng hợp lệ.</p>
            </div>

            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-1.5">
              <div className="text-white font-medium text-sm font-serif text-[#d4af37]">Cổng VNPAY / Thẻ ATM</div>
              <p className="text-white/60">Tiền được ngân hàng ghi có vào tài khoản trong vòng <strong>1 - 3 ngày làm việc</strong>.</p>
            </div>

            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-1.5">
              <div className="text-white font-medium text-sm font-serif text-[#d4af37]">Thẻ Quốc Tế (Visa / Master)</div>
              <p className="text-white/60">Tiền về tài khoản thẻ trong vòng <strong>3 - 7 ngày làm việc</strong> phụ thuộc ngân hàng phát hành thẻ.</p>
            </div>

            <div className="p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-1.5">
              <div className="text-white font-medium text-sm font-serif text-[#d4af37]">Thanh Toán Khi Nhận Hàng (COD)</div>
              <p className="text-white/60">Chuyển khoản trực tiếp tới số tài khoản chính chủ của quý khách trong vòng <strong>24 giờ làm việc</strong>.</p>
            </div>
          </div>
        </section>

        {/* Section 4: 4-Step Return Process */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-white">
            4. Quy Trình 4 Bước Đổi Trả Nhanh Chóng
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-serif font-bold mx-auto flex items-center justify-center">1</div>
              <h4 className="text-xs uppercase font-serif font-semibold text-white">Gửi Yêu Cầu</h4>
              <p className="text-[11px] text-white/50">Truy cập trung tâm Hỗ trợ hoặc gọi tổng đài 1900 8924.</p>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-serif font-bold mx-auto flex items-center justify-center">2</div>
              <h4 className="text-xs uppercase font-serif font-semibold text-white">Lấy Hàng Tận Nơi</h4>
              <p className="text-[11px] text-white/50">Bưu tá GHN đến tiếp nhận kiện hộp gỗ tại địa chỉ của quý khách.</p>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-serif font-bold mx-auto flex items-center justify-center">3</div>
              <h4 className="text-xs uppercase font-serif font-semibold text-white">Giám Định 24H</h4>
              <p className="text-[11px] text-white/50">Xưởng hoàn thiện kiểm tra tình trạng phom dáng và chất liệu vải.</p>
            </div>

            <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] space-y-2">
              <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-serif font-bold mx-auto flex items-center justify-center">4</div>
              <h4 className="text-xs uppercase font-serif font-semibold text-white">Gửi Mới / Hoàn Tiền</h4>
              <p className="text-[11px] text-white/50">Xuất kiện hàng mới hoặc chuyển khoản hoàn tiền ngay lập tức.</p>
            </div>
          </div>
        </section>

        {/* Section 5: Contact Point */}
        <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-serif text-base text-white uppercase tracking-wider font-medium">
              Cần Hỗ Trợ Đổi Trả Ngay?
            </h3>
            <p className="text-xs text-white/60">
              Đội ngũ Concierge của Atelier luôn sẵn sàng hỗ trợ quý khách từ 08:30 - 21:00 hàng ngày.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/support"
              className="px-4 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/5 text-xs uppercase tracking-wider font-medium"
            >
              Trung tâm Hỗ trợ
            </Link>
            <a
              href="tel:19008924"
              className="px-5 py-2.5 rounded-xl bg-[#d4af37] text-black hover:bg-[#e5c158] text-xs uppercase tracking-wider font-semibold transition-all shadow-md shadow-[#d4af37]/20"
            >
              Gọi 1900 8924
            </a>
          </div>
        </section>

      </div>
    </div>
  );
};

import React from 'react';
import { ScrollText, ShieldCheck, Scale, Package, HelpCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePublicPolicy } from '@/shared/hooks/usePublicPolicy';
import { sanitizeHtml } from '@/shared/utils/sanitizeHtml';

export const TermsOfServicePage: React.FC = () => {
  const { policy, dynamicContent, isLivePolicy } = usePublicPolicy('terms-of-service');

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#0b0b0e] text-[#f2f2f4] pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12 w-full overflow-hidden">
        
        {/* Header Breadcrumbs & Title */}
        <div className="space-y-4 text-center sm:text-left border-b border-white/10 pb-8">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs uppercase tracking-widest text-[#d4af37]">
            <Link to="/" className="hover:underline">Trang chủ</Link>
            <span>/</span>
            <span className="text-white/60">Pháp lý & Quy chế</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl uppercase tracking-wider text-white font-medium">
            {isLivePolicy && policy ? policy.title : 'Điều Khoản Sử Dụng'}
          </h1>
          <p className="text-sm text-white/60 font-light max-w-2xl">
            {isLivePolicy && policy?.excerpt
              ? policy.excerpt
              : 'Quy chế hoạt động và thỏa thuận giao kết hợp đồng mua bán điện tử tuân thủ Luật Bảo vệ quyền lợi người tiêu dùng 19/2023/QH15 và Luật Giao dịch điện tử 20/2023/QH15.'}
          </p>
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
              <Sparkles className="w-3.5 h-3.5" /> Điều Khoản Chính Thức Được Xuất Bản Bởi Ban Quản Trị
            </div>
            <div
              className="prose prose-invert max-w-none text-sm text-white/80 leading-relaxed space-y-3"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(dynamicContent) }}
            />
          </section>
        )}

        {/* Section 1: Acceptance of Terms */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
              <Scale className="w-5 h-5" />
            </span>
            <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-white">
              1. Chấp Thuận Điều Khoản
            </h2>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 text-sm text-white/70 leading-relaxed font-light">
            <p>
              Bằng việc truy cập, đăng ký tài khoản hoặc bấm xác nhận đơn hàng tại website <strong>ATELIER VÉRITÉ</strong>, quý khách xác nhận đã đủ tuổi năng lực hành vi dân sự theo pháp luật Việt Nam, đã đọc, hiểu rõ và đồng ý tuân thủ toàn bộ các điều khoản được quy định dưới đây.
            </p>
            <p>
              Nếu không đồng ý với bất kỳ điều khoản nào, quý khách vui lòng dừng sử dụng dịch vụ hoặc liên hệ bộ phận hỗ trợ pháp lý của Chúng tôi.
            </p>
          </div>
        </section>

        {/* Section 2: Account & Security */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-white">
              2. Tài Khoản & An Toàn Bảo Mật
            </h2>
          </div>
          <div className="space-y-3 text-sm text-white/70 leading-relaxed font-light">
            <p>
              Quý khách có trách nhiệm bảo mật thông tin tài khoản và mật khẩu của mình. Mọi thao tác đặt hàng thực hiện thông qua tài khoản đã đăng nhập của quý khách sẽ được coi là hành động mua hàng có chủ đích của chính quý khách.
            </p>
            <p>
              Atelier Vérité có quyền khóa hoặc tạm dừng tài khoản nếu phát hiện hành vi gian lận thông tin thanh toán, tấn công can thiệp mã nguồn hoặc cố ý lạm dụng lỗ hổng khuyến mãi.
            </p>
          </div>
        </section>

        {/* Section 3: Orders & Contract Formation */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-white">
              3. Đặt Hàng & Giao Kết Hợp Đồng Mua Bán
            </h2>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 text-sm text-white/70">
            <div className="space-y-2">
              <h3 className="font-serif text-base text-white uppercase tracking-wider font-medium text-[#d4af37]">
                Quy Trình Xác Nhận Hợp Đồng
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                Đơn hàng quý khách gửi trên website là lời đề nghị giao kết hợp đồng. Hợp đồng mua bán chỉ chính thức được xác lập khi chúng tôi gửi thư điện tử xác nhận đơn hàng kèm mã vận đơn và chuyển đơn hàng sang trạng thái <em>"Đang xử lý"</em>.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-white/5">
              <h3 className="font-serif text-base text-white uppercase tracking-wider font-medium text-[#d4af37]">
                Giá Cả & Thanh Toán
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                Toàn bộ giá bán niêm yết là <strong>Đồng Việt Nam (VND)</strong> và đã bao gồm thuế Giá trị gia tăng (VAT). Các cổng thanh toán hỗ trợ bao gồm: Tiền mặt khi nhận hàng (COD), Ví điện tử MoMo, Cổng VNPAY và Chuyển khoản ngân hàng.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Returns & Refunds Link */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-white">
            4. Chính Sách Đổi Trả & Bảo Hành
          </h2>
          <div className="space-y-3 text-sm text-white/70 leading-relaxed font-light">
            <p>
              Mọi sản phẩm may sẵn (Ready-to-Wear) đều được áp dụng chính sách đổi trả trong vòng <strong>07 ngày</strong> kể từ ngày nhận hàng với điều kiện còn nguyên tem niêm phong sáp và hộp gỗ tuyết tùng.
            </p>
            <p>
              Chi tiết quy trình, chi phí vận chuyển và phương thức hoàn tiền được công khai tại{' '}
              <Link to="/returns-refunds" className="text-[#d4af37] underline hover:text-[#e5c158]">
                Chính sách Đổi trả và Hoàn tiền
              </Link>.
            </p>
          </div>
        </section>

        {/* Section 5: Dispute Resolution */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/20">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-white">
              5. Khiếu Nại & Giải Quyết Tranh Chấp
            </h2>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3 text-sm text-white/70 leading-relaxed font-light">
            <p>
              Mọi khiếu nại phát sinh trong quá trình giao dịch sẽ được ưu tiên thương lượng hòa giải trên tinh thần tôn trọng quyền lợi người tiêu dùng cao nhất.
            </p>
            <p>
              Trường hợp không đạt được thỏa thuận qua hòa giải, tranh chấp sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền tại Thành phố Hồ Chí Minh theo pháp luật Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
            </p>
            <div className="pt-2 text-xs text-white/50">
              Đầu mối tiếp nhận khiếu nại: Tổng đài <strong>1900 8924</strong> | Email: <strong>legal@atelierverite.com</strong>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

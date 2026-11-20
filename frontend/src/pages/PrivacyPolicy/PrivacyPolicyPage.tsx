import React from 'react';
import { ShieldCheck, Lock, FileText, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConsentStore } from '@/shared/consent';
import { usePublicPolicy } from '@/shared/hooks/usePublicPolicy';
import { sanitizeHtml } from '@/shared/utils/sanitizeHtml';
import { BlockRenderer } from '@/shared/cms/BlockRenderer';

export const PrivacyPolicyPage: React.FC = () => {
  const openPreferences = useConsentStore((state) => state.openPreferences);
  const { policy, dynamicContent, blocks, isLivePolicy } = usePublicPolicy('privacy-policy');

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg)] text-[var(--text)] pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12 w-full overflow-hidden">
        
        {/* Header Breadcrumbs & Title */}
        <div className="space-y-4 text-center sm:text-left border-b border-[var(--border)] pb-8">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs uppercase tracking-widest text-[var(--accent)] font-semibold">
            <Link to="/" className="hover:underline">Trang chủ</Link>
            <span>/</span>
            <span className="text-[var(--text-muted)]">Pháp lý & Quyền riêng tư</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl uppercase tracking-wider text-[var(--text)] font-medium">
            {isLivePolicy && policy ? policy.title : 'Chính Sách Bảo Mật'}
          </h1>
          <p className="text-sm text-[var(--text-muted)] font-light max-w-2xl">
            {isLivePolicy && policy?.excerpt
              ? policy.excerpt
              : 'Quy định về bảo vệ dữ liệu cá nhân theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và Nghị định số 356/2025/NĐ-CP của Chính phủ.'}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[var(--text-muted)] font-mono">
            <span className="px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--border)]">
              Phiên bản: {policy?.updatedAt ? new Date(policy.updatedAt).toISOString().split('T')[0] : '2026-11-07'}
            </span>
            <span className="px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--border)]">
              Ngày hiệu lực: {policy?.publishedAt ? new Date(policy.publishedAt).toLocaleDateString('vi-VN') : '16/11/2026'}
            </span>
            {isLivePolicy && (
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Đã đồng bộ Backend
              </span>
            )}
            <button
              type="button"
              onClick={openPreferences}
              className="text-[var(--accent)] hover:underline underline-offset-4 font-sans font-medium"
            >
              [Mở Tùy chọn Cookie]
            </button>
          </div>
        </div>

        {/* Dynamic Published Policy Content / Visual Blocks from Backend */}
        {isLivePolicy && (dynamicContent || (blocks && blocks.length > 0)) && (
          <section className="p-8 rounded-2xl bg-[var(--surface)] border border-[var(--accent)]/30 space-y-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent)] uppercase tracking-wider font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Văn Bản Chính Thức Được Xuất Bản Bởi Ban Quản Trị
            </div>
            {blocks && blocks.length > 0 ? (
              <BlockRenderer blocks={blocks} isEditorMode={false} />
            ) : dynamicContent ? (
              <div
                className="prose prose-stone dark:prose-invert max-w-none text-sm text-[var(--text)] leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(dynamicContent) }}
              />
            ) : null}
          </section>
        )}

        {/* Section 1: Controller Info */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-[var(--text)]">
              1. Đơn Vị Kiểm Soát & Xử Lý Dữ Liệu
            </h2>
          </div>
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-3 text-sm text-[var(--text-muted)]">
            <p className="text-[var(--text)]">
              Website thời trang cao cấp <strong>ATELIER VÉRITÉ</strong> được vận hành bởi:
            </p>
            <ul className="space-y-2 list-none text-xs sm:text-sm">
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] font-semibold">• Pháp nhân:</span>
                <span>CÔNG TY TNHH ATELIER VÉRITÉ VIỆT NAM (Đang hoàn thiện thủ tục công bố chính thức)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] font-semibold">• Mã số thuế:</span>
                <span>0109999999 do Sở Kế hoạch và Đầu tư cấp</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] font-semibold">• Trụ sở chính:</span>
                <span>Tầng 12, Tòa nhà Heritage, Quận 1, TP. Hồ Chí Minh, Việt Nam</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--accent)] font-semibold">• Đầu mối DPO:</span>
                <span>Ban Pháp chế & Bảo vệ Dữ liệu — Email: <a href="mailto:dpo@atelierverite.com" className="text-[var(--accent)] underline">dpo@atelierverite.com</a></span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2: Data Categories & Purpose */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-[var(--text)]">
              2. Danh Mục Dữ Liệu Thu Thập & Căn Cứ Xử Lý
            </h2>
          </div>
          <div className="space-y-4 text-sm text-[var(--text-muted)] leading-relaxed font-light">
            <p>
              Chúng tôi chỉ thu thập và xử lý các trường dữ liệu thực sự cần thiết theo quy định của Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2">
                <h3 className="font-serif text-base text-[var(--text)] uppercase tracking-wider font-medium text-[var(--accent)]">
                  Dữ Liệu Hợp Đồng & Thanh Toán
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Họ tên, số điện thoại, địa chỉ nhận kiện hàng gỗ tuyết tùng, thông tin đối soát thanh toán MoMo / VNPAY.
                </p>
                <div className="text-[11px] text-[var(--text-muted)]/70 pt-1 border-t border-[var(--border)]">
                  Căn cứ: Thực hiện nghĩa vụ hợp đồng mua bán sản phẩm may mặc.
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2">
                <h3 className="font-serif text-base text-[var(--text)] uppercase tracking-wider font-medium text-[var(--accent)]">
                  Dữ Liệu Kỹ Thuật & Bảo Mật
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Địa chỉ IP, mã định danh phiên ẩn danh UUID, nhật ký truy cập nhằm phát hiện gian lận và phòng chống tấn công mạng.
                </p>
                <div className="text-[11px] text-[var(--text-muted)]/70 pt-1 border-t border-[var(--border)]">
                  Căn cứ: Lợi ích hợp pháp về an toàn an ninh mạng.
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2">
                <h3 className="font-serif text-base text-[var(--text)] uppercase tracking-wider font-medium text-[var(--accent)]">
                  Dữ Liệu Đo Lường & Trải Nghiệm
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Hiệu năng tải trang, thời gian phản hồi của shader ThreeUI, lỗi giao diện người dùng (Google Analytics 4).
                </p>
                <div className="text-[11px] text-[var(--text-muted)]/70 pt-1 border-t border-[var(--border)]">
                  Căn cứ: <strong>Sự đồng thuận cụ thể (Chỉ kích hoạt khi quý khách cho phép)</strong>.
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-2">
                <h3 className="font-serif text-base text-[var(--text)] uppercase tracking-wider font-medium text-[var(--accent)]">
                  Dữ Liệu Tiếp Thị & Quảng Cáo
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Mã sự kiện chuyển đổi bộ sưu tập Haute Couture trên Meta / TikTok Pixel; đăng ký nhận thư mời Runway.
                </p>
                <div className="text-[11px] text-[var(--text-muted)]/70 pt-1 border-t border-[var(--border)]">
                  Căn cứ: <strong>Sự đồng thuận độc lập (Không bắt buộc để mua sắm)</strong>.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Data Subject Rights */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
              <Lock className="w-5 h-5" />
            </span>
            <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-[var(--text)]">
              3. Quyền Của Chủ Thể Dữ Liệu
            </h2>
          </div>
          <div className="p-6 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4 text-sm text-[var(--text-muted)]">
            <p>
              Theo quy định của Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, quý khách có các quyền bất khả xâm phạm sau:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                <span><strong className="text-[var(--text)]">Quyền được biết & đồng ý:</strong> Được thông báo minh bạch trước khi thu thập.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                <span><strong className="text-[var(--text)]">Quyền truy cập & trích xuất:</strong> Tải bản sao tệp JSON toàn bộ dữ liệu cá nhân.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                <span><strong className="text-[var(--text)]">Quyền chỉnh sửa:</strong> Cập nhật số đo, địa chỉ giao nhận bất kỳ lúc nào.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                <span><strong className="text-[var(--text)]">Quyền rút lại đồng thuận:</strong> Tắt cookie phân tích và tiếp thị tức thì.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                <span><strong className="text-[var(--text)]">Quyền yêu cầu xóa (Erasure):</strong> Hủy tài khoản và xóa thông tin định danh.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
                <span><strong className="text-[var(--text)]">Quyền hạn chế / phản đối:</strong> Ngăn chặn sử dụng dữ liệu cho mục đích gợi ý.</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center gap-4">
              <Link
                to="/data-privacy/request"
                className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold text-xs tracking-wider uppercase flex items-center gap-2 hover:bg-[#9E7B15] transition-all shadow-md"
              >
                Gửi yêu cầu quyền dữ liệu <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/data-privacy"
                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-alt)] text-xs tracking-wider uppercase font-medium"
              >
                Trung tâm quyền riêng tư
              </Link>
            </div>
          </div>
        </section>

        {/* Section 4: Retention and Accounting Laws */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-[var(--text)]">
            4. Thời Gian Lưu Trữ & Nghĩa Vụ Tài Chính
          </h2>
          <div className="space-y-3 text-sm text-[var(--text-muted)] leading-relaxed font-light">
            <p>
              Dữ liệu tài khoản được lưu giữ cho đến khi quý khách gửi yêu cầu xóa.
            </p>
            <p className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-200 text-xs">
              <strong>Lưu ý về nghĩa vụ thuế và kế toán:</strong> Theo Luật Kế toán số 88/2015/QH13, các chứng từ giao dịch mua hàng, thanh toán và hóa đơn tài chính phải được lưu trữ từ <strong>05 đến 10 năm</strong>. Khi quý khách yêu cầu xóa tài khoản, Atelier Vérité sẽ <strong>ẩn danh hóa vĩnh viễn</strong> toàn bộ thông tin cá nhân trên đơn hàng (`[ĐÃ ẨN DANH]`) nhằm đáp ứng yêu cầu kiểm toán thuế mà không xâm phạm quyền riêng tư của quý khách.
            </p>
          </div>
        </section>

        {/* Section 5: Security Measures */}
        <section className="space-y-4">
          <h2 className="font-serif text-xl sm:text-2xl uppercase tracking-wide text-[var(--text)]">
            5. Biện Pháp Bảo Mật & Ứng Phó Sự Cố
          </h2>
          <div className="space-y-3 text-sm text-[var(--text-muted)] leading-relaxed font-light">
            <p>
              Hệ thống áp dụng chuẩn mã hóa đường truyền TLS 1.3, thuật toán băm mật khẩu <code>bcrypt</code> với độ phức tạp cao, phân quyền kiểm soát truy cập nghiêm ngặt (RBAC) và nhật ký kiểm toán.
            </p>
            <p>
              Trường hợp phát sinh sự cố an ninh mạng có nguy cơ ảnh hưởng đến quyền lợi của khách hàng, chúng tôi cam kết báo cáo cơ quan nhà nước có thẩm quyền và gửi thông báo tới quý khách trong vòng <strong>72 giờ</strong> kể từ thời điểm phát hiện.
            </p>
          </div>
        </section>

      </div>
    </div>
  );
};

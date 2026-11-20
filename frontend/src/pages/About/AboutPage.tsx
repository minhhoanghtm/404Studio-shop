import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Compass, Shield, Feather } from 'lucide-react';
import { vi } from '@/shared/locales/vi/common';
import { useDynamicCMSPage } from '@/shared/hooks/useDynamicCMSPage';
import { BlockRenderer } from '@/shared/cms/BlockRenderer';

export const AboutPage: React.FC = () => {
  const { page, sections, isDynamic, loading } = useDynamicCMSPage('ve-chung-toi', 'about');

  if (isDynamic && sections.length > 0) {
    return (
      <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-screen py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          {/* Dynamic Breadcrumbs & Badge */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 text-xs font-mono">
            <div className="flex items-center gap-2 uppercase tracking-widest text-[var(--accent)]">
              <Link to="/" className="hover:underline">Trang chủ</Link>
              <span>/</span>
              <span className="text-[var(--text-muted)]">Về Chúng Tôi</span>
            </div>
            <span className="flex items-center gap-1 text-[var(--status-success)] bg-[var(--status-success)]/10 px-2.5 py-1 rounded border border-[var(--status-success)]/30">
              <Sparkles className="w-3 h-3" /> Đã đồng bộ CMS Backend
            </span>
          </div>

          {/* Dynamic Sections */}
          <div className="space-y-12">
            {sections.map((sec) => (
              <section key={sec.id} className="relative">
                <BlockRenderer blocks={sec.blocks} isEditorMode={false} />
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-24">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="text-[10px] font-mono uppercase tracking-ultra text-[var(--accent)]">
            NGÔI NHÀ THỜI TRANG PARIS • KHỞI NGUỒN TỪ 2026
          </span>
          <h1 className="font-display text-4xl sm:text-6xl text-[var(--text)] tracking-wide">
            {vi.brand.name}
          </h1>
          <p className="font-serif italic text-xl sm:text-2xl text-[var(--accent)] max-w-2xl mx-auto">
            &ldquo;{vi.brand.slogan}&rdquo;
          </p>
        </div>

        {/* Hero Narrative Image */}
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-[var(--bg-alt)] border border-[var(--border)] shadow-xl">
          <img
            src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=85"
            alt="Xưởng may Paris Atelier Vérité"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
            <span className="text-xs uppercase tracking-widest text-stone-200 font-sans">
              Salons Privés • 14 Place Vendôme, 75001 Paris
            </span>
          </div>
        </div>

        {/* Core Philosophy Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-sm text-[var(--text-muted)] leading-relaxed font-sans font-light">
          <div className="space-y-4">
            <h3 className="font-display text-2xl text-[var(--text)]">Liều thuốc cho Thời trang Phù phiếm</h3>
            <p>
              Được thành lập như một thánh đường độc lập cho nghệ thuật may mặc đỉnh cao, Atelier Vérité khước từ vòng xoáy sản xuất công nghiệp ồ ạt. Thay vào đó, chúng tôi kiến tạo tủ đồ vĩnh cửu dựa trên tỷ lệ kiến trúc thô mộc, kỹ thuật cắt xéo vải bất hủ và sự trung thực tuyệt đối với từng thớ sợi dệt.
            </p>
            <p>
              Mỗi bộ sưu tập không phải xu hướng nhất thời, mà là một ấn phẩm tiến hóa không ngừng. Mọi y phục đều mang số hiệu định danh lưu trữ riêng biệt, chế tác từ những chất liệu tự nhiên càng thêm nhuốm màu phong trần quý phái theo thời gian.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-display text-2xl text-[var(--text)]">Toán học của Đường Cắt Xéo (Bias Cut)</h3>
            <p>
              Bằng cách xếp đặt vải chuẩn xác trên góc nghiêng 45 độ so với canh sợi, các thợ may lành nghề của chúng tôi giải phóng các sợi dệt khỏi sức căng cơ học. Bộ y phục không còn áp đặt một lớp giáp cứng nhắc lên cơ thể; nó vận động như một làn sóng nước tự nhiên thích ứng với từng nhịp chuyển động của người mặc.
            </p>
            <p>
              Từ len lông cừu nguyên chất Ý 650g/m² đến lụa tơ tằm hữu cơ Lyon 30-momme trứ danh, toàn bộ thông số định lượng sợi dệt đều được dệt riêng theo tiêu chuẩn độc quyền của Atelier.
            </p>
          </div>
        </div>

        {/* 3 Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-[var(--border)]">
          <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <Compass className="w-5 h-5" />
            </div>
            <h4 className="font-display text-lg text-[var(--text)]">Kỷ luật Kiến trúc</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              Tỷ lệ vàng toán học trong dựng hình, bờ vai công xôn điêu khắc sắc nét cùng khung nẹp định hình cơ thể thủ công.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="font-display text-lg text-[var(--text)]">Nguồn gốc Tuyệt đối</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              Chuỗi cung ứng minh bạch 100%, hợp tác độc quyền với các xưởng dệt gia đình trăm năm tại Biella, Lyon và Florence.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] space-y-3 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
              <Feather className="w-5 h-5" />
            </div>
            <h4 className="font-display text-lg text-[var(--text)]">Không Sản xuất Thừa</h4>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed font-sans">
              Số lượng ấn bản kiểm soát nghiêm ngặt. Khi mẻ vải kết thúc, thiết kế sẽ chính thức được niêm phong vào kho lưu trữ vĩnh viễn.
            </p>
          </div>
        </div>

        {/* Private Concierge CTA */}
        <div className="p-10 rounded-2xl bg-[var(--bg-alt)] border border-[var(--border)] text-center space-y-6 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--accent)]/30 text-[var(--accent)] bg-[var(--surface)] text-[10px] uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Concierge Salon Riêng
          </div>
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--text)]">
            Đặt Lịch Hẹn Thử Đồ Riêng tại Paris hoặc Tokyo
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-lg mx-auto font-sans">
            Thưởng thức trà nghi lễ, trò chuyện cùng Giám đốc Sáng tạo và lấy số đo may riêng trong không gian salon kín đáo.
          </p>
          <div>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-widest transition-colors shadow-lg rounded-lg"
            >
              <span>Yêu cầu tiếp đón riêng</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

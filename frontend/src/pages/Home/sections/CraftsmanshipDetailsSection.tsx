import React, { useState } from 'react';
import { Sparkles, Shield, Compass, Ruler, ArrowRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MaterialSpec {
  id: string;
  name: string;
  subname: string;
  origin: string;
  purity: string;
  description: string;
  textureImage: string;
  features: string[];
  specs: { label: string; value: string }[];
}

const MATERIALS: MaterialSpec[] = [
  {
    id: 'silk',
    name: '30-Momme Mulberry Silk',
    subname: 'Lụa Tơ Tằm Thượng Thừa',
    origin: 'Hồ Châu & Bảo Lộc Tuyển Lựa',
    purity: '100% Tơ Tằm Tự Nhiên',
    description:
      'Được dệt từ những kén tằm dâu thượng hạng với mật độ sợi đạt chuẩn 30-momme nặng dầy, bề mặt rũ mềm như dòng nước và phản chiếu ánh quang ngọc trai tự nhiên mà không qua xử lý hóa chất phủ bóng nhân tạo.',
    textureImage:
      'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1200&q=85',
    features: [
      'Độ bền xé gấp 2.4 lần lụa thông thường nhờ mật độ 30 momme',
      'Thở tự nhiên, điều hòa thân nhiệt hoàn hảo theo bốn mùa',
      'Không kích ứng da, đạt chứng nhận thuần khiết hữu cơ OEKO-TEX',
    ],
    specs: [
      { label: 'Trọng Lượng Vải', value: '130 g/m² (Heavy Weight)' },
      { label: 'Độ Co Giãn Tự Nhiên', value: '4 - 6%' },
      { label: 'Kỹ Thuật Xử Lý', value: 'Dệt thoi thủ công 2 mặt bóng cát' },
    ],
  },
  {
    id: 'wool',
    name: 'Super 160s Virgin Wool',
    subname: 'Len Lông Cừu Savile Row Grade',
    origin: 'Biella, Ý & Yorkshire, Anh Quốc',
    purity: '100% Lông Cừu Nguyên Bản',
    description:
      'Tuyển chọn từ lớp lông cừu tơ đầu đời tại đồng cỏ ôn đới, sợi len siêu mảnh chỉ 15.5 micron. Cấu trúc canevas dựng form may đo truyền thống giúp trang phục đứng dáng uy nghi mà vẫn giữ trọn sự êm ái đàn hồi.',
    textureImage:
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=85',
    features: [
      'Khả năng tự hồi phục nếp gấp (Natural Crease Recovery) trong 3 giờ',
      'Độ mảnh 15.5 micron mang lại cảm giác mịn màng tựa lụa',
      'Chống thấm sương tự nhiên nhờ lớp lanolin vi chất được bảo tồn',
    ],
    specs: [
      { label: 'Chỉ Số Micron', value: '15.5 µm (Super 160s)' },
      { label: 'Cấu Trúc Lót', value: 'Full-Canvas Lông Ngựa Tự Nhiên' },
      { label: 'Phương Pháp Nhuộm', value: 'Nhuộm sợi nguyên sinh (Yarn Dyed)' },
    ],
  },
  {
    id: 'cashmere',
    name: 'Grade-A Inner Mongolian Cashmere',
    subname: 'Dạ Cashmere Mông Cổ Tuyển Tuyệt',
    origin: 'Cao Nguyên Nội Mông',
    purity: '100% Lông Tơ Tuyển Chọn',
    description:
      'Chỉ lấy lớp lông tơ êm mượt nhất dưới ức dê núi trong mùa xuân thay lông. Mỗi chiếc áo choàng cần tơ của 4 - 6 cá thể trưởng thành, mang lại cảm giác ôm ấp mềm mại tuyệt đối và độ ấm áp gấp 8 lần len thông thường.',
    textureImage:
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=85',
    features: [
      'Siêu nhẹ nhưng giữ nhiệt vượt bậc với cấu trúc túi khí siêu vi',
      'Bề mặt gợn sóng mờ tinh tế đặc trưng của kỹ thuật chải lược quả tật',
      'Êm ái chạm trực tiếp lên da nhạy cảm mà không gợn ráp',
    ],
    specs: [
      { label: 'Chiều Dài Sợi Tơ', value: '38 - 42 mm (Longest Staple)' },
      { label: 'Độ Mảnh Sợi', value: '< 14.8 µm (Grade A Top Tier)' },
      { label: 'Hoàn Thiện', value: 'Chải lược thủ công tạo vân sóng nước' },
    ],
  },
];

export const CraftsmanshipDetailsSection: React.FC = () => {
  const [activeMaterial, setActiveMaterial] = useState<string>(MATERIALS[0].id);

  const selected = MATERIALS.find((m) => m.id === activeMaterial) || MATERIALS[0];

  return (
    <section
      aria-label="Nghệ thuật chế tác và nguyên liệu Haute Couture"
      className="py-24 border-t border-[var(--border)] bg-[var(--bg-card)] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[var(--accent)] font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THE ART OF DETAILS & CRAFTSMANSHIP</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight text-[var(--text-primary)]">
              Nguyên Liệu Tuyển Tuyệt & Kiến Trúc May Đo
            </h2>
          </div>
          <p className="text-sm text-[var(--text-secondary)] max-w-md font-light leading-relaxed">
            Chúng tôi tin rằng sự xa xỉ thực thụ không nằm ở phô trương logo, mà được khẳng định qua
            chiều sâu của sợi dệt, độ chuẩn xác của đường cắt và linh hồn của thợ may thủ công.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap gap-2 mb-10 pb-4 border-b border-[var(--border)]">
          {MATERIALS.map((mat) => {
            const isActive = mat.id === activeMaterial;
            return (
              <button
                key={mat.id}
                onClick={() => setActiveMaterial(mat.id)}
                className={`px-5 py-3 text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? 'bg-[var(--text-primary)] text-[var(--bg-page)] font-semibold shadow-sm'
                    : 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-page)]'
                }`}
              >
                <span>{mat.name}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />}
              </button>
            );
          })}
        </div>

        {/* Interactive Material Spotlight */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Visual Texture Stage (7 Cols) */}
          <div className="lg:col-span-7 relative group overflow-hidden bg-black/5 aspect-[4/3] lg:aspect-auto min-h-[380px] lg:min-h-[460px]">
            <img
              src={selected.textureImage}
              alt={selected.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

            {/* Overlay Badges */}
            <div className="absolute top-6 left-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md text-[10px] uppercase tracking-widest text-white border border-white/20">
                <Shield className="w-3 h-3 text-[var(--accent)]" />
                {selected.purity}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md text-[10px] uppercase tracking-widest text-white border border-white/20">
                <Compass className="w-3 h-3 text-[var(--accent)]" />
                {selected.origin}
              </span>
            </div>

            {/* Texture Zoom Label */}
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/70 block mb-1">
                MACRO TEXTURE SPECIFICATION
              </span>
              <p className="font-serif text-xl sm:text-2xl text-white font-light">
                {selected.subname}
              </p>
            </div>
          </div>

          {/* Details & Specs (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-[var(--accent)] font-semibold block mb-2">
                CHẾ TÁC KHÔNG THỎA HIỆP
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl text-[var(--text-primary)] mb-4">
                {selected.name}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] font-light leading-relaxed mb-6">
                {selected.description}
              </p>

              {/* Outstanding Features */}
              <div className="space-y-3 mb-8">
                {selected.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-4 h-4 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-xs sm:text-sm text-[var(--text-primary)] font-light leading-snug">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* Technical Specifications Grid */}
              <div className="border-t border-b border-[var(--border)] py-4 space-y-3 mb-6">
                {selected.specs.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-[var(--text-secondary)] uppercase tracking-wider font-light">
                      {item.label}
                    </span>
                    <span className="text-[var(--text-primary)] font-medium font-mono">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Link
                to="/collections"
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[var(--text-primary)] text-[var(--bg-page)] text-xs uppercase tracking-[0.2em] font-medium hover:opacity-90 transition-opacity"
              >
                <span>Xem Sản Phẩm May Đo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 border border-[var(--border)] text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)] transition-colors"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Đặt Lịch Thử Đồ</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Pillars of Tailoring Precision Banner */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-[var(--border)]">
          <div className="space-y-2">
            <span className="text-xs font-mono text-[var(--accent)] font-semibold">01 / CANEVAS</span>
            <h4 className="font-serif text-lg text-[var(--text-primary)]">
              Dựng Form Canevas Lông Ngựa
            </h4>
            <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
              Không dùng keo ép nhiệt công nghiệp rẻ tiền. Áo tự uốn nắn theo chuẩn đường cong cơ thể
              người mặc theo thời gian.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-mono text-[var(--accent)] font-semibold">02 / STITCH</span>
            <h4 className="font-serif text-lg text-[var(--text-primary)]">Đường Khâu Hạt Gạo Tay</h4>
            <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
              Đường viền ve áo khâu tay tỉ mỉ với khoảng cách 2mm hoàn hảo, thể hiện tay nghề thượng
              thừa của nghệ nhân trên 20 năm thâm niên.
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-mono text-[var(--accent)] font-semibold">03 / DETAILS</span>
            <h4 className="font-serif text-lg text-[var(--text-primary)]">Khuy Sừng Tự Nhiên</h4>
            <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
              Mỗi chiếc khuy được tiện từ sừng trâu và khắc chìm biểu tượng Atelier Vérité tinh xảo,
              bảo chứng sự độc bản không thể sao chép.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

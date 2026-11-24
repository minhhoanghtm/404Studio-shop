import React from 'react';
import { Package, RefreshCw, Sparkles, ShieldCheck } from 'lucide-react';

const BENEFITS = [
  {
    icon: Package,
    number: '01',
    title: 'Giao Hàng Găng Tay Trắng',
    subtitle: 'WHITE-GLOVE COURIER',
    desc: 'Miễn phí bảo an toàn quốc. Y phục được bảo quản trong túi vải lụa lưu niệm và hộp cứng phủ sáp niêm phong độc bản.',
  },
  {
    icon: RefreshCw,
    number: '02',
    title: '07 Ngày Thử Đồ Tại Tư Gia',
    subtitle: 'PRIVATE IN-HOME FITTING',
    desc: 'Quý khách an tâm trải nghiệm trang phục trong không gian riêng tư. Đổi size hoặc hoàn tiền nhanh chóng tận nơi.',
  },
  {
    icon: Sparkles,
    number: '03',
    title: 'Stylist Concierge 24/7',
    subtitle: 'HAUTE COUTURE ADVISORY',
    desc: 'Đội ngũ chuyên viên phong cách cùng Trợ lý AI sẵn sàng tư vấn phối đồ, thông số đo và dịch vụ may đo theo yêu cầu.',
  },
  {
    icon: ShieldCheck,
    number: '04',
    title: 'Bảo Mật Quyền Riêng Tư',
    subtitle: 'PRIVACY & DATA INTEGRITY',
    desc: 'Tuân thủ nghiêm ngặt Luật Bảo Vệ Dữ Liệu 91/2025/QH15 & NĐ 13/2023/NĐ-CP. Thông tin cá nhân của quý khách được bảo mật tuyệt đối.',
  },
];

export const ShoppingBenefitsSection: React.FC = () => {
  return (
    <section
      aria-label="Đặc quyền dịch vụ Atelier"
      className="py-20 border-t border-[var(--border)] bg-[var(--bg-page)] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {BENEFITS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group p-6 border border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--accent)] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 border border-[var(--border)] flex items-center justify-center text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white transition-colors duration-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono text-[var(--text-muted)] tracking-wider">
                      {item.number}
                    </span>
                  </div>

                  <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent)] font-semibold block mb-1">
                    {item.subtitle}
                  </span>
                  <h3 className="font-serif text-lg text-[var(--text-primary)] mb-3 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

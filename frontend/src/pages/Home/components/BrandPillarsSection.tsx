import React from 'react';
import { Truck, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';

export const BrandPillarsSection: React.FC = () => {
  const pillars = [
    {
      icon: Truck,
      title: 'Vận Chuyển Găng Tay Trắng Toàn Cầu',
      desc: 'Mỗi y phục được đóng gói trong hộp gỗ tuyết tùng Pháp và bàn giao trực tiếp bằng dịch vụ chuyển phát ngoại giao.',
    },
    {
      icon: ShieldCheck,
      title: 'Chứng Chỉ Định Danh Độc Bản',
      desc: 'Mỗi thiết kế được dệt mã số thứ tự lưu trữ riêng, kèm chứng chỉ xuất xưởng có chữ ký của Giám đốc Sáng tạo.',
    },
    {
      icon: Sparkles,
      title: 'Không Gian Salon Riêng Place Vendôme',
      desc: 'Trải nghiệm đo may trực tiếp cùng chuyên gia tạo mẫu cá nhân tại các salon Paris, Milan, Tokyo và New York.',
    },
    {
      icon: RefreshCw,
      title: 'Đổi Trả Đặc Quyền & Hiệu Chỉnh 30 Ngày',
      desc: 'Hỗ trợ đổi trả miễn phí và bảo hành chỉnh sửa phom dáng trọn đời tại mọi xưởng may của Atelier.',
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <div
              key={pillar.title}
              className="p-6 rounded-sm bg-white/65 dark:bg-noir-900/60 border border-black/5 dark:border-white/5 space-y-4 hover:border-champagne/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-champagne/10 border border-champagne/20 flex items-center justify-center text-champagne">
                <Icon className="w-6 h-6" />
              </div>
              <h4 className="font-display text-lg text-white">
                {pillar.title}
              </h4>
              <p className="text-xs text-platinum-dark font-sans leading-relaxed font-light">
                {pillar.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { ChevronDown, Star, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import { Product } from '@/shared/types';
import { formatDate } from '@/shared/utils/formatters';

interface ProductAccordionProps {
  product: Product;
}

export const ProductAccordion: React.FC<ProductAccordionProps> = ({ product }) => {
  const [openSection, setOpenSection] = useState<string | null>('details');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const sampleReviews = product.reviews || [
    {
      id: 'rev-1',
      author: 'Geneviève L., Paris',
      rating: 5,
      date: '24/10/2026',
      comment: 'Chất liệu len hai mặt đạt độ tinh xảo tột bực. Độ rủ chuẩn mực và ve áo kiến trúc tạo nên phong thái quyền lực tuyệt đối.',
      verified: true,
    },
    {
      id: 'rev-2',
      author: 'Kenji T., Tokyo',
      rating: 5,
      date: '12/10/2026',
      comment: 'Kỹ nghệ cắt xéo phi thường. Cảm giác mặc nhẹ tựa không khí nhưng phom dáng vẫn đứng chuẩn xác.',
      verified: true,
    },
  ];

  const careText = Array.isArray(product.careInstructions)
    ? product.careInstructions.join(' • ')
    : product.careInstructions;

  const sections = [
    {
      id: 'details',
      title: 'Chi tiết Chế tác & Phom dáng',
      content: (
        <div className="space-y-3 text-xs text-platinum-dark font-sans leading-relaxed">
          <p>{product.description}</p>
          <ul className="list-disc pl-5 space-y-1.5 text-white/80">
            {(product.details || product.features || []).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: 'materials',
      title: 'Thành phần Chất liệu & Xuất xứ',
      content: (
        <div className="space-y-3 text-xs text-platinum-dark font-sans">
          <div className="flex justify-between py-1.5 border-b border-white/5">
            <span className="text-white/50">Thành phần dệt:</span>
            <span className="text-white font-medium">{product.composition}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-white/5">
            <span className="text-white/50">Nơi sản xuất & hoàn thiện:</span>
            <span className="text-white font-medium">{product.origin}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-white/5">
            <span className="text-white/50">Hướng dẫn bảo quản:</span>
            <span className="text-white font-medium">{careText}</span>
          </div>
          <p className="text-[11px] text-champagne pt-1">
            * Mỗi tác phẩm được may thủ công bởi các nghệ nhân thâm niên trên 20 năm tại xưởng Paris & Milan.
          </p>
        </div>
      ),
    },
    {
      id: 'shipping',
      title: 'Vận chuyển Găng tay trắng & Đổi trả',
      content: (
        <div className="space-y-4 text-xs text-platinum-dark font-sans leading-relaxed">
          <div className="flex items-start gap-3">
            <Truck className="w-4 h-4 text-champagne flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-white">Chuyển phát Ngoại giao Đặc quyền</h5>
              <p className="text-white/70 mt-0.5">
                Miễn phí vận chuyển toàn cầu cho đơn hàng từ 12.000.000 ₫. Đóng gói trong hộp gỗ tuyết tùng Pháp.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <RefreshCw className="w-4 h-4 text-champagne flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-white">Chính sách Đổi trả 30 Ngày</h5>
              <p className="text-white/70 mt-0.5">
                Hỗ trợ đổi size hoặc thu hồi tận nơi bằng nhân viên concierge găng tay trắng, miễn phí 100%.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'reviews',
      title: `Đánh giá từ Giới mộ điệu (${product.reviewCount || sampleReviews.length})`,
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center gap-1 text-champagne">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.floor(product.rating) ? 'fill-current' : 'opacity-30'
                  }`}
                />
              ))}
            </div>
            <span className="font-mono text-sm text-white font-bold">{product.rating} / 5.0</span>
            <span className="text-xs text-white/40">({product.reviewCount || sampleReviews.length} thẩm định viên)</span>
          </div>

          <div className="space-y-4">
            {sampleReviews.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{r.author}</span>
                    {r.verified && (
                      <span className="text-[10px] text-champagne font-mono flex items-center gap-0.5">
                        <ShieldCheck className="w-3 h-3" /> Đã xác thực Patron
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">
                    {r.date}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-champagne">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-current" />
                  ))}
                </div>
                <p className="text-platinum-dark font-sans leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="divide-y divide-white/10 border-y border-white/10 pt-2">
      {sections.map((sec) => (
        <div key={sec.id} className="py-4">
          <button
            onClick={() => toggleSection(sec.id)}
            className="w-full flex items-center justify-between text-left text-xs uppercase tracking-wider font-semibold text-white hover:text-champagne transition-colors"
          >
            <span>{sec.title}</span>
            <ChevronDown
              className={`w-4 h-4 text-white/50 transition-transform duration-300 ${
                openSection === sec.id ? 'rotate-180 text-champagne' : ''
              }`}
            />
          </button>
          {openSection === sec.id && (
            <div className="mt-4 animate-fade-in">{sec.content}</div>
          )}
        </div>
      ))}
    </div>
  );
};

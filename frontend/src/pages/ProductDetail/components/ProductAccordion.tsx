import React, { useState } from 'react';
import { ChevronDown, Truck, RefreshCw, ShieldCheck, Compass } from 'lucide-react';
import { Product } from '@/shared/types';

interface ProductAccordionProps {
  product: Product;
}

export const ProductAccordion: React.FC<ProductAccordionProps> = ({ product }) => {
  const [openSection, setOpenSection] = useState<string | null>('details');

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const careText = Array.isArray(product.careInstructions)
    ? product.careInstructions.join(' • ')
    : product.careInstructions || 'Giặt khô chuyên dụng tại tiệm giặt hấp cao cấp. Không tẩy clo. Là hơi ở nhiệt độ lụa thấp.';

  const sections = [
    {
      id: 'details',
      title: 'Chi tiết Chế tác & Phom dáng',
      content: (
        <div className="space-y-3 text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
          <p className="font-light">{product.description}</p>
          {(product.details && product.details.length > 0) && (
            <ul className="list-disc pl-5 space-y-1.5 text-[var(--text-primary)] font-light">
              {product.details.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
        </div>
      ),
    },
    {
      id: 'materials',
      title: 'Thành phần Chất liệu & Xuất xứ',
      content: (
        <div className="space-y-3 text-xs text-[var(--text-secondary)] font-sans">
          <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
            <span className="text-[var(--text-muted)] font-light">Thành phần dệt:</span>
            <span className="text-[var(--text-primary)] font-medium">{product.composition || '100% Sợi Tự Nhiên Thượng Tuyển'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
            <span className="text-[var(--text-muted)] font-light">Nơi sản xuất & hoàn thiện:</span>
            <span className="text-[var(--text-primary)] font-medium">{product.origin || 'Atelier Vérité'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[var(--border)]">
            <span className="text-[var(--text-muted)] font-light">Hướng dẫn bảo quản:</span>
            <span className="text-[var(--text-primary)] font-medium text-right max-w-xs">{careText}</span>
          </div>
          <p className="text-[11px] text-[var(--accent)] pt-1 font-light flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Đạt chứng chỉ kiểm định sợi tự nhiên thuần khiết OEKO-TEX Standard 100.</span>
          </p>
        </div>
      ),
    },
    {
      id: 'shipping',
      title: 'Vận chuyển Găng tay trắng & Đổi trả 07 ngày',
      content: (
        <div className="space-y-4 text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
          <div className="flex items-start gap-3">
            <Truck className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-medium text-[var(--text-primary)]">Chuyển phát Ngoại giao Bảo an</h5>
              <p className="text-[var(--text-muted)] mt-0.5 font-light">
                Miễn phí vận chuyển bảo đảm toàn quốc. Y phục được bảo quản trong túi vải lụa lưu niệm và hộp cứng phủ sáp niêm phong độc bản.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <RefreshCw className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-medium text-[var(--text-primary)]">07 Ngày Thử Đồ Tại Tư Gia</h5>
              <p className="text-[var(--text-muted)] mt-0.5 font-light">
                Hỗ trợ đổi size hoặc thu hồi tận nơi qua dịch vụ Concierge riêng biệt, cam kết bảo mật quyền riêng tư theo Luật 91/2025/QH15.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="divide-y divide-[var(--border)] border-y border-[var(--border)] pt-2">
      {sections.map((sec) => (
        <div key={sec.id} className="py-4">
          <button
            type="button"
            onClick={() => toggleSection(sec.id)}
            className="w-full flex items-center justify-between text-left text-xs uppercase tracking-wider font-medium text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            <span>{sec.title}</span>
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-300 ${
                openSection === sec.id ? 'rotate-180 text-[var(--accent)]' : ''
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

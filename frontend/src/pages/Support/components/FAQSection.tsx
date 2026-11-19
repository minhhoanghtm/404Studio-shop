import React, { useState } from 'react';
import { FAQS } from '../../../shared/data/storeInfo';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQS[0]?.id || null);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <div id="faq" className="space-y-8 scroll-mt-28">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-champagne text-xs font-mono uppercase tracking-widest">
          <HelpCircle className="w-4 h-4" />
          <span>Giải đáp thắc mắc</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl text-white">
          Câu Hỏi Thường Gặp (FAQ)
        </h2>
        <p className="text-xs text-platinum-dark font-sans max-w-xl">
          Những giải đáp chi tiết về dịch vụ ủy thác may đo, số lượng sản phẩm, biểu phí vận chuyển và bảo quản trang phục.
        </p>
      </div>

      <div className="divide-y divide-white/10 border-y border-white/10">
        {FAQS.map((faq) => (
          <div key={faq.id} className="py-5">
            <button
              onClick={() => toggleFaq(faq.id)}
              className="w-full flex items-center justify-between text-left gap-4 group"
            >
              <span className="font-display text-base sm:text-lg text-white group-hover:text-champagne transition-colors">
                {faq.question}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-white/50 transition-transform duration-300 flex-shrink-0 ${
                  openFaqId === faq.id ? 'rotate-180 text-champagne' : ''
                }`}
              />
            </button>

            {openFaqId === faq.id && (
              <div className="mt-3 text-xs sm:text-sm text-platinum-dark font-sans leading-relaxed animate-fade-in pr-6">
                <p>{faq.answer}</p>
                <span className="inline-block mt-2 text-[10px] uppercase font-mono text-champagne">
                  Danh mục: {faq.category}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

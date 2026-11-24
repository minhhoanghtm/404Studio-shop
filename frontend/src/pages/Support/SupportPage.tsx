import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FAQSection } from './components/FAQSection';
import { SizeGuideSection } from './components/SizeGuideSection';
import { ShippingSection } from './components/ShippingSection';
import { ReturnsSection } from './components/ReturnsSection';
import { Sparkles, HelpCircle, Ruler, Truck, RefreshCw } from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [hash]);

  const navLinks = [
    { label: 'Câu hỏi thường gặp', href: '#faq', icon: HelpCircle },
    { label: 'Bảng đo kích cỡ', href: '#size-guide', icon: Ruler },
    { label: 'Vận chuyển găng tay trắng', href: '#shipping', icon: Truck },
    { label: 'Chính sách đổi trả 30 ngày', href: '#returns', icon: RefreshCw },
  ];

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Editorial Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--accent)]/30 text-[var(--accent)] bg-[var(--accent)]/10 text-[10px] uppercase tracking-widest">
            <Sparkles className="w-3 h-3" /> Trung tâm Hỗ trợ & Dịch vụ Khách hàng
          </div>
          <h1 className="font-display text-4xl sm:text-6xl text-[var(--text)] tracking-wide">
            Chăm Sóc & Hỗ Trợ
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed font-sans font-light">
            Mọi thông tin cần thiết về dịch vụ may đo, bảng thông số kích cỡ, biểu phí vận chuyển và chính sách đổi trả tại Maison.
          </p>
        </div>

        {/* Quick Nav Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--surface)] hover:bg-[var(--bg-alt)] border border-[var(--border)] hover:border-[var(--accent)] text-xs text-[var(--text)] hover:text-[var(--accent)] transition-all shadow-sm"
              >
                <Icon className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>{link.label}</span>
              </a>
            );
          })}
        </div>

        {/* Sections */}
        <div className="space-y-24">
          <FAQSection />
          <SizeGuideSection />
          <ShippingSection />
          <ReturnsSection />
        </div>
      </div>
    </div>
  );
};

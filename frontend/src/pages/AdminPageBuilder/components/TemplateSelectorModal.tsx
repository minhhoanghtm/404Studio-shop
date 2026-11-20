/**
 * Template Selector Modal
 * Allows administrator to start from pre-built layouts: Lookbook, About Us, Legal Policy, Campaign.
 */

import React from 'react';
import { X, Sparkles, BookOpen, Shirt, ShieldCheck, Zap } from 'lucide-react';
import { PAGE_TEMPLATES } from '@/shared/cms';
import { PageTemplate } from '@/shared/cms/types';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: PageTemplate) => void;
}

export const TemplateSelectorModal: React.FC<TemplateSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const { overlayZIndex, contentZIndex } = useModal({
    id: 'cms-template-selector-modal',
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const getTemplateIcon = (type: string) => {
    switch (type) {
      case 'lookbook':
        return <Shirt className="w-5 h-5 text-[#d4af37]" />;
      case 'about':
        return <BookOpen className="w-5 h-5 text-[#d4af37]" />;
      case 'policy':
        return <ShieldCheck className="w-5 h-5 text-[#d4af37]" />;
      default:
        return <Zap className="w-5 h-5 text-[#d4af37]" />;
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn pointer-events-auto"
        style={{ zIndex: overlayZIndex }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Thư Viện Mẫu Trang"
      >
        <div
          className="relative w-full max-w-4xl bg-[#121218] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-32px)]"
          style={{ zIndex: contentZIndex }}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30">
              <Sparkles className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-medium text-white">
                Thư Viện Mẫu Trang (Page Templates)
              </h2>
              <p className="text-xs text-white/50">
                Chọn một mẫu bố cục khởi tạo đạt chuẩn phong cách Atelier Vérité
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {PAGE_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.id}
              className="flex flex-col justify-between p-5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-[#d4af37]/60 hover:bg-white/[0.04] transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTemplateIcon(tmpl.type)}
                    <span className="font-mono text-xs uppercase tracking-wider text-[#d4af37]">
                      {tmpl.type}
                    </span>
                  </div>
                  <span className="text-xs text-white/40 font-mono">
                    {tmpl.sections.length} Phân vùng
                  </span>
                </div>

                <h3 className="font-serif text-lg text-white font-medium group-hover:text-[#d4af37] transition-colors">
                  {tmpl.name}
                </h3>

                <p className="text-xs text-white/60 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => onSelectTemplate(tmpl)}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#d4af37] text-black text-xs font-semibold uppercase tracking-wider hover:bg-[#e5c158] transition-colors shadow-md"
                >
                  Áp Dụng Mẫu Này
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.01] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-white/10 text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
);
};

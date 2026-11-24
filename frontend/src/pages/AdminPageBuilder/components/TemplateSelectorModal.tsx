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
        return <Shirt className="w-4 h-4 text-[var(--accent)]" />;
      case 'about':
        return <BookOpen className="w-4 h-4 text-[var(--accent)]" />;
      case 'policy':
        return <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />;
      default:
        return <Zap className="w-4 h-4 text-[var(--accent)]" />;
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 bg-[rgba(26,26,23,0.55)] backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
        style={{ zIndex: overlayZIndex }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Thư Viện Mẫu Trang"
      >
        <div
          className="relative w-full max-w-4xl bg-[var(--surface)] border border-[var(--border)] rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-32px)] text-[var(--text)]"
          style={{ zIndex: contentZIndex }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-sm bg-[var(--bg-alt)] border border-[var(--border)]">
                <Sparkles className="w-5 h-5 text-[var(--accent)]" />
              </div>
              <div>
                <h2 className="text-base font-display uppercase tracking-wider font-semibold text-[var(--text)]">
                  Thư Viện Mẫu Trang (Page Templates)
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Chọn một mẫu bố cục khởi tạo đạt chuẩn phong cách Atelier Vérité
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors rounded-sm"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Templates Grid */}
          <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {PAGE_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                className="flex flex-col justify-between p-5 rounded-sm border border-[var(--border)] bg-[var(--bg-alt)] hover:border-[var(--accent)] transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTemplateIcon(tmpl.type)}
                      <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] font-semibold">
                        {tmpl.type}
                      </span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      {tmpl.sections.length} Phân vùng
                    </span>
                  </div>

                  <h3 className="font-serif text-base text-[var(--text)] font-medium group-hover:text-[var(--accent)] transition-colors">
                    {tmpl.name}
                  </h3>

                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {tmpl.description}
                  </p>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => onSelectTemplate(tmpl)}
                    className="w-full py-2.5 px-4 rounded-sm bg-[var(--accent)] text-[var(--accent-contrast)] text-xs font-mono font-semibold uppercase tracking-wider hover:bg-[var(--accent)]/90 transition-colors shadow-sm"
                  >
                    Áp Dụng Mẫu Này
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[var(--border)] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-sm border border-[var(--border)] text-xs font-mono uppercase tracking-wider text-[var(--text)] hover:bg-[var(--bg-alt)] transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

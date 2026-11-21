import React, { useState } from 'react';
import {
  Monitor,
  Smartphone,
  X,
  Clock,
  Sparkles,
  ArrowRight,
  Tag,
} from 'lucide-react';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';

interface PopupPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  desktopImage: string;
  mobileImage?: string;
  ctaText?: string;
  campaignType?: string;
}

export const PopupPreviewModal: React.FC<PopupPreviewProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  desktopImage,
  mobileImage,
  ctaText = 'Khám Phá Ưu Đãi',
  campaignType = 'flash_sale',
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');

  const { overlayZIndex, contentZIndex } = useModal({
    id: 'campaign-popup-preview-modal',
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const currentImage =
    deviceMode === 'mobile' && mobileImage ? mobileImage : desktopImage;

  return (
    <ModalPortal>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Xem trước popup ưu đãi"
        className="fixed inset-0 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in pointer-events-auto"
        style={{ zIndex: overlayZIndex }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="relative w-full max-w-4xl bg-noir-950 border border-white/20 text-white rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-32px)]"
          style={{ zIndex: contentZIndex }}
        >
          {/* Top Control Bar */}
          <div className="p-4 bg-noir-900 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-champagne">
                Chế Độ Xem Trước Popup Thời Gian Thực
              </span>
            </div>

            {/* Device Toggles */}
            <div className="flex items-center gap-2 bg-noir-950 p-1 border border-white/10 rounded-xs">
              <button
                type="button"
                onClick={() => setDeviceMode('desktop')}
                className={`px-3 py-1 text-xs flex items-center gap-1.5 transition-colors ${deviceMode === 'desktop'
                  ? 'bg-champagne text-noir-950 font-medium'
                  : 'text-white/60 hover:text-white'
                  }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Máy Tính (Desktop)</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode('mobile')}
                className={`px-3 py-1 text-xs flex items-center gap-1.5 transition-colors ${deviceMode === 'mobile'
                  ? 'bg-champagne text-noir-950 font-medium'
                  : 'text-white/60 hover:text-white'
                  }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Điện Thoại (Mobile)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Viewport Area */}
          <div className="p-8 flex items-center justify-center overflow-y-auto bg-noir-950/80 min-h-[460px]">
            <div
              className={`transition-all duration-300 ${deviceMode === 'desktop'
                ? 'w-full max-w-2xl bg-noir-900 border border-champagne/30 text-white shadow-2xl flex flex-row overflow-hidden'
                : 'w-[320px] bg-noir-900 border border-champagne/30 text-white shadow-2xl flex flex-col overflow-hidden rounded-md'
                }`}
            >
              {/* Image Section */}
              <div
                className={`relative bg-noir-950 overflow-hidden shrink-0 ${deviceMode === 'desktop' ? 'w-1/2 min-h-[360px]' : 'w-full h-44'
                  }`}
              >
                <img
                  src={currentImage || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200'}
                  alt={title || 'Campaign Mockup'}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute top-2.5 left-2.5 bg-champagne text-noir-950 text-[9px] uppercase font-mono font-bold tracking-widest px-2 py-0.5 flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  <span>Đặc Quyền Maison</span>
                </div>
              </div>

              {/* Content Section */}
              <div
                className={`p-6 flex flex-col justify-between ${deviceMode === 'desktop' ? 'w-1/2' : 'w-full'
                  }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 text-champagne text-[11px] font-mono tracking-widest uppercase mb-1.5">
                    <Tag className="w-3 h-3" />
                    <span>{campaignType === 'flash_sale' ? 'Flash Sale' : 'Sự Kiện Thời Trang'}</span>
                  </div>

                  <h3 className="text-lg font-serif font-light text-white tracking-wide uppercase mb-2 leading-tight">
                    {title || 'Tên Chiến Dịch Khuyến Mãi'}
                  </h3>

                  <p className="text-xs text-ivory-200/80 leading-relaxed font-light mb-4">
                    {subtitle || 'Mô tả tóm tắt ưu đãi đặc quyền từ thương hiệu Atelier Vérité.'}
                  </p>

                  {/* Mock Timer */}
                  <div className="mb-4 p-2.5 bg-noir-950/80 border border-white/10 rounded-xs">
                    <div className="flex items-center gap-1 text-[10px] font-mono text-champagne uppercase tracking-wider mb-1.5">
                      <Clock className="w-3 h-3 animate-pulse" />
                      <span>Ưu Đãi Kết Thúc Sau:</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-xs">
                      <div className="bg-noir-900 py-1 border border-white/5">
                        <span className="block font-bold text-white">08</span>
                        <span className="text-[8px] text-white/50 uppercase">Giờ</span>
                      </div>
                      <div className="bg-noir-900 py-1 border border-white/5">
                        <span className="block font-bold text-white">45</span>
                        <span className="text-[8px] text-white/50 uppercase">Phút</span>
                      </div>
                      <div className="bg-noir-900 py-1 border border-white/5">
                        <span className="block font-bold text-champagne">20</span>
                        <span className="text-[8px] text-white/50 uppercase">Giây</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    className="w-full py-2.5 px-4 bg-champagne text-noir-950 font-serif text-[11px] uppercase tracking-widest font-semibold flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>{ctaText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, ArrowRight, Sparkles, Tag } from 'lucide-react';
import { campaignsApi, bannersApi } from '../api';
import { useConsentStore } from '../consent';
import {
  Campaign,
  CampaignBanner,
  resolveDestinationUrl,
  canShowCampaignPopup,
  recordCampaignDismissal,
} from '../campaigns';

export const PromotionalPopup: React.FC = () => {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [associatedBanner, setAssociatedBanner] = useState<CampaignBanner | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [doNotShowAgainToday, setDoNotShowAgainToday] = useState(false);

  // Consent awareness: Never overlap or preempt Cookie Consent banner/modal
  const isBannerOpen = useConsentStore((state) => state.isBannerOpen);
  const isPreferencesOpen = useConsentStore((state) => state.isPreferencesOpen);
  const isConsentInitialized = useConsentStore((state) => state.isInitialized);
  const consentRecord = useConsentStore((state) => state.consentRecord);

  const calculateCountdown = useCallback((endAtStr: string, remainingSeconds?: number) => {
    if (typeof remainingSeconds === 'number' && remainingSeconds > 0) {
      setRemainingTime(remainingSeconds);
      return;
    }
    const endMs = new Date(endAtStr).getTime();
    const nowMs = Date.now();
    const diff = Math.max(0, Math.floor((endMs - nowMs) / 1000));
    setRemainingTime(diff);
  }, []);

  // Fetch active campaigns and associated banner
  useEffect(() => {
    let isMounted = true;

    async function loadCampaign() {
      try {
        const campaignRes = await campaignsApi.getActiveCampaigns().catch(() => null);
        if (!isMounted) return;

        let campaignsList: Campaign[] = [];
        if (campaignRes?.data?.campaigns) {
          campaignsList = campaignRes.data.campaigns;
        }

        if (!campaignsList || campaignsList.length === 0) {
          // If no campaigns, check if there is an active banner with position 'popup'
          const bannerRes = await bannersApi.getActiveBanners().catch(() => null);
          if (!isMounted) return;

          let bannersList: any[] = [];
          if (Array.isArray(bannerRes?.data)) {
            bannersList = bannerRes.data;
          }

          const popupBanner = bannersList.find((b) => b.position === 'popup' && b.isActive);
          if (popupBanner && canShowCampaignPopup(popupBanner._id || 'banner-popup', 'once_per_session')) {
            const pseudoCampaign: Campaign = {
              _id: popupBanner._id || 'banner-popup',
              name: popupBanner.title,
              slug: 'banner-sale',
              type: 'flash_sale',
              status: 'active',
              startAt: popupBanner.startDate || new Date().toISOString(),
              endAt: popupBanner.endDate || new Date(Date.now() + 86400000).toISOString(),
              priority: popupBanner.sortOrder || 1,
              bannerId: popupBanner,
            };
            setActiveCampaign(pseudoCampaign);
            setAssociatedBanner(popupBanner);
            calculateCountdown(pseudoCampaign.endAt);
            setIsOpen(true);
          }
          return;
        }

        // Sort campaigns by priority descending
        const sorted = [...campaignsList].sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // Find the first campaign that passes the frequency cap
        for (const camp of sorted) {
          if (canShowCampaignPopup(camp._id, 'once_per_session')) {
            setActiveCampaign(camp);

            // Find matching banner if embedded
            let banner: CampaignBanner | null = null;
            if (camp.bannerId && typeof camp.bannerId === 'object') {
              banner = camp.bannerId as CampaignBanner;
            }

            setAssociatedBanner(banner);
            calculateCountdown(camp.endAt, camp.remainingSeconds);
            setIsOpen(true);
            break;
          }
        }
      } catch (err) {
        console.warn('[PromotionalPopup] Could not fetch campaigns:', err);
      }
    }

    // Delay briefly to allow consent to initialize first
    const timer = setTimeout(loadCampaign, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [calculateCountdown]);


  // Countdown ticker
  useEffect(() => {
    if (!isOpen || remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, remainingTime]);

  const handleClose = useCallback(() => {
    if (activeCampaign) {
      const freq = doNotShowAgainToday ? 'once_per_day' : 'once_per_session';
      recordCampaignDismissal(activeCampaign._id, freq);
    }
    setIsOpen(false);
  }, [activeCampaign, doNotShowAgainToday]);

  // Handle focus trapping and keyboard Escape
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElement.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus close button on mount
    const timer = setTimeout(() => {
      const closeBtn = modalRef.current?.querySelector<HTMLElement>('button[data-testid="popup-close"]');
      closeBtn?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen, handleClose]);


  const handleCtaClick = () => {
    if (!activeCampaign) return;

    // Track click if consent allows marketing and banner has ID
    if (associatedBanner?._id && consentRecord?.categories?.marketing) {
      bannersApi.trackClick(associatedBanner._id).catch(() => {});
    }

    // Determine target destination
    let destUrl = '/collections/sale';
    if (associatedBanner?.targetType && associatedBanner?.targetId) {
      destUrl = resolveDestinationUrl(
        associatedBanner.targetType,
        associatedBanner.targetId,
        associatedBanner.linkUrl
      );
    } else if (associatedBanner?.linkUrl) {
      destUrl = associatedBanner.linkUrl;
    } else if (activeCampaign.slug) {
      destUrl = `/products?campaign=${encodeURIComponent(activeCampaign.slug)}`;
    }

    handleClose();
    navigate(destUrl);
  };

  // If consent banner or modal is open, suppress promotional popup
  if (!isOpen || isBannerOpen || isPreferencesOpen || !activeCampaign) {
    return null;
  }

  // Format countdown
  const hours = Math.floor(remainingTime / 3600);
  const minutes = Math.floor((remainingTime % 3600) / 60);
  const seconds = remainingTime % 60;

  const title = associatedBanner?.title || activeCampaign.name;
  const subtitle =
    associatedBanner?.subtitle ||
    (activeCampaign.discountRule?.discountValue
      ? `Ưu đãi độc quyền giảm đến ${activeCampaign.discountRule.discountValue}${
          activeCampaign.discountRule.discountType === 'percentage' ? '%' : 'đ'
        } cho các tuyệt tác Haute Couture.`
      : 'Khám phá ngay các ưu đãi đặc quyền giới hạn thời gian từ Atelier Vérité.');

  const desktopImage =
    associatedBanner?.imageUrl ||
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop';
  const mobileImage = associatedBanner?.mobileImageUrl || desktopImage;
  const ctaText = associatedBanner?.buttonText || 'Khám Phá Ưu Đãi';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="campaign-popup-title"
      aria-describedby="campaign-popup-desc"
      data-testid="promotional-popup"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            handleClose();
          }
        }}
        className="relative w-full max-w-2xl bg-noir-900 border border-champagne/30 text-white rounded-none shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-300 focus:outline-none"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          data-testid="popup-close"
          aria-label="Đóng popup ưu đãi"
          className="absolute top-3 right-3 z-20 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-champagne"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Visual Banner Media */}
        <div className="relative w-full md:w-1/2 min-h-[220px] md:min-h-[380px] bg-noir-950 overflow-hidden shrink-0">
          <picture>
            <source media="(max-width: 767px)" srcSet={mobileImage} />
            <img
              src={desktopImage}
              alt={title}
              className="w-full h-full object-cover object-center filter brightness-90 hover:scale-105 transition-transform duration-700"
              loading="eager"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-noir-900 via-transparent to-transparent md:hidden" />
          <div className="absolute top-3 left-3 bg-champagne text-noir-950 text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-1 flex items-center gap-1 shadow-md">
            <Sparkles className="w-3 h-3" />
            <span>Đặc Quyền Maison</span>
          </div>
        </div>

        {/* Campaign Content & Actions */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-champagne text-xs font-mono tracking-widest uppercase mb-2">
              <Tag className="w-3.5 h-3.5" />
              <span>{activeCampaign.type === 'flash_sale' ? 'Flash Sale Giới Hạn' : 'Sự Kiện Thời Trang'}</span>
            </div>

            <h2
              id="campaign-popup-title"
              className="text-xl sm:text-2xl font-serif font-light text-white tracking-wide uppercase mb-3 leading-tight"
            >
              {title}
            </h2>

            <p id="campaign-popup-desc" className="text-sm text-ivory-200/80 leading-relaxed font-light mb-6">
              {subtitle}
            </p>

            {/* Countdown Timer */}
            {remainingTime > 0 && (
              <div className="mb-6 p-3 bg-noir-950/80 border border-white/10 rounded-sm">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-champagne uppercase tracking-wider mb-2">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Ưu Đãi Kết Thúc Sau:</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center font-mono">
                  <div className="bg-noir-900/90 py-1.5 border border-white/5">
                    <span className="block text-lg font-bold text-white">
                      {String(hours).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-white/50">Giờ</span>
                  </div>
                  <div className="bg-noir-900/90 py-1.5 border border-white/5">
                    <span className="block text-lg font-bold text-white">
                      {String(minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-white/50">Phút</span>
                  </div>
                  <div className="bg-noir-900/90 py-1.5 border border-white/5">
                    <span className="block text-lg font-bold text-champagne">
                      {String(seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-white/50">Giây</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            {/* CTA Button */}
            <button
              onClick={handleCtaClick}
              data-testid="popup-cta"
              className="w-full py-3.5 px-6 bg-champagne hover:bg-champagne-light text-noir-950 font-serif text-xs uppercase tracking-widest font-semibold transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-champagne/20"
            >
              <span>{ctaText}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Frequency Dismiss Option */}
            <div className="mt-4 flex items-center justify-between text-xs text-white/50">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white/80 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={doNotShowAgainToday}
                  onChange={(e) => setDoNotShowAgainToday(e.target.checked)}
                  className="rounded border-white/20 bg-noir-950 text-champagne focus:ring-champagne w-3.5 h-3.5"
                />
                <span className="text-[11px]">Không hiện lại trong hôm nay</span>
              </label>

              <button
                onClick={handleClose}
                className="text-[11px] underline hover:text-white transition-colors"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { campaignsApi, bannersApi } from '../api';
import {
  Campaign,
  CampaignBanner,
  resolveDestinationUrl,
  canShowCampaignPopup,
  recordCampaignDismissal,
} from '../campaigns';
import { useModal, ModalPortal } from '../context/ModalContext';
import { useConsentStore } from '../consent/useConsentStore';

/**
 * Default promotional poster matching the Black Friday Sale design
 * used as the default showcase when no active campaign is configured in the database.
 */
const DEFAULT_POSTER: Campaign = {
  _id: 'default-black-friday-poster',
  name: 'Black Friday Sale - Sẵn Sàng Bứt Phá',
  slug: 'black-friday-sale',
  type: 'flash_sale',
  status: 'active',
  startAt: new Date().toISOString(),
  endAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  priority: 1,
  bannerId: {
    _id: 'banner-black-friday-default',
    title: 'Black Friday Sale - Sẵn Sàng Bứt Phá',
    subtitle: 'Giảm đến 50% + Voucher 20% - Duy nhất hôm nay',
    imageUrl: '/assets/promotions/black-friday-poster.jpg',
    mobileImageUrl: '/assets/promotions/black-friday-poster.jpg',
    buttonText: 'MUA NGAY',
    linkUrl: '/collections/sale',
    targetType: 'category',
    targetId: 'sale',
  } as CampaignBanner,
};

export const PromotionalPopup: React.FC = () => {
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null);
  const [associatedBanner, setAssociatedBanner] = useState<CampaignBanner | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [doNotShowAgainToday, setDoNotShowAgainToday] = useState(false);

  const isBannerOpen = useConsentStore((state) => state.isBannerOpen);
  const isPreferencesOpen = useConsentStore((state) => state.isPreferencesOpen);
  const consentRecord = useConsentStore((state) => state.consentRecord);

  const shouldAllowPopup = !isBannerOpen && !isPreferencesOpen && (!consentRecord || Boolean(consentRecord.categories?.marketing));

  const { overlayZIndex, contentZIndex } = useModal({
    id: 'promotional-popup',
    isOpen: isOpen && Boolean(activeCampaign) && shouldAllowPopup,
    onClose: () => handleClose(),
  });

  // Load campaigns or fallback to default Black Friday poster
  useEffect(() => {
    let isMounted = true;

    async function loadCampaign() {
      try {
        // 1. Try to fetch active campaigns from API
        const campaignRes = await campaignsApi.getActiveCampaigns().catch(() => null);
        if (!isMounted) return;

        let campaignsList: Campaign[] = [];
        if (campaignRes?.data?.campaigns && Array.isArray(campaignRes.data.campaigns)) {
          campaignsList = campaignRes.data.campaigns;
        }

        // 2. Check dynamic campaigns
        if (campaignsList.length > 0) {
          const sorted = [...campaignsList].sort((a, b) => (b.priority || 0) - (a.priority || 0));
          for (const camp of sorted) {
            if (canShowCampaignPopup(camp._id, 'once_per_session')) {
              setActiveCampaign(camp);
              let banner: CampaignBanner | null = null;
              if (camp.bannerId && typeof camp.bannerId === 'object') {
                banner = camp.bannerId as CampaignBanner;
              }
              setAssociatedBanner(banner);
              setIsOpen(true);
              return;
            }
          }
        }

        // 3. If no active campaigns, check active popup banners
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
          setIsOpen(true);
          return;
        }

        // 4. Default Fallback: Always show promotional poster on first visit unless dismissed
        if (canShowCampaignPopup(DEFAULT_POSTER._id, 'once_per_session')) {
          setActiveCampaign(DEFAULT_POSTER);
          setAssociatedBanner(DEFAULT_POSTER.bannerId as CampaignBanner);
          setIsOpen(true);
        }
      } catch (err) {
        console.warn('[PromotionalPopup] Could not fetch campaigns:', err);
        // Fallback gracefully on error
        if (canShowCampaignPopup(DEFAULT_POSTER._id, 'once_per_session')) {
          setActiveCampaign(DEFAULT_POSTER);
          setAssociatedBanner(DEFAULT_POSTER.bannerId as CampaignBanner);
          setIsOpen(true);
        }
      }
    }

    // Delay slightly (600ms) for natural, smooth entrance after initial page paint
    const timer = setTimeout(loadCampaign, 600);

    // Support manual trigger for preview or testing (e.g. window.dispatchEvent(new Event('open-promo-popup')))
    const handleManualTrigger = () => {
      setActiveCampaign(DEFAULT_POSTER);
      setAssociatedBanner(DEFAULT_POSTER.bannerId as CampaignBanner);
      setIsOpen(true);
    };
    window.addEventListener('open-promo-popup', handleManualTrigger);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      window.removeEventListener('open-promo-popup', handleManualTrigger);
    };
  }, []);

  const handleClose = useCallback(() => {
    if (activeCampaign) {
      const freq = doNotShowAgainToday ? 'once_per_day' : 'once_per_session';
      recordCampaignDismissal(activeCampaign._id, freq);
    }
    setIsOpen(false);
  }, [activeCampaign, doNotShowAgainToday]);

  // Focus trapping and Escape key
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

    // Track click if applicable
    if (associatedBanner?._id) {
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

  if (!isOpen || !activeCampaign || !shouldAllowPopup) return null;

  const posterImage =
    associatedBanner?.imageUrl ||
    (typeof DEFAULT_POSTER.bannerId === 'object' ? (DEFAULT_POSTER.bannerId as CampaignBanner)?.imageUrl : '') ||
    '/assets/promotions/black-friday-poster.jpg';

  const title = associatedBanner?.title || activeCampaign.name;

  return (
    <ModalPortal>
      <AnimatePresence>
        {isOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="campaign-popup-title"
            data-testid="promotional-popup"
            className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-sm pointer-events-auto"
            style={{ zIndex: Math.max(overlayZIndex || 200, 200) }}
            onClick={(e) => {
              if (e.target === e.currentTarget) handleClose();
            }}
          >
            {/* Poster Card Container */}
            <motion.div
              ref={modalRef}
              tabIndex={-1}
              initial={{ opacity: 0, scale: 0.88, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              style={{ zIndex: Math.max(contentZIndex || 201, 201) }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.stopPropagation();
                  handleClose();
                }
              }}
              className="relative w-full max-w-[420px] sm:max-w-[460px] flex flex-col items-center focus:outline-none select-none"
            >
              {/* E-Commerce Signature Circular Close Button (top-right) */}
              <button
                type="button"
                onClick={handleClose}
                data-testid="popup-close"
                aria-label="Đóng poster quảng cáo"
                className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-gray-800 shadow-2xl border border-gray-200/90 flex items-center justify-center hover:bg-neutral-100 hover:scale-110 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>

              {/* Poster Body */}
              <div
                onClick={handleCtaClick}
                className="w-full relative rounded-2xl shadow-2xl overflow-hidden cursor-pointer group bg-neutral-900 border border-white/10 transition-transform duration-300 hover:scale-[1.01]"
              >
                <img
                  src={posterImage}
                  alt={title}
                  className="w-full h-auto max-h-[75vh] object-contain sm:object-cover rounded-2xl transition-all duration-500 group-hover:brightness-105"
                  loading="eager"
                />

                {/* Subtle Hover Overlay Hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 rounded-2xl pointer-events-none" />
              </div>

              {/* Accessible Hidden Title */}
              <h2 id="campaign-popup-title" className="sr-only">
                {title}
              </h2>

              {/* Frequency Dismiss Bar */}
              <div className="w-full mt-3 flex items-center justify-between text-xs px-2 text-white/90 drop-shadow">
                <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={doNotShowAgainToday}
                    onChange={(e) => setDoNotShowAgainToday(e.target.checked)}
                    className="rounded border-white/40 bg-black/40 text-amber-500 focus:ring-amber-400 w-3.5 h-3.5 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-[12px] font-medium tracking-wide">Không hiện lại trong hôm nay</span>
                </label>

                <button
                  type="button"
                  onClick={handleClose}
                  className="text-[12px] underline text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  Bỏ qua
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
};

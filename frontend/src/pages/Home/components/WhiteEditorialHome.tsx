import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { bannersApi } from '../../../shared/api';
import './WhiteEditorialHome.css';

import {
  BrandManifestoSection,
  ExploreCollectionsSection,
  CuratedForYouSection,
  InteractiveLookbookSection,
  NewArrivalsSection,
  TrendingBestsellersSection,
  CampaignStoriesSection,
  StylistAiExperienceSection,
  CraftsmanshipDetailsSection,
  FashionJournalSection,
  RecentlyViewedSection,
  PatronReviewsSection,
  ShoppingBenefitsSection,
  FinalEditorialCtaSection,
} from '../sections';

const HERO_FALLBACKS = [
  {
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=2200&q=90',
    caption: 'LOOK 01 / TAILORING IN MOTION',
  },
  {
    image: 'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?auto=format&fit=crop&w=2200&q=90',
    caption: 'LOOK 02 / SOFT STRUCTURE',
  },
  {
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=2200&q=90',
    caption: 'LOOK 03 / AFTER DARK',
  },
];

const arrayFromResponse = (response: any): any[] => {
  const data = response?.data ?? response;
  return Array.isArray(data) ? data : data?.banners || [];
};

const firstImage = (record: any): string =>
  record?.image || record?.image_url || record?.desktopImage || record?.coverImage || record?.thumbnail || '';

export const useSectionInView = (threshold = 0.2) => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
};

export const WhiteEditorialHome: React.FC = () => {
  const [heroImage, setHeroImage] = useState('');
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    bannersApi
      .getActiveBanners()
      .then((bannerResult: any) => {
        if (!active) return;
        const bannerList = arrayFromResponse(bannerResult);
        if (bannerList.length > 0) {
          setHeroImage(firstImage(bannerList[0]));
        }
      })
      .catch(() => {
        // Fallback silently to curated fallbacks
      });

    return () => {
      active = false;
    };
  }, []);

  const slides = useMemo(
    () => [
      { image: heroImage || HERO_FALLBACKS[0].image, caption: HERO_FALLBACKS[0].caption },
      ...HERO_FALLBACKS.slice(1),
    ],
    [heroImage]
  );

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => setSlide((current) => (current + 1) % slides.length),
      6000
    );
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setSlide((current) => (current + 1) % slides.length);
      if (event.key === 'ArrowLeft') setSlide((current) => (current + slides.length - 1) % slides.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length]);

  return (
    <div className="white-editorial">
      {/* =========================================================================
          PROTECTED HERO COMPONENT — STRICTLY UNCHANGED
          Preserves exact classes, structure, text, typography, CTAs & transitions
          ========================================================================= */}
      <section
        className="we-hero"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(event) => {
          touch.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (touch.current === null) return;
          const delta = event.changedTouches[0].clientX - touch.current;
          if (Math.abs(delta) > 35)
            setSlide((current) => (current + (delta < 0 ? 1 : slides.length - 1)) % slides.length);
          touch.current = null;
        }}
      >
        {slides.map((item, index) => (
          <img
            key={item.image}
            className={`we-hero-slide ${slide === index ? 'is-active' : ''}`}
            src={item.image}
            alt="Người mẫu trong lookbook Atelier Vérité"
          />
        ))}
        <div className="we-hero-overlay" />
        <div className="we-slider-progress">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setSlide(index)}
              aria-label={`Chuyển tới slide ${index + 1}`}
              className={`${index < slide ? 'is-complete' : ''} ${index === slide ? 'is-current' : ''}`}
            >
              <i key={`${slide}-${index}`} />
            </button>
          ))}
        </div>
        <div className="we-hero-content">
          <p className="we-kicker">SPRING / SUMMER 2026</p>
          <h1>
            THE QUIET
            <br />
            STATEMENT.
          </h1>
          <div className="we-actions">
            <Link to="/collections" className="we-button we-button-cream">
              KHÁM PHÁ BỘ SƯU TẬP
            </Link>
            <Link to="/products" className="we-button we-button-light">
              XEM TẤT CẢ
            </Link>
          </div>
        </div>
        <p className="we-hero-caption">
          0{slide + 1}/0{slides.length} &nbsp;+&nbsp; {slides[slide].caption}
        </p>
      </section>

      {/* =========================================================================
          EDITORIAL & FUNCTIONAL REDESIGN BELOW HERO (14 MODULAR SECTIONS)
          ========================================================================= */}
      {/* 01. Triết Lý Thương Hiệu & Tôn Chỉ Kiến Trúc May Đo */}
      <BrandManifestoSection />

      {/* 02. Khám Phá Danh Mục & Bộ Sưu Tập (Lưới Bất Đối Xứng 12 Cột) */}
      <ExploreCollectionsSection />

      {/* 03. Tuyển Chọn Cá Nhân Hóa (Hybrid Recommendations & Consent) */}
      <CuratedForYouSection />

      {/* 04. Ấn Phẩm Lookbook Tương Tác & Điểm Chạm Trang Phục (Hotspots) */}
      <InteractiveLookbookSection />

      {/* 05. Y Phục Mùa Mới SS26 (The Edit Spotlight & Quick Add) */}
      <NewArrivalsSection />

      {/* 06. Kiệt Tác Xu Hướng & Bán Chạy (Iconic Silhouettes No. 01 - No. 04) */}
      <TrendingBestsellersSection />

      {/* 07. Chiến Dịch & Câu Chuyện Thời Trang (Active Campaigns & Perks) */}
      <CampaignStoriesSection />

      {/* 08. Không Gian Tư Vấn Phong Cách Cùng Trợ Lý Stylist AI */}
      <StylistAiExperienceSection />

      {/* 09. Nghệ Thuật Chế Tác & Vật Liệu Thượng Tuyển (30M Silk, Savile Row Wool) */}
      <CraftsmanshipDetailsSection />

      {/* 10. Tạp Chí Chuyên Đề Atelier Journal (3 Bài Viết Độc Bản) */}
      <FashionJournalSection />

      {/* 11. Kiệt Tác Vừa Xem (Recently Viewed & Privacy Cleanup) */}
      <RecentlyViewedSection />

      {/* 12. Dấu Ấn Trải Nghiệm & Đánh Giá Từ Giới Mộ Điệu (Patron Reviews) */}
      <PatronReviewsSection />

      {/* 13. Đặc Quyền Dịch Vụ Atelier (4 Trụ Cột Pháp Lý & Concierge) */}
      <ShoppingBenefitsSection />

      {/* 14. Lời Mời Trải Nghiệm Haute Couture (Grand Finale CTA) */}
      <FinalEditorialCtaSection />
    </div>
  );
};

export default WhiteEditorialHome;

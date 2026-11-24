import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Tag, Clock, Sparkles } from 'lucide-react';
import { campaignsApi, bannersApi } from '../../../shared/api';

interface ActiveCampaignData {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  voucherCode: string;
  discountText: string;
  ctaLink: string;
  ctaText: string;
}

export const CampaignStoriesSection: React.FC = () => {
  const [campaign, setCampaign] = useState<ActiveCampaignData>({
    title: 'THE ARCHITECTURAL PROMOTION',
    subtitle: 'ĐẶC QUYỀN MÙA XUÂN HÈ SS26',
    description: 'Ưu đãi đặc quyền dành cho thành viên Patron: Giảm đến 50% cho các thiết kế may đo giới hạn cùng đặc quyền miễn phí vận chuyển găng tay trắng toàn quốc.',
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1800&q=85',
    voucherCode: 'FLASH50',
    discountText: 'GIẢM ĐẾN 50% + VOUCHER 20%',
    ctaLink: '/products',
    ctaText: 'NHẬN ƯU ĐÃI ĐẶC QUYỀN',
  });

  useEffect(() => {
    let active = true;
    Promise.allSettled([campaignsApi.getActiveCampaigns(), bannersApi.getActiveBanners()]).then(
      ([campaignRes, bannerRes]) => {
        if (!active) return;
        if (campaignRes.status === 'fulfilled') {
          const raw = campaignRes.value?.data;
          const list = Array.isArray(raw) ? raw : raw?.campaigns || [];
          const first = list.find((c: any) => c.status === 'active' || c.isActive);
          if (first) {
            setCampaign((prev) => ({
              ...prev,
              title: first.title || first.name || prev.title,
              subtitle: first.subtitle || prev.subtitle,
              description: first.description || prev.description,
              image: first.bannerImage || first.image || prev.image,
              voucherCode: first.voucherCode || first.couponCode || prev.voucherCode,
              discountText: first.discountValue ? `GIẢM ${first.discountValue}%` : prev.discountText,
              ctaLink: first.link || prev.ctaLink,
              ctaText: first.ctaText || prev.ctaText,
            }));
          }
        }
      }
    );

    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      data-testid="section-campaign-stories"
      className="relative w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header Meta */}
        <div className="flex items-center justify-between pb-6 mb-16 border-b border-[var(--border)] text-[11px] font-mono tracking-[0.25em] text-[var(--accent)] uppercase font-semibold">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30">07</span>
            <span>CHIẾN DỊCH QUẢNG CÁO · CAMPAIGN STORIES</span>
          </div>
          <span className="hidden sm:inline-block text-[var(--text-muted)]">ẤN PHẨM MARKETING ĐƯỢC DUYỆT</span>
        </div>

        {/* Full-bleed Cinematic Frame */}
        <div className="relative aspect-[16/10] sm:aspect-[21/9] rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl group">
          <img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
            loading="lazy"
          />

          {/* Cinematic Vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent flex items-center p-8 sm:p-14 lg:p-20 text-white" />

          {/* Campaign Floating Info Content */}
          <div className="absolute inset-0 p-8 sm:p-14 lg:p-20 flex flex-col justify-between text-white pointer-events-none">
            {/* Top Badges */}
            <div className="flex items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-black/60 text-[#D4AF37] border border-[#D4AF37]/40 backdrop-blur-md font-semibold">
                {campaign.subtitle}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono tracking-wider bg-white/10 backdrop-blur-md text-white border border-white/20">
                <Clock className="w-3 h-3 text-[#D4AF37]" /> Thời hạn có hạn
              </span>
            </div>

            {/* Bottom/Center Headline & Perks */}
            <div className="space-y-4 max-w-xl">
              <h3 className="font-serif text-3xl sm:text-5xl text-white font-normal leading-tight tracking-tight">
                {campaign.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/80 font-sans font-light leading-relaxed">
                {campaign.description}
              </p>

              {/* Voucher Chip */}
              <div className="pt-2 flex flex-wrap items-center gap-4 pointer-events-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md">
                  <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="text-xs font-mono tracking-wider text-white">Mã ưu đãi:</span>
                  <span className="text-xs font-mono font-bold text-[#D4AF37] tracking-widest bg-black/50 px-2 py-0.5 rounded">
                    {campaign.voucherCode}
                  </span>
                </div>

                <Link
                  to={campaign.ctaLink}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-mono uppercase tracking-widest font-semibold bg-[#D4AF37] text-black hover:bg-white transition-all shadow-xl"
                >
                  <span>{campaign.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

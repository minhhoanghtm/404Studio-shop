import React, { useState } from 'react';
import { Sparkles, MessageSquare, Search, ShieldCheck, ArrowRight, Bot, Compass, Shirt } from 'lucide-react';

interface AiFeatureTab {
  id: string;
  title: string;
  kicker: string;
  description: string;
  capabilities: string[];
  visualImage: string;
  capsuleBadge: string;
}

const AI_FEATURES: AiFeatureTab[] = [
  {
    id: 'outfit-recommendation',
    title: 'Tư Vấn Phối Đồ Thông Minh',
    kicker: 'AI STYLIST CONCIERGE',
    description: 'Trợ lý Stylist AI hiểu sâu sắc ngôn ngữ thời trang may đo kiến trúc, gợi ý kết hợp áo khoác len, đầm lụa và phụ kiện da hài hòa theo từng sự kiện.',
    capabilities: ['Gợi ý Look Runway chuẩn tỷ lệ', 'Tối ưu bảng màu da & phom dáng', 'Tự động kiểm tra tồn kho tại xưởng'],
    visualImage: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1200&q=85',
    capsuleBadge: 'STYLIST AI · OUTFIT MATCHER',
  },
  {
    id: 'semantic-search',
    title: 'Tìm Kiếm Bằng Ngôn Ngữ Tự Nhiên',
    kicker: 'VECTOR EMBEDDINGS SEARCH',
    description: 'Không cần nhớ mã sản phẩm hay danh mục chính xác. Quý khách chỉ cần miêu tả cảm xúc, ngữ cảnh hoặc chất liệu mong muốn bằng tiếng Việt tự nhiên.',
    capabilities: ['Tìm kiếm ngữ nghĩa không phụ thuộc từ khóa', 'Hiểu ngữ cảnh thời trang cao cấp', 'Trích xuất thuộc tính chất liệu tức thì'],
    visualImage: 'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?auto=format&fit=crop&w=1200&q=85',
    capsuleBadge: 'SEMANTIC AI · ZERO MISS',
  },
  {
    id: 'personalization',
    title: 'Cá Nhân Hóa Gu Thẩm Mỹ',
    kicker: 'TAILORED PREFERENCES',
    description: 'Hệ sinh thái AI ghi nhớ các phom dáng quý khách yêu thích và đề xuất những thiết kế mới nhất phù hợp với phong cách Quiet Luxury riêng biệt.',
    capabilities: ['Học hỏi từ lịch sử xem và giỏ hàng', 'Cập nhật theo sở thích màu sắc', 'Ưu tiên đặc quyền cho Patron VIP'],
    visualImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
    capsuleBadge: 'PATRON AI · PRIVATE ADVISOR',
  },
  {
    id: 'privacy-guard',
    title: 'Bảo Mật Quyền Riêng Tư',
    kicker: 'ZERO DATA LEAKAGE',
    description: 'Tuân thủ nghiêm ngặt Luật 91/2025/QH15 và Nghị định 13/2023/NĐ-CP. Dữ liệu hội thoại của quý khách được bảo mật tuyệt đối, không chia sẻ cho bên thứ ba.',
    capabilities: ['Quyền xóa lịch sử hội thoại bất kỳ lúc nào', 'Mã hóa cấp quân sự AES-256', 'Kiểm soát Cookie tùy biến linh hoạt'],
    visualImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=85',
    capsuleBadge: 'SECURITY GUARD · LUẬT 91/2025',
  },
];

const SUGGESTED_PROMPTS = [
  'Gợi ý outfit đi tiệc tối sang trọng',
  'Tìm áo blazer len tối giản phong cách Quiet Luxury',
  'Tìm đầm lụa Charmeuse mềm mại màu be',
  'Phối âu phục Savile Row cho sự kiện ban ngày',
  'Những thiết kế thời trang nữ mới về trong tuần',
];

export const StylistAiExperienceSection: React.FC = () => {
  const [activeTabId, setActiveTabId] = useState('outfit-recommendation');
  const activeFeature = AI_FEATURES.find((f) => f.id === activeTabId) || AI_FEATURES[0];

  const handleTriggerPrompt = (promptText: string) => {
    // 1. Store prompt for modal consumption
    sessionStorage.setItem('stylist_pending_prompt', promptText);

    // 2. Dispatch custom event for listener in App.tsx
    window.dispatchEvent(new CustomEvent('open-stylist-ai', { detail: { prompt: promptText } }));

    // 3. Fallback: trigger floating button directly if present
    const btn = document.querySelector('button[aria-label="Mở Trợ lý Stylist AI"]') as HTMLButtonElement | null;
    if (btn) btn.click();
  };

  return (
    <section
      data-testid="section-stylist-ai-experience"
      className="w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] bg-[var(--bg-page)] text-[var(--text-primary)] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header Meta */}
        <div className="flex items-center justify-between pb-6 mb-16 border-b border-[var(--border)] text-[11px] font-mono tracking-[0.25em] text-[var(--accent)] uppercase font-semibold">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30">08</span>
            <span>TRỢ LÝ THỜI TRANG ĐỘC QUYỀN · STYLIST AI CONCIERGE</span>
          </div>
          <span className="hidden sm:inline-block text-[var(--text-muted)]">POWERED BY MULTI-PROVIDER AI GATEWAY</span>
        </div>

        {/* Section Title */}
        <div className="max-w-3xl mb-16 space-y-4">
          <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[var(--accent)] font-medium">
            CONCIERGE MAY ĐO CÁ NHÂN HÓA
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[var(--text-primary)] font-normal tracking-tight">
            Trải nghiệm tư vấn phong cách theo thời gian thực
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans font-light leading-relaxed">
            Kết hợp sự thấu hiểu sâu sắc về phom dáng Haute Couture cùng sức mạnh điện toán của mô hình AI thế hệ mới, mang đến lời khuyên trang phục chuẩn xác cho từng vóc dáng và sự kiện.
          </p>
        </div>

        {/* Interactive Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Interactive Feature Tabs */}
          <div className="lg:col-span-6 space-y-4">
            {AI_FEATURES.map((feat) => {
              const isActive = feat.id === activeTabId;
              return (
                <div
                  key={feat.id}
                  onClick={() => setActiveTabId(feat.id)}
                  className={`p-6 sm:p-7 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-[var(--bg-card)] border-[var(--accent)] shadow-xl'
                      : 'bg-transparent border-[var(--border)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-card)]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-[var(--accent)] font-semibold">
                      {feat.kicker}
                    </span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
                    )}
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl text-[var(--text-primary)] font-medium mt-1">
                    {feat.title}
                  </h3>

                  {isActive && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-[var(--border)] animate-fadeIn">
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-sans font-light leading-relaxed">
                        {feat.description}
                      </p>
                      <ul className="space-y-1.5 text-xs text-[var(--text-muted)] font-mono">
                        {feat.capabilities.map((cap, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                            <span>{cap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Column: Visual Preview with Floating Glass Capsule */}
          <div className="lg:col-span-6 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-[var(--border)] shadow-2xl group">
              <img
                src={activeFeature.visualImage}
                alt={activeFeature.title}
                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              {/* Floating Frosted Glass Capsule Card */}
              <div className="absolute bottom-8 left-6 right-6 p-6 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/20 text-white space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37] font-semibold">
                      {activeFeature.capsuleBadge}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-white/60">ONLINE · 24/7</span>
                </div>

                <p className="text-xs sm:text-sm font-sans font-light text-white/90 leading-relaxed italic">
                  "Tôi có thể hỗ trợ quý khách tìm kiếm chiếc áo blazer may đo hoàn hảo hoặc phối một bộ âu phục lụa tơ tằm nguyên bản."
                </p>

                <button
                  type="button"
                  onClick={() => handleTriggerPrompt('Tư vấn phong cách thời trang cho tôi')}
                  className="w-full py-3 rounded-full text-xs font-mono uppercase tracking-wider font-semibold bg-[#D4AF37] text-black hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-lg"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Trò chuyện trực tiếp với Stylist AI</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Suggested Prompts Shelf */}
        <div className="mt-16 pt-12 border-t border-[var(--border)] space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
            <MessageSquare className="w-4 h-4" />
            <span>Gợi ý câu lệnh thử nghiệm (Nhấp để mở hội thoại ngay):</span>
          </div>

          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTriggerPrompt(prompt)}
                className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-sans text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] hover:bg-[var(--accent)]/5 transition-all shadow-sm"
              >
                <span>{prompt}</span>
                <ArrowRight className="w-3 h-3 text-[var(--accent)] opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

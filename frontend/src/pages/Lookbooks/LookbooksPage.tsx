import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Eye, ShoppingBag, X } from 'lucide-react';
import { lookbooksApi } from '@/shared/api';
import { formatCurrency } from '@/shared/utils/formatters';

interface LookbookItem {
  id: string;
  title: string;
  subtitle?: string;
  season?: string;
  year?: string;
  description: string;
  coverImage: string;
  photographer?: string;
  location?: string;
  featuredProducts?: Array<{
    id: string;
    slug: string;
    name: string;
    price: number;
    image: string;
  }>;
}

const FALLBACK_LOOKBOOKS: LookbookItem[] = [
  {
    id: 'lookbook-aw26',
    title: 'Silhouettes of The Void — Thu Đông 2026',
    subtitle: 'Nghiên Cứu Hình Khối Kiến Trúc & Sóng Lụa Lyon',
    season: 'Autumn / Winter',
    year: '2026',
    description: 'Chuyên khảo thời trang khám phá kỹ thuật cắt xéo 45 độ trên lụa dệt 30-momme từ vùng Lyon, đối thoại cùng cấu trúc dạ len đúc khối Biella.',
    coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=1200',
    photographer: 'Hélène de Saint-Germain',
    location: 'Palais de Tokyo, Paris',
    featuredProducts: [
      {
        id: 'p-1',
        slug: 'ao-khoac-da-len-biella-cashmere-coat',
        name: 'Áo Khoác Dạ Len Biella Cashmere Coat',
        price: 58500000,
        image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600',
      },
      {
        id: 'p-2',
        slug: 'dam-lua-lyon-bias-cut-evening-gown',
        name: 'Đầm Lụa Lyon Bias-Cut Evening Gown',
        price: 49500000,
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600',
      },
    ],
  },
  {
    id: 'lookbook-ss27',
    title: 'Aura of Serenity — Xuân Hè 2027',
    subtitle: 'Bản Hòa Ca Của Ánh Sáng & Sợi Tự Nhiên',
    season: 'Spring / Summer',
    year: '2027',
    description: 'Sự giao thoa thanh thoát giữa lanh đũi vùng Normandy và len lông cừu Merino mỏng nhẹ, mang đến cảm giác tự do vô tận dưới nắng hè Địa Trung Hải.',
    coverImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1200',
    photographer: 'Kenji Takahashi',
    location: 'Villa Ephrussi de Rothschild, Côte d\'Azur',
    featuredProducts: [
      {
        id: 'p-3',
        slug: 'ao-so-mi-lanh-normandy-artisan-shirt',
        name: 'Áo Sơ Mi Lanh Normandy Artisan Shirt',
        price: 18500000,
        image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=600',
      },
      {
        id: 'p-4',
        slug: 'quan-tay-ong-suong-florence-wool-trousers',
        name: 'Quần Tây Ống Suông Florence Wool Trousers',
        price: 24000000,
        image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600',
      },
    ],
  },
  {
    id: 'lookbook-monolith',
    title: 'Monolith Leatherworks — BST Phụ Kiện Đồ Da',
    subtitle: 'Nghệ Thuật Khắc Gỗ & Da Box Calfskin Vùng Alsace',
    season: 'Permanent Edition',
    year: '2026',
    description: 'Túi xách cấu trúc điêu khắc với tay cầm gỗ sồi chạm tay và kim loại mạ vàng chải mờ, kết tinh 180 giờ chế tác của nghệ nhân bậc thầy.',
    coverImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1200',
    photographer: 'Marcello Moretti',
    location: 'Atelier Place Vendôme, Paris',
    featuredProducts: [
      {
        id: 'p-5',
        slug: 'tui-xach-dieu-khac-box-calfskin-oak-bag',
        name: 'Túi Xách Điêu Khắc Box Calfskin & Oak Bag',
        price: 68000000,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=600',
      },
    ],
  },
];

export const LookbooksPage: React.FC = () => {
  const [lookbooks, setLookbooks] = useState<LookbookItem[]>(FALLBACK_LOOKBOOKS);
  const [activeLookbook, setActiveLookbook] = useState<LookbookItem | null>(null);

  useEffect(() => {
    const fetchLookbooks = async () => {
      try {
        const res = await lookbooksApi.getLookbooks();
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          setLookbooks(res.data);
        }
      } catch {
        // Fallback already assigned
      }
    };
    fetchLookbooks();
  }, []);

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-surface text-primary">
      <div className="max-w-7xl mx-auto">
        {/* Editorial Heading */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-[0.3em] text-accent block mb-2">
            Thị Giác Sàn Diễn & Nghệ Thuật
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl tracking-wide mb-4">
            Lookbook Nghệ Thuật
          </h1>
          <p className="text-xs sm:text-sm text-secondary leading-relaxed">
            Những thước phim tĩnh ghi lại hơi thở của hình khối và chất liệu. Trải nghiệm nghệ thuật phối đồ Haute Couture qua các chuyên khảo thị giác độc quyền.
          </p>
        </div>

        {/* Lookbook List */}
        <div className="space-y-20">
          {lookbooks.map((lb, index) => (
            <div
              key={lb.id || index}
              className={`flex flex-col ${
                index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'
              } gap-8 lg:gap-16 items-center`}
            >
              {/* Image with overlay action */}
              <div className="w-full lg:w-3/5 relative group overflow-hidden border border-theme">
                <img
                  src={lb.coverImage}
                  alt={lb.title}
                  className="w-full aspect-[16/10] sm:aspect-[16/9] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                  <div className="text-white">
                    <span className="text-[11px] font-mono uppercase tracking-widest text-accent block mb-1">
                      {lb.season} • {lb.year}
                    </span>
                    <span className="text-xs text-white/80 block">
                      Địa điểm: {lb.location || 'Paris'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveLookbook(lb)}
                    className="px-4 py-2 bg-white/20 backdrop-blur-md hover:bg-accent hover:text-black text-white text-xs uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem Tác Phẩm</span>
                  </button>
                </div>
              </div>

              {/* Text Description */}
              <div className="w-full lg:w-2/5 space-y-4">
                <span className="text-xs uppercase tracking-[0.25em] text-accent block">
                  Chuyên khảo #{index + 1}
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl tracking-wide leading-tight">
                  {lb.title}
                </h2>
                {lb.subtitle && (
                  <p className="text-xs uppercase tracking-wider text-secondary font-medium">
                    {lb.subtitle}
                  </p>
                )}
                <p className="text-xs sm:text-sm text-secondary leading-relaxed pt-2">
                  {lb.description}
                </p>

                {lb.photographer && (
                  <div className="pt-2 text-xs text-secondary/80 font-mono">
                    Nhiếp ảnh gia: {lb.photographer}
                  </div>
                )}

                <div className="pt-4 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setActiveLookbook(lb)}
                    className="px-6 py-3 bg-primary text-secondary hover:bg-accent hover:text-black uppercase text-xs tracking-[0.2em] font-medium transition-all duration-300 flex items-center gap-2"
                  >
                    <span>Khám Phá Chi Tiết</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Shoppable Hotspots */}
        {activeLookbook && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface border border-theme max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-sm relative animate-fade-in text-primary">
              <button
                type="button"
                onClick={() => setActiveLookbook(null)}
                className="absolute top-5 right-5 p-2 text-secondary hover:text-primary transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <span className="text-[11px] uppercase tracking-widest text-accent block">
                  Điểm Chạm Mua Sắm Lookbook
                </span>
                <h3 className="font-serif text-2xl tracking-wide mt-1">{activeLookbook.title}</h3>
                <p className="text-xs text-secondary mt-1">{activeLookbook.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeLookbook.featuredProducts?.map((prod) => (
                  <div key={prod.id} className="p-4 border border-theme bg-surface-subtle/50 flex gap-4 items-center">
                    <img src={prod.image} alt={prod.name} className="w-20 h-24 object-cover border border-theme" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-serif text-xs truncate mb-1">{prod.name}</h4>
                      <p className="text-xs font-mono font-bold text-accent mb-2">
                        {formatCurrency(prod.price)}
                      </p>
                      <Link
                        to={`/products/${prod.slug}`}
                        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary hover:text-accent font-medium transition-colors"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Xem Tác Phẩm</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

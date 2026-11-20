import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Search,
  Package,
  FolderTree,
  BookOpen,
  Ticket,
  Sparkles,
  Link2,
} from 'lucide-react';
import { productsApi, categoriesApi, lookbooksApi } from '@/shared/api';
import {
  DestinationType,
  getDestinationPreview,
  isSafeUrl,
} from '@/shared/campaigns';

export interface DestinationValue {
  type: DestinationType;
  targetId?: string;
  rawUrl?: string;
}

interface DestinationSelectorProps {
  value: DestinationValue;
  onChange: (newValue: DestinationValue) => void;
}

export const DestinationSelector: React.FC<DestinationSelectorProps> = ({
  value,
  onChange,
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [lookbooks, setLookbooks] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Fetch real catalog data on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchEntities() {
      setLoadingOptions(true);
      try {
        const [prodRes, catRes, lookRes] = await Promise.allSettled([
          productsApi.getProducts({ limit: 50 }),
          categoriesApi.getCategories(),
          lookbooksApi.getLookbooks(),
        ]);

        if (!isMounted) return;

        if (prodRes.status === 'fulfilled' && prodRes.value?.data) {
          const rawProds = prodRes.value.data as any;
          setProducts(Array.isArray(rawProds) ? rawProds : rawProds?.products || []);
        }

        if (catRes.status === 'fulfilled' && catRes.value?.data) {
          const rawCats = catRes.value.data as any;
          setCategories(Array.isArray(rawCats) ? rawCats : rawCats?.categories || []);
        }

        if (lookRes.status === 'fulfilled' && lookRes.value?.data) {
          const rawLooks = lookRes.value.data as any;
          setLookbooks(Array.isArray(rawLooks) ? rawLooks : rawLooks?.lookbooks || []);
        }
      } catch (err) {
        console.warn('[DestinationSelector] Error fetching entities:', err);
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }

    fetchEntities();
    return () => {
      isMounted = false;
    };
  }, []);

  const preview = getDestinationPreview(value.type, value.targetId, value.rawUrl);
  const isSecurityViolation =
    value.type === 'url' && Boolean(value.rawUrl) && !isSafeUrl(value.rawUrl || '');

  const filteredProducts = products.filter((p) => {
    if (!productSearch) return true;
    const s = productSearch.toLowerCase();
    return (
      p.name?.toLowerCase().includes(s) ||
      p.slug?.toLowerCase().includes(s) ||
      p._id?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-4 bg-noir-950/60 border border-white/10 p-5 rounded-sm">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h4 className="text-sm font-serif uppercase tracking-widest text-champagne font-medium">
            Bộ Chọn Điểm Đến Thông Minh (Smart Redirect)
          </h4>
          <p className="text-xs text-white/50 mt-0.5">
            Xác định trang hoặc sản phẩm khách hàng sẽ được chuyển đến khi nhấp vào banner popup.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {preview.isValid && !isSecurityViolation ? (
            <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-2 py-0.5 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              URL An Toàn
            </span>
          ) : (
            <span className="flex items-center gap-1 text-rose-400 font-mono text-[11px] bg-rose-500/10 px-2 py-0.5 border border-rose-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              URL Không An Toàn
            </span>
          )}
        </div>
      </div>

      {/* Destination Type Tabs / Select */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { type: 'product', label: 'Sản Phẩm', icon: Package },
          { type: 'category', label: 'Danh Mục', icon: FolderTree },
          { type: 'collection', label: 'Bộ Sưu Tập', icon: Sparkles },
          { type: 'lookbook', label: 'Lookbook', icon: BookOpen },
          { type: 'voucher', label: 'Voucher', icon: Ticket },
          { type: 'sale_page', label: 'Trang Sale', icon: Sparkles },
          { type: 'url', label: 'Tùy Chỉnh', icon: Link2 },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = value.type === item.type;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() =>
                onChange({
                  type: item.type as DestinationType,
                  targetId: '',
                  rawUrl: item.type === 'sale_page' ? '/collections/sale' : '',
                })
              }
              className={`p-2.5 flex flex-col items-center justify-center gap-1.5 text-xs transition-all border ${
                isSelected
                  ? 'bg-champagne/15 border-champagne text-champagne font-medium shadow-sm'
                  : 'bg-noir-900/60 border-white/5 text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[11px] tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Target Selector Based on Type */}
      <div className="pt-2">
        {value.type === 'product' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Tìm sản phẩm theo tên hoặc slug..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-noir-900 border border-white/10 rounded-sm pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:border-champagne focus:outline-none"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto border border-white/10 bg-noir-900/80 rounded-sm divide-y divide-white/5">
              {loadingOptions ? (
                <div className="p-4 text-center text-xs text-white/50">Đang tải danh sách sản phẩm...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-xs text-white/50">Không tìm thấy sản phẩm phù hợp.</div>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = value.targetId === (p.slug || p._id);
                  const price = p.new_price ?? p.price ?? 0;
                  return (
                    <div
                      key={p._id}
                      onClick={() =>
                        onChange({
                          ...value,
                          targetId: p.slug || p._id,
                        })
                      }
                      className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors ${
                        isSelected ? 'bg-champagne/10 border-l-2 border-champagne' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-9 h-9 object-cover rounded-xs border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 bg-white/5 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-white/40" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-white font-medium line-clamp-1">{p.name}</p>
                          <p className="text-[10px] text-white/50 font-mono">Slug: {p.slug || p._id}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-champagne shrink-0">
                        {price.toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {value.type === 'category' && (
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
              Chọn Danh Mục Mục Tiêu
            </label>
            <select
              value={value.targetId || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  targetId: e.target.value,
                })
              }
              className="w-full bg-noir-900 border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:border-champagne focus:outline-none"
            >
              <option value="">-- Chọn danh mục thời trang --</option>
              {categories.map((c) => (
                <option key={c._id} value={c.slug || c._id}>
                  {c.name} ({c.slug || c._id})
                </option>
              ))}
            </select>
          </div>
        )}

        {value.type === 'collection' && (
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
              Mã / Slug Bộ Sưu Tập
            </label>
            <input
              type="text"
              placeholder="ví dụ: thu-dong-2026, haute-couture-exclusive"
              value={value.targetId || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  targetId: e.target.value,
                })
              }
              className="w-full bg-noir-900 border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:border-champagne focus:outline-none"
            />
          </div>
        )}

        {value.type === 'lookbook' && (
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
              Chọn Lookbook Thời Trang
            </label>
            <select
              value={value.targetId || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  targetId: e.target.value,
                })
              }
              className="w-full bg-noir-900 border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:border-champagne focus:outline-none"
            >
              <option value="">-- Chọn Lookbook --</option>
              {lookbooks.map((lb) => (
                <option key={lb._id} value={lb.slug || lb._id}>
                  {lb.title} ({lb.slug || lb._id})
                </option>
              ))}
            </select>
          </div>
        )}

        {value.type === 'voucher' && (
          <div className="p-3 bg-noir-900/60 border border-white/5 text-xs text-white/70">
            Khách hàng nhấp vào popup sẽ được chuyển hướng thẳng đến sàn mã giảm giá & ưu đãi (/vouchers).
          </div>
        )}

        {value.type === 'sale_page' && (
          <div className="p-3 bg-noir-900/60 border border-white/5 text-xs text-white/70">
            Khách hàng sẽ được chuyển hướng đến trang các sản phẩm ưu đãi đặc biệt (/collections/sale).
          </div>
        )}

        {value.type === 'url' && (
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
              Nhập Đường Dẫn Tùy Chỉnh (Internal Route hoặc External URL)
            </label>
            <input
              type="text"
              placeholder="ví dụ: /products/ao-khoac-da hoặc https://atelierverite.com/special"
              value={value.rawUrl || ''}
              onChange={(e) =>
                onChange({
                  ...value,
                  rawUrl: e.target.value,
                })
              }
              className={`w-full bg-noir-900 border rounded-sm px-3 py-2 text-xs text-white focus:outline-none ${
                isSecurityViolation
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-white/10 focus:border-champagne'
              }`}
            />
            {isSecurityViolation && (
              <p className="text-[11px] text-rose-400 font-mono">
                Cảnh báo an ninh: URL chứa giao thức không được phép (javascript:, data:, file:, //). Hệ thống sẽ chặn điều hướng này để bảo vệ người dùng.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Destination Preview Bar */}
      <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs bg-noir-900/90 p-3 rounded-sm">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-[11px] font-mono">Đích đến cuối cùng:</span>
          <code className="text-champagne font-mono text-xs bg-black/40 px-2 py-0.5 rounded-xs border border-champagne/20">
            {preview.url}
          </code>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-white/60">{preview.label}</span>
          {preview.isValid && (
            <a
              href={preview.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-champagne hover:underline"
            >
              <span>Thử mở</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

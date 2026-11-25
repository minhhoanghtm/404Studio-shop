import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Download,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useAdminAiStore } from '../../../stores/useAdminAiStore';

// ============================================================================
// 1. KPI METRICS CARD
// ============================================================================

export const AdminAiKpiCard: React.FC<{ data: any }> = ({ data }) => {
  if (!data) return null;

  return (
    <div className="mt-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-md space-y-3">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Chỉ số kinh doanh ({data.period || 'Thời gian thực'})</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">MongoDB Verified</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-[var(--accent)]" />
            <span>Tổng Doanh Thu</span>
          </div>
          <div className="mt-1 text-base font-bold font-mono text-[var(--text)] truncate">
            {data.formattedRevenue || '0 ₫'}
          </div>
        </div>

        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-emerald-500" />
            <span>Tổng Đơn Hàng</span>
          </div>
          <div className="mt-1 text-base font-bold font-mono text-[var(--text)]">
            {data.totalOrders || 0} <span className="text-xs font-normal text-[var(--text-muted)]">đơn</span>
          </div>
        </div>

        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <div className="text-[11px] text-[var(--text-muted)]">AOV đơn đã ghi nhận</div>
          <div className="mt-1 text-sm font-semibold font-mono text-[var(--text)] truncate">
            {data.formattedAov || '0 ₫'}
          </div>
        </div>

        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
          <div className="text-[11px] text-[var(--text-muted)]">Đơn Đã Thanh Toán</div>
          <div className="mt-1 text-sm font-semibold font-mono text-emerald-500">
            {data.paidOrders || 0} / {data.totalOrders || 0}
          </div>
        </div>
      </div>
      <p className="text-[10px] text-[var(--text-muted)]">Doanh thu gồm đơn đã giao và đã thanh toán hoặc thanh toán khi nhận hàng, không tính đơn đã hoàn tiền. Theo ngày tạo đơn: đã giao {data.deliveredOrders || 0}; đã hủy {data.cancelledOrders || 0}; trạng thái đã hoàn tiền {data.refundedOrders || 0}.</p>
    </div>
  );
};

// ============================================================================
// 2. SVG CHART CARD (Line & Bar)
// ============================================================================

export const AdminAiChartCard: React.FC<{ data: any; type?: 'line' | 'bar' }> = ({ data, type = 'line' }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const points = data?.dataPoints || [];
  if (!points || points.length === 0) return null;

  const maxRevenue = Math.max(...points.map((p: any) => p.revenue || 0), 1);
  const chartHeight = 130;
  const chartWidth = 340;
  const paddingX = 20;
  const paddingY = 20;

  // Calculate SVG coordinates
  const stepX = (chartWidth - paddingX * 2) / Math.max(points.length - 1, 1);
  const coordinates = points.map((p: any, idx: number) => {
    const x = paddingX + idx * stepX;
    const y = chartHeight - paddingY - (p.revenue / maxRevenue) * (chartHeight - paddingY * 2);
    return { x, y, ...p };
  });

  const linePath = coordinates.reduce(
    (acc: string, curr: any, idx: number) => (idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`),
    ''
  );

  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} ${chartHeight - paddingY} L ${coordinates[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="mt-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-md space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Biểu đồ doanh thu ({data.period || 'Theo chu kỳ'})</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">
          Cao nhất: {new Intl.NumberFormat('vi-VN', { notation: 'compact', currency: 'VND' }).format(maxRevenue)}₫
        </span>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden flex justify-center py-1">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-32 overflow-visible select-none">
          <defs>
            <linearGradient id="aiChartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={chartHeight - paddingY}
            x2={chartWidth - paddingX}
            y2={chartHeight - paddingY}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={paddingY}
            x2={chartWidth - paddingX}
            y2={paddingY}
            stroke="var(--border)"
            strokeDasharray="3 3"
          />

          {/* Area fill */}
          <path d={areaPath} fill="url(#aiChartGradient)" />

          {/* Main stroke line */}
          <path d={linePath} fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {coordinates.map((pt: any, idx: number) => (
            <g key={idx} onMouseEnter={() => setHoveredIndex(idx)} onMouseLeave={() => setHoveredIndex(null)}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === idx ? 5 : 3}
                fill={hoveredIndex === idx ? '#FFE500' : '#D4AF37'}
                stroke="#1A1A1A"
                strokeWidth="2"
                className="transition-all cursor-pointer"
              />
            </g>
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredIndex !== null && coordinates[hoveredIndex] && (
          <div className="absolute top-2 right-3 p-2 bg-[var(--surface)] border border-[var(--accent)] rounded-lg shadow-lg text-[10px] font-mono pointer-events-none">
            <div className="text-[var(--text-muted)]">{coordinates[hoveredIndex].date}</div>
            <div className="font-bold text-[var(--accent)]">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(coordinates[hoveredIndex].revenue)}
            </div>
            <div className="text-[var(--text)]">{coordinates[hoveredIndex].orders} đơn hàng</div>
          </div>
        )}
      </div>

      <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] px-2 pt-1 border-t border-[var(--border)]">
        <span>{points[0]?.date || ''}</span>
        <span>{points[points.length - 1]?.date || ''}</span>
      </div>
    </div>
  );
};

// ============================================================================
// 3. POSTER PREVIEW CARD
// ============================================================================

export const AdminAiPosterCard: React.FC<{ data: any }> = ({ data }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!data) return null;

  const bgValue = data.background?.value;
  const isRealImage = bgValue && (bgValue.startsWith('http') || bgValue.startsWith('data:'));
  const imageSrc = isRealImage ? bgValue : data.previewUrl || '';
  const designId = data._id || data.designId;
  const studioHref = designId
    ? `/admin/ai-assistant?tab=creative&designId=${encodeURIComponent(String(designId))}`
    : '/admin/ai-assistant?tab=creative';
  const fallbackBgStyle =
    data.background?.type === 'gradient'
      ? { background: `linear-gradient(135deg, ${bgValue || '#1a1918'}, ${data.background?.secondaryValue || '#0d0d0c'})` }
      : { backgroundColor: bgValue && !isRealImage ? bgValue : '#1a1918' };

  return (
    <div className="mt-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-md space-y-3">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Poster AI ({data.preset || 'Instagram 4:5'})</span>
        </span>
        <div className="flex items-center gap-1.5">
          {data.imageProviderUsed && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase">
              {data.imageProviderUsed}
            </span>
          )}
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30 font-bold">
            {data.width} × {data.height}
          </span>
        </div>
      </div>

      {/* Visual Rendered Mockup */}
      <div
        onClick={() => imageSrc && setIsFullscreen(true)}
        className={`relative w-full max-w-[280px] mx-auto rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-neutral-900 group ${imageSrc ? 'cursor-pointer' : ''}`}
        title={imageSrc ? 'Nhấp để xem toàn màn hình' : data.name || 'Poster'}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={data.name || 'Poster'}
            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full aspect-[4/5] flex flex-col items-center justify-center p-4 text-center text-white" style={fallbackBgStyle}>
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-80">AI Assisted Layout</span>
            <span className="mt-2 font-display text-sm font-semibold line-clamp-2">{data.name || 'Poster 404Studio'}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-3">
          <div className="text-white text-xs font-bold truncate drop-shadow">{data.name || 'Poster 404Studio'}</div>
          <span className="text-[9px] font-mono bg-black/60 text-white/90 px-1.5 py-0.5 rounded">
            {data.layers?.length || 7} layers
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`grid ${imageSrc ? 'grid-cols-2' : 'grid-cols-1'} gap-2 pt-1`}>
        <a
          href={studioHref}
          className="py-2 px-3 rounded-lg bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <span>Mở Trong Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </a>

        {imageSrc && (
          <a
            href={imageSrc}
            download={`${data.name || '404Studio_Poster'}.png`}
            className="py-2 px-3 rounded-lg bg-[var(--surface)] hover:bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold text-center flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải Ảnh PNG</span>
          </a>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isFullscreen && imageSrc && (
        <div
          onClick={() => setIsFullscreen(false)}
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={imageSrc}
              alt="Poster Fullscreen"
              className="max-h-[82vh] w-auto object-contain rounded-xl shadow-2xl border border-white/20"
            />
            <div className="mt-3 flex items-center gap-4 text-white text-xs font-mono">
              <span>{data.name}</span>
              <a
                href={imageSrc}
                download={`${data.name || 'Poster'}.png`}
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1 bg-[var(--accent)] text-black rounded font-bold hover:bg-yellow-400"
              >
                Tải Về File Gốc
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. CONFIRMATION REQUIRED CARD (LEVEL 3 ACTIONS)
// ============================================================================

export const AdminAiConfirmationCard: React.FC<{ data: any }> = ({ data }) => {
  const { confirmAction, cancelAction, isLoading } = useAdminAiStore();
  const [isDone, setIsDone] = useState(false);

  if (!data) return null;

  const handleConfirm = async () => {
    const success = await confirmAction(data);
    if (success) setIsDone(true);
  };

  const handleCancel = () => { void cancelAction(data.actionId); };

  if (data.status === 'cancelled') return <div className="mt-3 p-4 rounded-xl bg-[var(--surface)] text-xs">Đã hủy thao tác.</div>;

  if (isDone || data.status === 'confirmed') {
    return (
      <div className="mt-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-xs space-y-2">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Đã thực thi thành công hành động nghiệp vụ!</span>
        </div>
        <p className="text-[var(--text-muted)] text-[11px]">
          Dữ liệu đã được cập nhật an toàn vào cơ sở dữ liệu và ghi nhận vào Audit Log.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/40 shadow-lg space-y-3">
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4" />
          <span>Cần Xác Nhận (Level 3 Mutation)</span>
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
          TTL: 10 phút
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="text-sm font-bold text-[var(--text)]">{data.title}</div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{data.summary}</p>
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={isLoading}
          onClick={handleConfirm}
          className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-600 active:scale-98 text-black font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isLoading ? 'Đang thực hiện...' : 'Xác Nhận Áp Dụng'}</span>
        </button>

        <button
          type="button"
          disabled={isLoading}
          onClick={handleCancel}
          className="py-2 px-3 bg-[var(--surface)] hover:bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] text-xs rounded-lg transition-colors cursor-pointer"
        >
          Hủy bỏ
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// 5. SLOW MOVING & PRODUCT LIST CARD
// ============================================================================

export const AdminAiProductListCard: React.FC<{ data: any }> = ({ data }) => {
  const products = data?.products || [];
  if (products.length === 0) return null;

  return (
    <div className="mt-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-md space-y-3">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-2 text-xs">
        <span className="font-mono font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5" />
          <span>Sản phẩm tồn chậm ({data.totalIdentified || products.length} mẫu)</span>
        </span>
        <span className="text-[10px] font-mono text-[var(--text-muted)]">&gt; {data.daysThreshold || 30} ngày ít bán</span>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {products.map((p: any) => (
          <div key={p.id} className="p-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 truncate">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-9 h-9 rounded object-cover border border-[var(--border)] shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded bg-neutral-800 flex items-center justify-center text-[10px] font-bold shrink-0">404</div>
              )}
              <div className="truncate">
                <div className="font-medium text-[var(--text)] truncate">{p.name}</div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono">{p.formattedPrice} • Tồn: {p.stock}</div>
              </div>
            </div>

            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
              p.clearancePriority === 'high' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
            }`}>
              {p.clearancePriority === 'high' ? 'Ưu tiên xả' : 'Theo dõi'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

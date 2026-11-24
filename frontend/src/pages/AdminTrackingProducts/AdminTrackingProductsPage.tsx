import React, { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '../Admin/AdminLayout';
import { TrackingNav } from '../AdminTracking/components/TrackingNav';
import {
  adminTrackingApi,
  TrackingOverviewMetrics,
  FunnelAnalyticsResponse,
} from '@/shared/api';
import {
  Shirt,
  Sparkles,
  TrendingUp,
  ShoppingBag,
  Zap,
  Eye,
  RefreshCw,
  Award,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const AdminTrackingProductsPage: React.FC = () => {
  const [overview, setOverview] = useState<TrackingOverviewMetrics | null>(null);
  const [funnel, setFunnel] = useState<FunnelAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, funnelRes] = await Promise.all([
        adminTrackingApi.getOverview(),
        adminTrackingApi.getFunnel(),
      ]);
      if (overviewRes?.data) setOverview(overviewRes.data);
      if (funnelRes?.data) setFunnel(funnelRes.data);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403 || err?.message?.toLowerCase().includes('refresh')) return;
      setError(err?.message || 'Không thể nạp dữ liệu phân tích sản phẩm');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatPrice = (amount?: number) => {
    if (!amount) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const rec = overview?.recommendationMetrics || { impressions: 0, clicks: 0, ctrPercentage: 0 };
  const ai = overview?.aiMetrics || { recommendedCount: 0, clickedCount: 0, ctrPercentage: 0, cartActionConfirmedCount: 0 };

  return (
    <AdminLayout
      title="Phân Tích Tương Tác Sản Phẩm & Gợi Ý AI"
      subtitle="Đánh giá hiệu quả kinh doanh của các thiết kế thời trang, công cụ gợi ý và Stylist AI"
    >
      <div className="space-y-6">
        <TrackingNav />

        {/* Action Header */}
        <div className="flex items-center justify-between bg-noir-900/60 p-4 border border-white/10 rounded-sm">
          <div className="flex items-center gap-2">
            <Shirt className="w-4 h-4 text-champagne" />
            <span className="text-xs uppercase tracking-wider text-white font-medium">
              Chỉ số tương tác sản phẩm dựa trên sự kiện thực tế
            </span>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="p-2 border border-white/15 hover:border-champagne text-platinum-dark hover:text-champagne rounded-sm transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-sm bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchData}
              className="px-3 py-1 bg-red-900/60 border border-red-400/40 rounded uppercase text-[10px]"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Intelligence & AI Recommendation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recommendation Engine Card */}
          <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-champagne">
                Thuật Toán Gợi Ý Cá Nhân Hóa
              </span>
              <Sparkles className="w-4 h-4 text-champagne" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="font-display text-3xl text-white font-bold">{rec.ctrPercentage}%</h3>
              <span className="text-xs text-platinum-dark font-mono">Tỷ lệ nhấp (CTR)</span>
            </div>
            <div className="space-y-1 text-xs text-platinum-dark border-t border-white/5 pt-2 font-mono">
              <div className="flex justify-between">
                <span>Số lượt hiển thị (Impressions):</span>
                <span className="text-white font-semibold">{rec.impressions.toLocaleString('vi-VN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Số lượt nhấp vào xem (Clicks):</span>
                <span className="text-champagne font-semibold">{rec.clicks.toLocaleString('vi-VN')}</span>
              </div>
            </div>
          </div>

          {/* Stylist AI Assistant Engagement */}
          <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-purple-400">
                Trợ Lý Stylist AI Maison
              </span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="font-display text-3xl text-purple-400 font-bold">{ai.ctrPercentage}%</h3>
              <span className="text-xs text-platinum-dark font-mono">Tương tác gợi ý</span>
            </div>
            <div className="space-y-1 text-xs text-platinum-dark border-t border-white/5 pt-2 font-mono">
              <div className="flex justify-between">
                <span>Sản phẩm được AI đề xuất:</span>
                <span className="text-white font-semibold">{ai.recommendedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Lượt click vào đề xuất:</span>
                <span className="text-purple-300 font-semibold">{ai.clickedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Hành động thêm giỏ được xác nhận:</span>
                <span className="text-emerald-400 font-semibold">{ai.cartActionConfirmedCount}</span>
              </div>
            </div>
          </div>

          {/* Funnel Conversion Quick Glance */}
          <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400">
                Hiệu Quả Chuyển Đổi Mua Hàng
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <h3 className="font-display text-3xl text-emerald-400 font-bold">
                {funnel?.sessionFunnel && funnel.sessionFunnel.length > 0
                  ? `${Math.round(
                      ((funnel.sessionFunnel[funnel.sessionFunnel.length - 1]?.count || 0) /
                        (funnel.sessionFunnel[0]?.count || 1)) *
                        100
                    )}%`
                  : '0%'}
              </h3>
              <span className="text-xs text-platinum-dark font-mono">Hoàn tất / Xem</span>
            </div>
            <div className="space-y-1 text-xs text-platinum-dark border-t border-white/5 pt-2 font-mono">
              <div className="flex justify-between">
                <span>Xem sản phẩm:</span>
                <span className="text-white font-semibold">{funnel?.rawStages?.['view_product'] ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Thêm vào giỏ:</span>
                <span className="text-white font-semibold">{funnel?.rawStages?.['add_to_cart'] ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Đơn hàng hoàn tất:</span>
                <span className="text-emerald-400 font-semibold">{funnel?.rawStages?.['purchase_completed'] ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Silhouette Products Table */}
        <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-champagne" />
              <h3 className="text-xs uppercase tracking-wider text-white font-semibold">
                Bảng Xếp Hạng Sản Phẩm Có Sức Hút Cao Nhất (Top Viewed Silhouettes)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-platinum-dark">Dữ liệu thực từ MongoDB</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-platinum-dark">Đang nạp dữ liệu sản phẩm...</div>
          ) : overview?.topViewedProducts && overview.topViewedProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-noir-950 text-platinum-dark text-[11px] uppercase font-mono border-b border-white/10">
                  <tr>
                    <th className="px-5 py-3">Hạng</th>
                    <th className="px-5 py-3">Sản Phẩm</th>
                    <th className="px-5 py-3 font-mono">Giá Niêm Yết</th>
                    <th className="px-5 py-3 text-right">Lượt Xem Thực</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {overview.topViewedProducts.map((prod, idx) => (
                    <tr key={prod._id || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-champagne">
                        #{idx + 1}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {prod.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="w-12 h-12 object-cover rounded-sm border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-white/5 rounded-sm border border-white/10 flex items-center justify-center text-platinum-dark shrink-0">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <h4 className="text-white font-medium text-sm">{prod.name}</h4>
                            <span className="text-[11px] font-mono text-platinum-dark">
                              ID: {prod._id}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-champagne font-semibold">
                        {formatPrice(prod.price)}
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-base font-bold text-white">
                        {prod.views?.toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-platinum-dark italic py-8 text-center">
              Chưa có dữ liệu lượt xem sản phẩm nào trong hệ thống.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

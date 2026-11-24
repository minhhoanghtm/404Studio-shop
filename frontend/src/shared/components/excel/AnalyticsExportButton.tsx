import React, { useState } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';
import { exportAnalyticsReportToExcel, AnalyticsExportData } from '@/shared/utils/excel/analyticsExcel';
import { adminApi, productsApi, adminTrackingApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { useAuthStore } from '@/shared/stores/useAuthStore';

interface AnalyticsExportButtonProps {
  periodLabel?: string;
  className?: string;
}

export const AnalyticsExportButton: React.FC<AnalyticsExportButtonProps> = ({
  periodLabel = 'Toàn bộ thời gian',
  className = '',
}) => {
  const { addToast } = useToastStore();
  const { user } = useAuthStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    addToast('Đang thu thập số liệu kinh doanh và báo cáo từ máy chủ...', 'info');

    try {
      const [kpiRes, orderStatsRes, revRes, prodRes, trackingRes] = await Promise.allSettled([
        adminApi.getStats(),
        adminApi.getOrderStats(),
        adminApi.getRevenue('month'),
        productsApi.getProducts({ limit: 500 }),
        adminTrackingApi.getFunnel(),
      ]);

      const kpis = kpiRes.status === 'fulfilled' && kpiRes.value?.data ? kpiRes.value.data : undefined;
      const orderStats = orderStatsRes.status === 'fulfilled' && orderStatsRes.value?.data ? orderStatsRes.value.data : undefined;
      const revenueTimeline = revRes.status === 'fulfilled' && revRes.value?.data && Array.isArray(revRes.value.data)
        ? revRes.value.data
        : undefined;

      const rawProducts = prodRes.status === 'fulfilled' && prodRes.value?.data
        ? (Array.isArray(prodRes.value.data) ? prodRes.value.data : (prodRes.value.data as any).products || [])
        : [];

      const products = rawProducts.map((p: any) => ({
        _id: p._id || p.id,
        name: p.name || 'Sản phẩm',
        slug: p.slug || '',
        categoryName: p.category_id?.name || p.categoryName || 'Thời Trang',
        old_price: p.old_price,
        new_price: p.new_price,
        stock: Number(p.stock || 0),
        variantsCount: Array.isArray(p.variants) ? p.variants.length : 1,
        is_active: p.is_active !== false,
      }));

      const funnelData = trackingRes.status === 'fulfilled' && trackingRes.value?.data
        ? (trackingRes.value.data as any)
        : undefined;

      const rawStages = funnelData?.sessionFunnel || funnelData?.userFunnel;
      const trackingFunnel = rawStages && Array.isArray(rawStages) && rawStages.length > 0
        ? {
            stages: rawStages.map((s: any) => ({
              stage: s.stage || '',
              name:
                s.stage === 'view_home'
                  ? 'Xem Trang Chủ'
                  : s.stage === 'view_item'
                  ? 'Xem Chi Tiết Sản Phẩm'
                  : s.stage === 'add_to_cart'
                  ? 'Thêm Vào Giỏ Hàng'
                  : s.stage === 'begin_checkout'
                  ? 'Tiến Hành Đặt Hàng'
                  : s.stage === 'purchase'
                  ? 'Hoàn Tất Mua Hàng'
                  : s.stage || '',
              count: Number(s.count || 0),
              conversionRate: Number(s.conversionRate || 0),
              dropoffRate: Number(s.dropOffRate || 0),
            })),
            overallConversionRate:
              rawStages.length > 0
                ? rawStages[rawStages.length - 1]?.conversionRate
                : undefined,
          }
        : undefined;

      const exportPayload: AnalyticsExportData = {
        periodLabel,
        adminName: user?.name || 'Admin Haute Couture',
        adminEmail: user?.email || 'admin@atelierverite.com',
        kpis,
        orderStats,
        revenueTimeline,
        products: products.length > 0 ? products : undefined,
        trackingFunnel,
      };

      await exportAnalyticsReportToExcel(exportPayload);
      addToast('Xuất báo cáo kinh doanh và thống kê Excel thành công!', 'success');
    } catch (err: any) {
      addToast(`Lỗi khi tạo báo cáo: ${err?.message || 'Không thể xuất dữ liệu'}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className={`px-3.5 py-2 text-xs font-mono uppercase tracking-wider text-[var(--text-primary)] hover:text-[var(--accent)] hover:border-[var(--accent)] bg-[var(--bg-card)] hover:bg-[var(--bg-card-muted)] border border-[var(--border)] rounded-lg transition-all shadow-xs hover:shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${className}`}
      title="Xuất báo cáo thống kê đa chiều ra tệp Excel (.xlsx)"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
          <span>Đang Xuất Báo Cáo...</span>
        </>
      ) : (
        <>
          <FileSpreadsheet className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Xuất Báo Cáo Excel</span>
        </>
      )}
    </button>
  );
};

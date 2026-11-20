import React from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from './AccountLayout';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { useLoyalty } from '../../shared/hooks/useLoyalty';
import { ArrowRight, Sparkles, MapPin, ShieldCheck, Award } from 'lucide-react';
import { formatCurrency } from '../../shared/utils/formatters';

export const AccountDashboardPage: React.FC = () => {
  const { user, orders } = useAuthStore();
  const { profile } = useLoyalty();
  const recentOrder = orders[0];
  const currentTier = profile?.currentTier;
  const nextTier = profile?.nextTier;
  const qualifyingPoints = profile?.qualifyingPoints || 0;
  const pointsToNextTier = profile?.pointsToNextTier || 0;

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-ultra text-[var(--accent)]">
            TỔNG QUAN HỒ SƠ PATRON
          </span>
          <h2 className="font-display text-2xl sm:text-3xl text-[var(--text)] tracking-wide">
            Đặc quyền Thành viên & Tổng quan
          </h2>
        </div>

        {/* Tier Status Card */}
        <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--accent)]/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-[var(--accent)]" />
              <h4 className="font-display text-lg text-[var(--text)]">
                Cấp Hạng Thành Viên: <span className="text-[var(--accent)] font-bold">{currentTier?.nameVi || 'Đồng I'}</span>
              </h4>
              <span className="text-xs font-mono text-[var(--accent)] bg-[var(--accent)]/10 px-2.5 py-0.5 rounded-full border border-[var(--accent)]/30">
                {qualifyingPoints.toLocaleString('vi-VN')} điểm
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)] font-sans">
              {nextTier ? (
                <span>
                  Bạn đang ở nhóm <strong className="text-[var(--text)]">{currentTier?.nameEn}</strong>. Cần thêm{' '}
                  <strong className="text-[var(--accent)] font-mono">{pointsToNextTier.toLocaleString('vi-VN')} điểm</strong> nữa để thăng hạng lên{' '}
                  <strong className="text-[var(--text)]">{nextTier.nameVi}</strong>.
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  Quý khách đang sở hữu cấp hạng vinh dự tối thượng Kim Cương III của Maison.
                </span>
              )}
            </p>
          </div>
          <Link
            to="/account/loyalty"
            className="text-xs font-mono text-[var(--accent)] hover:text-[var(--accent-contrast)] bg-[var(--accent)]/10 hover:bg-[var(--accent)] px-3.5 py-2 rounded-full border border-[var(--accent)]/30 self-start sm:self-auto flex items-center gap-1.5 transition-colors font-medium"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xem chi tiết sổ cái điểm & đặc quyền</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Recent Order Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-[var(--text)]">Đơn hàng gần đây nhất</h3>
            <Link
              to="/orders"
              className="text-xs uppercase tracking-wider text-[var(--accent)] hover:underline flex items-center gap-1 font-sans"
            >
              <span>Xem tất cả đơn hàng ({orders.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentOrder ? (
            <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] pb-4 text-xs font-sans gap-2">
                <div>
                  <span className="font-mono text-[var(--accent)] font-bold">{recentOrder.orderNumber}</span>
                  <span className="text-[var(--text-muted)] ml-3">{recentOrder.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] uppercase border border-emerald-500/20">
                    {recentOrder.status === 'delivered'
                      ? 'Đã giao thành công'
                      : recentOrder.status === 'processing'
                      ? 'Đang chuẩn bị'
                      : 'Đang chuyển phát'}
                  </span>
                  <span className="font-mono text-[var(--text)] font-semibold">
                    {formatCurrency(recentOrder.total)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {recentOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-xs">
                    <img
                      src={item.image}
                      alt=""
                      className="w-12 h-14 object-cover rounded bg-[var(--bg-alt)] border border-[var(--border)]"
                    />
                    <div>
                      <p className="font-serif text-[var(--text)] font-medium">{item.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Số lượng: {item.quantity} • {item.color} • Cỡ {item.size}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  to={`/orders/${recentOrder.id}`}
                  className="text-xs uppercase tracking-wider text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <span>Chi tiết đơn hàng & Biên lai lưu trữ</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-center text-xs text-[var(--text-muted)]">
              Quý khách chưa có đơn hàng nào được ghi nhận.
            </div>
          )}
        </div>

        {/* Quick Shortcut Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <Link
            to="/account/addresses"
            className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[var(--accent)]" />
              <div>
                <h5 className="font-display text-sm text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                  Sổ địa chỉ giao hàng
                </h5>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {user?.addresses.length || 0} địa chỉ giao hàng găng tay trắng
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
          </Link>

          <Link
            to="/account/settings"
            className="p-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--accent)]/50 transition-colors flex items-center justify-between group shadow-sm"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[var(--accent)]" />
              <div>
                <h5 className="font-display text-sm text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                  Cài đặt bảo mật & Hồ sơ
                </h5>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Thông tin cá nhân, liên hệ và ưu tiên thông báo
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
          </Link>
        </div>
      </div>
    </AccountLayout>
  );
};

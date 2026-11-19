import React from 'react';
import { Link } from 'react-router-dom';
import { AccountLayout } from './AccountLayout';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { useLoyalty } from '../../shared/hooks/useLoyalty';
import { Package, ArrowRight, Sparkles, MapPin, ShieldCheck, Award } from 'lucide-react';
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
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            TỔNG QUAN HỒ SƠ PATRON
          </span>
          <h2 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
            Đặc quyền Thành viên & Tổng quan
          </h2>
        </div>

        {/* Tier Status Card */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-noir-950 via-noir-850 to-noir-900 border border-champagne/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-champagne" />
              <h4 className="font-display text-lg text-white">
                Cấp Hạng Thành Viên: <span className="text-champagne font-bold">{currentTier?.nameVi || 'Đồng I'}</span>
              </h4>
              <span className="text-xs font-mono text-champagne bg-champagne/10 px-2.5 py-0.5 rounded-full border border-champagne/30">
                {qualifyingPoints.toLocaleString('vi-VN')} điểm
              </span>
            </div>
            <p className="text-xs text-platinum-dark font-sans">
              {nextTier ? (
                <span>
                  Bạn đang ở nhóm <strong className="text-white">{currentTier?.nameEn}</strong>. Cần thêm{' '}
                  <strong className="text-champagne font-mono">{pointsToNextTier.toLocaleString('vi-VN')} điểm</strong> nữa để thăng hạng lên{' '}
                  <strong className="text-white">{nextTier.nameVi}</strong>.
                </span>
              ) : (
                <span className="text-cyan-300 font-medium">
                  Quý khách đang sở hữu cấp hạng vinh dự tối thượng Kim Cương III của Maison.
                </span>
              )}
            </p>
          </div>
          <Link
            to="/account/loyalty"
            className="text-xs font-mono text-champagne hover:text-white bg-champagne/10 hover:bg-champagne/20 px-3.5 py-2 rounded-full border border-champagne/30 self-start sm:self-auto flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xem chi tiết sổ cái điểm & đặc quyền</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Recent Order Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-white">Đơn hàng gần đây nhất</h3>
            <Link
              to="/orders"
              className="text-xs uppercase tracking-wider text-champagne hover:underline flex items-center gap-1 font-sans"
            >
              <span>Xem tất cả đơn hàng ({orders.length})</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentOrder ? (
            <div className="p-6 rounded-xl bg-noir-950 border border-white/5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 text-xs font-sans gap-2">
                <div>
                  <span className="font-mono text-champagne font-bold">{recentOrder.orderNumber}</span>
                  <span className="text-platinum-dark ml-3">{recentOrder.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-mono text-[10px] uppercase">
                    {recentOrder.status === 'delivered'
                      ? 'Đã giao thành công'
                      : recentOrder.status === 'processing'
                      ? 'Đang chuẩn bị'
                      : 'Đang chuyển phát'}
                  </span>
                  <span className="font-mono text-white font-semibold">
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
                      className="w-12 h-14 object-cover rounded bg-noir-900 border border-white/10"
                    />
                    <div>
                      <p className="font-serif text-white font-medium">{item.name}</p>
                      <p className="text-[11px] text-platinum-dark">
                        Số lượng: {item.quantity} • {item.color} • Cỡ {item.size}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  to={`/orders/${recentOrder.id}`}
                  className="text-xs uppercase tracking-wider text-champagne hover:underline inline-flex items-center gap-1"
                >
                  <span>Chi tiết đơn hàng & Biên lai lưu trữ</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-noir-950 border border-white/5 text-center text-xs text-platinum-dark">
              Quý khách chưa có đơn hàng nào được ghi nhận.
            </div>
          )}
        </div>

        {/* Quick Shortcut Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <Link
            to="/account/addresses"
            className="p-5 rounded-xl bg-noir-950 border border-white/5 hover:border-champagne/40 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-champagne" />
              <div>
                <h5 className="font-display text-sm text-white group-hover:text-champagne transition-colors">
                  Sổ địa chỉ giao hàng
                </h5>
                <p className="text-[11px] text-platinum-dark">
                  {user?.addresses.length || 0} địa chỉ giao hàng găng tay trắng
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-champagne transition-colors" />
          </Link>

          <Link
            to="/account/settings"
            className="p-5 rounded-xl bg-noir-950 border border-white/5 hover:border-champagne/40 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-champagne" />
              <div>
                <h5 className="font-display text-sm text-white group-hover:text-champagne transition-colors">
                  Cài đặt bảo mật & Hồ sơ
                </h5>
                <p className="text-[11px] text-platinum-dark">
                  Thông tin cá nhân, liên hệ và ưu tiên thông báo
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-champagne transition-colors" />
          </Link>
        </div>
      </div>
    </AccountLayout>
  );
};

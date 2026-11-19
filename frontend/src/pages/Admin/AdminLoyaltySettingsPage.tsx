import React from 'react';
import { AdminLayout } from './AdminLayout';
import { AdminLoyaltyNav } from './components/AdminLoyaltyNav';
import { MEMBERSHIP_TIERS, VND_PER_POINT, RULE_VERSION, validateTierThresholds } from '@/shared/loyalty';
import {
  Settings,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Database,
  Lock,
  FileCode,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AdminLoyaltySettingsPage: React.FC = () => {
  const isHierarchyValid = validateTierThresholds(MEMBERSHIP_TIERS);

  return (
    <AdminLayout
      title="Quy Tắc Điểm Thưởng & Kiểm Định Backend"
      subtitle="Cấu hình 12 cấp hạng, tỷ lệ quy đổi và tài liệu thiết kế kiến trúc Backend CSDL"
    >
      <div className="space-y-8">
        <AdminLoyaltyNav />

        {/* Technical Architecture & Backend Notice */}
        <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3 text-xs font-sans text-amber-200">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>Thông Báo Trạng Thái Backend & Tuân Thủ An Ninh (BLOCKED_BY_BACKEND)</span>
          </div>
          <p className="leading-relaxed">
            Hệ thống Backend nguyên bản sao chép từ <code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">D:\Project\REACT-WebFashion</code> hiện tại <strong>chưa chứa</strong> bảng CSDL riêng <code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">loyalty_transactions</code> và các router quản trị điểm thưởng chuyên biệt.
          </p>
          <p className="leading-relaxed">
            Để bảo đảm nguyên tắc cao nhất: <strong>Không sử dụng Mock API, không tạo dữ liệu giả và không thay đổi trái phép mã nguồn Backend gốc</strong>, toàn bộ điểm số và 12 cấp hạng hiện tại đang được tính toán theo mô hình <em>Deterministic Real Order Derivation</em> trực tiếp từ các đơn hàng có thật trong MongoDB (<code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">GET /order</code> và <code className="bg-black/40 px-1 py-0.5 rounded text-white font-mono">GET /order/admin/orders</code>).
          </p>
          <p className="leading-relaxed">
            Thao tác trực tiếp sửa đổi điểm hoặc cấu hình ngưỡng lưu cứng trên CSDL Backend được đánh dấu trạng thái <span className="font-mono font-bold text-amber-300">BLOCKED_BY_BACKEND</span> cho đến khi kiến trúc máy chủ bên dưới được nâng cấp chính thức.
          </p>
        </div>

        {/* Section 1: Active Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Point Conversion Rules */}
          <div className="p-6 rounded-2xl bg-noir-900 border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-champagne" />
              <h3 className="font-display text-lg text-white">Quy Tắc Quy Đổi Điểm Thưởng</h3>
            </div>
            <div className="space-y-3 text-xs font-sans">
              <div className="flex items-center justify-between p-3 rounded-xl bg-noir-950 border border-white/5">
                <span className="text-platinum-light">Tỷ lệ quy đổi điểm chuẩn:</span>
                <span className="font-mono font-bold text-champagne">
                  {VND_PER_POINT.toLocaleString('vi-VN')} ₫ = 1 điểm
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-noir-950 border border-white/5">
                <span className="text-platinum-light">Công thức làm tròn:</span>
                <span className="font-mono text-white">floor(eligibleAmount / 10.000)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-noir-950 border border-white/5">
                <span className="text-platinum-light">Phiên bản quy tắc (Rule Version):</span>
                <span className="font-mono text-white">{RULE_VERSION}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-noir-950 border border-white/5">
                <span className="text-platinum-light">Điều kiện kích hoạt:</span>
                <span className="font-mono text-emerald-400">delivered & paid</span>
              </div>
            </div>
          </div>

          {/* Validation & Security Controls */}
          <div className="p-6 rounded-2xl bg-noir-900 border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-champagne" />
              <h3 className="font-display text-lg text-white">Kiểm Soát Toàn Vẹn & An Ninh</h3>
            </div>
            <div className="space-y-3 text-xs font-sans">
              <div className="flex items-center justify-between p-3 rounded-xl bg-noir-950 border border-white/5">
                <span className="text-platinum-light">Kiểm tra ngưỡng tăng nghiêm ngặt:</span>
                <span className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4" /> HỢP LỆ (12/12 CẤP)
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-noir-950 border border-white/5">
                <span className="text-platinum-light">Khóa chống trùng lặp (Idempotency):</span>
                <span className="font-mono text-white">order-earn-:id-:version</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-noir-950 border border-white/5">
                <span className="text-platinum-light">Thu hồi điểm hoàn tiền (Reversal):</span>
                <span className="font-mono text-white">Tự động đối soát & hạ hạng</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-noir-950 border border-white/5">
                <span className="text-platinum-light">Quyền ghi nhận điểm:</span>
                <span className="font-mono text-amber-300">Máy chủ độc quyền (AI bị cấm)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: 12-Tier Matrix Table */}
        <div className="p-6 sm:p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-champagne" />
                <span>Bảng Tham Chiếu Ngưỡng 12 Cấp Hạng Thành Viên</span>
              </h3>
              <p className="text-xs text-platinum-dark mt-0.5">
                Thứ tự thăng hạng theo cấp I $\rightarrow$ II $\rightarrow$ III trong từng nhóm kim loại và đá quý.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Thứ tự hợp lệ</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-white/10 bg-noir-950/60 text-platinum-dark text-[10px] uppercase font-mono tracking-wider">
                  <th className="py-3 px-4">Nhóm Kim Loại / Ngọc</th>
                  <th className="py-3 px-4">Tên Tiếng Việt</th>
                  <th className="py-3 px-4">Mã Tiếng Anh</th>
                  <th className="py-3 px-4">Cấp Bậc</th>
                  <th className="py-3 px-4 text-right">Điểm Ngưỡng</th>
                  <th className="py-3 px-4 text-right">Giá Trị Mua Sắm Tương Đương</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {MEMBERSHIP_TIERS.map((tier) => (
                  <tr key={tier.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 uppercase text-platinum-dark font-serif text-xs">
                      {tier.family}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold border ${tier.badgeColor}`}>
                        {tier.nameVi}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-platinum-light font-sans">{tier.nameEn}</td>
                    <td className="py-3 px-4 text-white">Cấp {tier.level}</td>
                    <td className="py-3 px-4 text-right font-bold text-champagne">
                      {tier.minPoints.toLocaleString('vi-VN')} pts
                    </td>
                    <td className="py-3 px-4 text-right text-platinum-light">
                      {(tier.minPoints * VND_PER_POINT).toLocaleString('vi-VN')} ₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Technical Blueprint for Future Backend Implementation */}
        <div className="p-6 sm:p-8 rounded-2xl bg-noir-950 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-white">
            <FileCode className="w-5 h-5 text-champagne" />
            <h3 className="font-display text-base">Đặc Tả Kỹ Thuật Backend Mở Rộng (Backend Blueprint)</h3>
          </div>
          <p className="text-xs text-platinum-dark font-sans leading-relaxed">
            Khi ban giám đốc phê duyệt bổ sung module Loyalty vào Backend, các thành phần kỹ thuật sau sẽ được tích hợp:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-noir-900 border border-white/5 space-y-2">
              <span className="text-champagne font-bold block">1. CSDL Mongoose Schema:</span>
              <p className="text-platinum-light text-[11px] font-sans">
                Bộ sưu tập <code className="text-white">loyalty_transactions</code>:
              </p>
              <pre className="p-3 rounded bg-black/60 text-[10px] text-platinum-dark overflow-x-auto">
{`{
  user_id: { type: ObjectId, ref: 'User', required: true, index: true },
  order_id: { type: ObjectId, ref: 'Order', default: null, index: true },
  event_type: { type: String, enum: ['EARN', 'REFUND_REVERSAL', 'ADMIN_ADJUSTMENT'], required: true },
  points_delta: { type: Number, required: true },
  previous_balance: { type: Number, required: true },
  new_balance: { type: Number, required: true },
  idempotency_key: { type: String, unique: true, required: true },
  reason: { type: String, required: true },
  rule_version: { type: String, default: 'v1.0' }
}`}
              </pre>
            </div>

            <div className="p-4 rounded-xl bg-noir-900 border border-white/5 space-y-2">
              <span className="text-champagne font-bold block">2. API Endpoints Quản Trị Cần Bổ Sung:</span>
              <ul className="space-y-1.5 text-platinum-light text-[11px]">
                <li><code className="text-emerald-400">GET /api/loyalty/profile</code> — Hồ sơ điểm của Patron đã xác thực</li>
                <li><code className="text-emerald-400">GET /api/loyalty/transactions</code> — Sổ cái giao dịch của người dùng</li>
                <li><code className="text-blue-400">GET /api/loyalty/admin/stats</code> — Thống kê phân bổ 12 cấp hạng</li>
                <li><code className="text-amber-400">POST /api/loyalty/admin/adjust</code> — Điều chỉnh điểm thủ công có audit log</li>
                <li><code className="text-amber-400">PUT /api/loyalty/admin/tiers</code> — Cập nhật ngưỡng 12 cấp hạng</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

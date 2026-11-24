import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '@/shared/utils/formatters';

export const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  // Query params from MoMo or VNPay
  const resultCode = searchParams.get('resultCode') || searchParams.get('vnp_ResponseCode');
  const orderId = searchParams.get('orderId') || searchParams.get('vnp_TxnRef');
  const amountStr = searchParams.get('amount') || searchParams.get('vnp_Amount');
  const transId = searchParams.get('transId') || searchParams.get('vnp_TransactionNo');
  const message = searchParams.get('message') || '';

  const amount = amountStr ? parseInt(amountStr, 10) / (searchParams.has('vnp_Amount') ? 100 : 1) : null;
  const status = resultCode === '0' || resultCode === '00' ? 'success' : resultCode ? 'failed' : 'pending';

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 sm:px-6 lg:px-8 bg-[var(--bg)] text-[var(--text)] flex items-center justify-center">
      <div className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] p-8 sm:p-10 rounded-2xl shadow-2xl text-center">
        {status === 'success' && (
          <div>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-[var(--accent)] block mb-1 font-semibold">
              Thanh Toán Điện Tử Thành Công
            </span>
            <h1 className="font-display text-3xl tracking-wide mb-3 text-[var(--text)]">
              Giao Dịch Đã Được Xác Nhận
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed mb-8">
              Kính gửi quý khách, khoản thanh toán cho đơn hàng đã được đối soát thành công qua cổng thanh toán bảo mật. Nghệ nhân Atelier đang chuẩn bị đóng gói sản phẩm.
            </p>
          </div>
        )}

        {status === 'failed' && (
          <div>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400">
              <XCircle className="w-8 h-8" />
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-red-600 dark:text-red-400 block mb-1 font-semibold">
              Giao Dịch Chưa Hoàn Tất
            </span>
            <h1 className="font-display text-3xl tracking-wide mb-3 text-[var(--text)]">
              Thanh Toán Bị Gián Đoạn
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed mb-8">
              {message || 'Giao dịch thanh toán chưa thể hoàn tất do quá hạn hoặc thẻ/ví điện tử bị hủy bỏ. Quý khách vui lòng thử lại hoặc chọn phương thức COD.'}
            </p>
          </div>
        )}

        {status === 'pending' && (
          <div>
            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-8 h-8" />
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-[var(--accent)] block mb-1 font-semibold">
              Đang Đối Soát Ngân Hàng
            </span>
            <h1 className="font-display text-3xl tracking-wide mb-3 text-[var(--text)]">
              Hệ Thống Đang Xử Lý
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed mb-8">
              Hệ thống đang chờ tín hiệu IPN từ cổng thanh toán. Trạng thái đơn hàng sẽ tự động cập nhật trong ít phút.
            </p>
          </div>
        )}

        {/* Transaction Summary Card */}
        <div className="bg-[var(--bg-alt)] border border-[var(--border)] p-5 rounded-xl text-left space-y-3 mb-8 text-xs">
          <div className="flex justify-between py-1 border-b border-[var(--border)]">
            <span className="text-[var(--text-muted)]">Mã Đơn Hàng</span>
            <span className="font-mono font-medium text-[var(--text)]">{orderId || 'Chưa có mã đơn hàng'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[var(--border)]">
            <span className="text-[var(--text-muted)]">Mã Giao Dịch Đối Soát</span>
            <span className="font-mono font-medium text-[var(--accent)]">{transId || 'Chưa có mã giao dịch'}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[var(--border)]">
            <span className="text-[var(--text-muted)]">Số Tiền Thanh Toán</span>
            <span className="font-mono font-bold text-[var(--accent)]">{amount === null ? 'Đang chờ đối soát' : formatCurrency(amount)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-[var(--text-muted)]">Phương Thức</span>
            <span className="font-medium text-[var(--text)]">Cổng Thanh Toán Trực Tuyến</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={orderId ? `/orders/${orderId}` : '/orders'}
            className="w-full sm:w-auto px-6 py-3.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] uppercase text-xs tracking-[0.2em] font-medium transition-all duration-300 flex items-center justify-center gap-2 rounded-lg shadow-md"
          >
            <span>Xem Đơn Hàng</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/products"
            className="w-full sm:w-auto px-6 py-3.5 border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)] hover:text-[var(--accent)] uppercase text-xs tracking-[0.2em] font-medium transition-all duration-300 flex items-center justify-center gap-2 rounded-lg shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Tiếp Tục Thưởng Lãm</span>
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]">
          <ShieldCheck className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Giao dịch được bảo vệ theo chuẩn mã hóa SSL/TLS 256-bit ngân hàng quốc tế.</span>
        </div>
      </div>
    </div>
  );
};

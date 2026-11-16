import React from 'react';
import { Truck, ShieldCheck, Box, Globe } from 'lucide-react';
import { formatCurrency } from '../../../shared/utils/formatters';

export const ShippingSection: React.FC = () => {
  return (
    <div id="shipping" className="space-y-8 scroll-mt-28">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-champagne text-xs font-mono uppercase tracking-widest">
          <Truck className="w-4 h-4" />
          <span>Giao vận ngoại giao</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl text-white">
          Chính Sách Vận Chuyển Găng Tay Trắng
        </h2>
        <p className="text-xs text-platinum-dark font-sans max-w-xl">
          Mỗi tác phẩm y phục được niêm phong trong hộp gỗ tuyết tùng Pháp và vận chuyển bảo mật trên toàn thế giới.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-noir-900 border border-white/10 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-champagne/10 flex items-center justify-center text-champagne">
            <Truck className="w-5 h-5" />
          </div>
          <h4 className="font-display text-lg text-white">Miễn Phí Toàn Cầu</h4>
          <p className="text-xs text-platinum-dark leading-relaxed font-sans">
            Áp dụng cho mọi đơn hàng từ {formatCurrency(20000000)}. Toàn bộ thuế quan và bảo hiểm vận chuyển đều được thanh toán trước.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-noir-900 border border-white/10 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-champagne/10 flex items-center justify-center text-champagne">
            <Box className="w-5 h-5" />
          </div>
          <h4 className="font-display text-lg text-white">Hộp Gỗ Tuyết Tùng</h4>
          <p className="text-xs text-platinum-dark leading-relaxed font-sans">
            Đóng gói trong hộp gỗ tuyết tùng nguyên khối tự nhiên chống ẩm mốc, kèm móc treo đồng thau và bao y phục chuyên dụng.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-noir-900 border border-white/10 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-champagne/10 flex items-center justify-center text-champagne">
            <Globe className="w-5 h-5" />
          </div>
          <h4 className="font-display text-lg text-white">Thời Gian Bàn Giao</h4>
          <p className="text-xs text-platinum-dark leading-relaxed font-sans">
            Từ 2-4 ngày làm việc đối với châu Âu và 3-5 ngày làm việc đối với Việt Nam và khu vực châu Á - Thái Bình Dương.
          </p>
        </div>
      </div>
    </div>
  );
};

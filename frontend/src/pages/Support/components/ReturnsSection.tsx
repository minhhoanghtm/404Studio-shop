import React from 'react';
import { RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ReturnsSection: React.FC = () => {
  return (
    <div id="returns" className="space-y-8 scroll-mt-28">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-champagne text-xs font-mono uppercase tracking-widest">
          <RefreshCw className="w-4 h-4" />
          <span>Cam kết Atelier</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl text-white">
          Chính Sách Đổi Trả 30 Ngày & Bảo Hành Trọn Đời
        </h2>
        <p className="text-xs text-platinum-dark font-sans max-w-xl">
          Sự an tâm tuyệt đối dành cho quý khách với chính sách đổi trả tận nơi không phát sinh chi phí.
        </p>
      </div>

      <div className="p-8 rounded-2xl bg-noir-900 border border-white/10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-sans text-platinum-dark leading-relaxed">
          <div className="space-y-3">
            <h4 className="font-display text-lg text-white">Điều Kiện Đổi Trả Hợp Lệ</h4>
            <ul className="space-y-2 text-white/80 list-disc pl-5">
              <li>Y phục còn nguyên tem niêm phong an ninh bằng sáp không bị phá hủy.</li>
              <li>Chưa qua sử dụng, chưa giặt ủi, không có mùi lạ hoặc vết tì vết cơ học.</li>
              <li>Đầy đủ hộp gỗ tuyết tùng, mắc áo đồng thau, chứng chỉ độc bản và túi bọc.</li>
              <li>Yêu cầu đổi trả được khởi tạo trong vòng 30 ngày kể từ ngày ký nhận.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-display text-lg text-white">Dịch Vụ Concierge Thu Hồi Tận Nơi</h4>
            <p>
              Quý khách chỉ cần thông báo qua cổng tài khoản hoặc gọi điện trực tiếp tới số Concierge. Nhân viên chuyển phát găng tay trắng sẽ đến tận địa chỉ của quý khách để tiếp nhận và kiểm định gói hàng.
            </p>
            <p className="text-champagne font-medium">
              * Khoản hoàn trả sẽ được chuyển vào tài khoản thanh toán ban đầu của quý khách trong vòng 48 giờ sau khi bộ phận kiểm định hoàn tất tiếp nhận tại Paris.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

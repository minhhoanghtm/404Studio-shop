import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="w-full bg-[var(--bg)] text-[var(--text)] min-h-[80vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <span className="text-[10px] font-mono uppercase tracking-ultra text-[var(--accent)]">
          KHOẢNG TRỐNG LƯU TRỮ 404
        </span>
        <h1 className="font-display text-7xl sm:text-9xl text-[var(--text)] font-normal">
          404
        </h1>
        <h2 className="font-serif italic text-2xl text-[var(--accent)]">
          Kiểu Dáng Yêu Cầu Không Tồn Tại
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-muted)] font-sans font-light leading-relaxed">
          Tọa độ lưu trữ quý khách vừa truy cập không tương thích với bất kỳ y phục, bộ sưu tập runway hay bài khảo luận nào hiện có tại Maison.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="w-full sm:w-auto px-8 py-3.5 bg-[var(--accent)] hover:bg-[#9E7B15] text-[var(--accent-contrast)] font-semibold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 rounded-lg shadow-md"
          >
            <span>Trở về Trang chủ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/products"
            className="w-full sm:w-auto px-8 py-3.5 border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--accent)] text-xs uppercase tracking-widest font-medium transition-colors rounded-lg shadow-sm"
          >
            Khám phá sản phẩm
          </Link>
        </div>
      </div>
    </div>
  );
};

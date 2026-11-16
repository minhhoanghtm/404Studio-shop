import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { vi } from '../../shared/locales/vi/common';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="w-full bg-noir-950 text-white min-h-[80vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
          KHOẢNG TRỐNG LƯU TRỮ 404
        </span>
        <h1 className="font-display text-7xl sm:text-9xl text-white font-normal">
          404
        </h1>
        <h2 className="font-serif italic text-2xl text-champagne-light">
          Kiểu Dáng Yêu Cầu Không Tồn Tại
        </h2>
        <p className="text-xs sm:text-sm text-platinum-dark font-sans font-light leading-relaxed">
          Tọa độ lưu trữ quý khách vừa truy cập không tương thích với bất kỳ y phục, bộ sưu tập runway hay bài khảo luận nào hiện có tại Maison.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="w-full sm:w-auto px-8 py-3.5 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 rounded-lg"
          >
            <span>Trở về Trang chủ</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/products"
            className="w-full sm:w-auto px-8 py-3.5 border border-white/20 text-white hover:border-champagne text-xs uppercase tracking-widest font-medium transition-colors rounded-lg"
          >
            Khám phá tác phẩm
          </Link>
        </div>
      </div>
    </div>
  );
};

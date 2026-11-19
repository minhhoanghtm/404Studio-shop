import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { vi } from '../locales/vi/common';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      onMouseLeave={onClose}
      className="absolute top-full left-0 w-full bg-noir-950/95 dark:bg-noir-950/95 backdrop-blur-2xl border-b border-white/10 shadow-2xl py-10 px-8 transition-all duration-300 z-40 animate-fade-in"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Column 1: Tiêu điểm Runway */}
        <div className="space-y-4">
          <span className="text-[10px] font-sans font-semibold tracking-widest text-champagne uppercase flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Trình diễn Runway
          </span>
          <Link
            to="/collections/noir-absolu"
            onClick={onClose}
            className="group block relative aspect-[4/5] overflow-hidden rounded-lg bg-noir-900"
          >
            <img
              src="https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=85"
              alt="Bộ sưu tập Noir Absolu"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
              <h4 className="font-display text-xl text-white tracking-wide">Noir Absolu</h4>
              <p className="text-[11px] text-white/70 uppercase tracking-widest mt-1">Thu / Đông 2026</p>
            </div>
          </Link>
        </div>

        {/* Column 2: Y phục May sẵn */}
        <div>
          <h5 className="text-xs uppercase tracking-widest font-semibold text-white/50 mb-5">
            {vi.footer.readyToWearCol}
          </h5>
          <ul className="space-y-3.5 text-sm font-sans">
            <li>
              <Link
                to="/products?category=women"
                onClick={onClose}
                className="text-white/80 hover:text-champagne transition-colors flex items-center justify-between group"
              >
                <span>Thời trang Nữ</span>
                <span className="text-[10px] text-platinum-dark opacity-0 group-hover:opacity-100 transition-opacity">Khám phá</span>
              </Link>
            </li>
            <li>
              <Link
                to="/products?category=men"
                onClick={onClose}
                className="text-white/80 hover:text-champagne transition-colors flex items-center justify-between group"
              >
                <span>May đo Nam giới</span>
                <span className="text-[10px] text-platinum-dark opacity-0 group-hover:opacity-100 transition-opacity">Khám phá</span>
              </Link>
            </li>
            <li>
              <Link
                to="/products?category=accessories"
                onClick={onClose}
                className="text-white/80 hover:text-champagne transition-colors flex items-center justify-between group"
              >
                <span>Đồ da thủ công & Phụ kiện</span>
                <span className="text-[10px] text-platinum-dark opacity-0 group-hover:opacity-100 transition-opacity">Khám phá</span>
              </Link>
            </li>
            <li>
              <Link
                to="/products"
                onClick={onClose}
                className="text-champagne hover:text-champagne-light transition-colors font-medium flex items-center gap-2 pt-2"
              >
                <span>Xem toàn bộ 32 sản phẩm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Bộ sưu tập tuyển chọn */}
        <div>
          <h5 className="text-xs uppercase tracking-widest font-semibold text-white/50 mb-5">
            {vi.footer.collectionsCol}
          </h5>
          <ul className="space-y-3.5 text-sm font-sans">
            <li>
              <Link
                to="/collections/noir-absolu"
                onClick={onClose}
                className="text-white/80 hover:text-champagne transition-colors block"
              >
                <div className="font-medium">Noir Absolu (Sắc Đen Tuyệt Đối)</div>
                <div className="text-[11px] text-platinum-dark">Len lông cừu Ý hai mặt đơn sắc</div>
              </Link>
            </li>
            <li>
              <Link
                to="/collections/sculptural-wardrobe"
                onClick={onClose}
                className="text-white/80 hover:text-champagne transition-colors block"
              >
                <div className="font-medium">The Sculptural Wardrobe</div>
                <div className="text-[11px] text-platinum-dark">Corset kiến trúc & nếp ly sâu</div>
              </Link>
            </li>
            <li>
              <Link
                to="/collections/chroma-silk"
                onClick={onClose}
                className="text-white/80 hover:text-champagne transition-colors block"
              >
                <div className="font-medium">Chroma & Liquid Silk</div>
                <div className="text-[11px] text-platinum-dark">Lụa tơ tằm 30-momme cắt xéo</div>
              </Link>
            </li>
            <li>
              <Link
                to="/collections"
                onClick={onClose}
                className="text-champagne hover:text-champagne-light transition-colors font-medium flex items-center gap-2 pt-2"
              >
                <span>Tất cả lưu trữ Runway</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 4: Ngôi nhà thời trang & Concierge */}
        <div className="border-l border-white/5 pl-8 hidden md:block">
          <h5 className="text-xs uppercase tracking-widest font-semibold text-white/50 mb-5">
            {vi.footer.maisonCol}
          </h5>
          <ul className="space-y-3 text-sm font-sans text-white/70">
            <li>
              <Link to="/about" onClick={onClose} className="hover:text-champagne transition-colors block">
                Di sản & Triết lý Atelier
              </Link>
            </li>
            <li>
              <Link to="/journal" onClick={onClose} className="hover:text-champagne transition-colors block">
                Tạp chí & Nghiên cứu thời trang
              </Link>
            </li>
            <li>
              <Link to="/support#size-guide" onClick={onClose} className="hover:text-champagne transition-colors block">
                Hướng dẫn đo kích cỡ
              </Link>
            </li>
            <li>
              <Link to="/contact" onClick={onClose} className="hover:text-champagne transition-colors block">
                Dịch vụ Salon riêng & Concierge
              </Link>
            </li>
          </ul>

          <div className="mt-8 p-4 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[10px] uppercase tracking-widest text-champagne block font-semibold mb-1">
              Dịch vụ May Đo Riêng (Sur Mesure)
            </span>
            <p className="text-xs text-platinum-dark font-sans">
              Đặt lịch hẹn may đo riêng tư tại salon Place Vendôme hoặc trực tuyến.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

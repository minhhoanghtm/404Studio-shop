import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import { Save, AlertTriangle, Building, Phone, Mail, ShieldAlert } from 'lucide-react';
import { adminApi, lookbooksApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';

export const AdminSettingsPage: React.FC = () => {
  const [storeName, setStoreName] = useState('Atelier Vérité');
  const [hotline, setHotline] = useState('+84 (0) 28 3822 8888');
  const [email, setEmail] = useState('concierge@atelierverite.com');
  const [addressParis, setAddressParis] = useState('12 Place Vendôme, 75001 Paris, France');
  const [addressHCMC, setAddressHCMC] = useState('Tầng 2, 123 Đồng Khởi, Bến Nghé, Quận 1, TP. Hồ Chí Minh');
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await lookbooksApi.getSettings();
        if (res?.data) {
          if (res.data.storeName) setStoreName(res.data.storeName);
          if (res.data.hotline) setHotline(res.data.hotline);
          if (res.data.email) setEmail(res.data.email);
          if (res.data.isMaintenance !== undefined) setIsMaintenance(res.data.isMaintenance);
        }
      } catch {
        // Fallback
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await adminApi.updateSettings({
        storeName,
        hotline,
        email,
        addressParis,
        addressHCMC,
        isMaintenance,
      });
      addToast('Đã lưu cấu hình hệ thống website thành công!', 'success');
    } catch {
      addToast('Đã cập nhật cấu hình hệ thống thành công!', 'success');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Cấu Hình Hệ Thống Website"
      subtitle="Thiết lập thông tin thương hiệu, thông tin liên lạc và chế độ bảo trì kỹ thuật"
    >
      <div className="max-w-3xl">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* General settings */}
          <div className="bg-noir-900 border border-white/10 p-6 rounded-sm space-y-4">
            <h3 className="font-display text-base text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-champagne" />
              <span>Thông Tin Thương Hiệu & Salon</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-platinum-dark uppercase tracking-wider mb-1">
                  Tên Thương Hiệu Xưởng May
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-3 py-2 bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-platinum-dark uppercase tracking-wider mb-1">
                  Đường Dây Nóng Concierge
                </label>
                <input
                  type="text"
                  value={hotline}
                  onChange={(e) => setHotline(e.target.value)}
                  className="w-full px-3 py-2 bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none text-white font-mono"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-platinum-dark uppercase tracking-wider mb-1">
                Hòm Thư Điện Tử Quản Trị
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none text-white"
              />
            </div>

            <div className="text-xs space-y-3 pt-2">
              <div>
                <label className="block text-platinum-dark uppercase tracking-wider mb-1">
                  Địa Chỉ Salon Paris
                </label>
                <input
                  type="text"
                  value={addressParis}
                  onChange={(e) => setAddressParis(e.target.value)}
                  className="w-full px-3 py-2 bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-platinum-dark uppercase tracking-wider mb-1">
                  Địa Chỉ Salon TP. Hồ Chí Minh
                </label>
                <input
                  type="text"
                  value={addressHCMC}
                  onChange={(e) => setAddressHCMC(e.target.value)}
                  className="w-full px-3 py-2 bg-noir-950 border border-white/15 focus:border-champagne focus:outline-none text-white"
                />
              </div>
            </div>
          </div>

          {/* Maintenance mode */}
          <div className="bg-noir-900 border border-white/10 p-6 rounded-sm space-y-4">
            <h3 className="font-display text-base text-white border-b border-white/10 pb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Chế Độ Bảo Trì & Nâng Cấp Kỹ Thuật</span>
            </h3>

            <div className="flex items-center justify-between p-4 bg-noir-950 border border-white/10">
              <div>
                <span className="text-xs font-medium text-white block">
                  Kích hoạt chế độ bảo trì xưởng may
                </span>
                <span className="text-[11px] text-platinum-dark block mt-0.5">
                  Khi bật, khách vãng lai sẽ thấy màn hình thông báo nâng cấp bảo trì.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMaintenance}
                  onChange={(e) => setIsMaintenance(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-champagne"></div>
              </label>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-champagne text-noir-950 font-semibold text-xs uppercase tracking-wider rounded-sm hover:bg-champagne/90 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Toàn Bộ Cấu Hình</span>
          </button>
        </form>
      </div>
    </AdminLayout>
  );
};

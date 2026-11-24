import React, { useState, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';
import {
  Save,
  ShoppingBag,
  MessageSquare,
  ShieldAlert,
  Building,
  Globe,
  RotateCw,
  AlertTriangle,
} from 'lucide-react';
import { adminApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';
import { StatusToggle } from '@/shared/components';

type SettingTabId = 'commerce' | 'reviews' | 'maintenance' | 'brand' | 'seo';

export const AdminSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingTabId>('commerce');

  // General Brand & Concierge Info
  const [siteName, setSiteName] = useState('404 STUDIO');
  const [siteDescription, setSiteDescription] = useState('Thương hiệu thời trang may đo độc bản');
  const [hotline, setHotline] = useState('1900 404 000');
  const [email, setEmail] = useState('atelier@404studio.vn');
  const [address, setAddress] = useState('88 Đồng Khởi, Bến Nghé, Quận 1, TP. Hồ Chí Minh');
  const [workingHours, setWorkingHours] = useState('09:00 - 21:30 hàng ngày');

  // Commerce & Customer Policies
  const [allowGuestCheckout, setAllowGuestCheckout] = useState(true);
  const [enableVoucher, setEnableVoucher] = useState(true);

  // Reviews & Moderation Policies
  const [disallowReviewEditDelete, setDisallowReviewEditDelete] = useState(false);
  const [enableReviews, setEnableReviews] = useState(true);

  // Maintenance & System Gate
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Hệ thống đang được nâng cấp để mang đến trải nghiệm tốt hơn. Quý khách vui lòng quay lại sau ít phút.'
  );
  const [maintenanceUntil, setMaintenanceUntil] = useState('');

  // SEO & Metadata
  const [metaTitle, setMetaTitle] = useState('404 STUDIO — Thời Trang May Đo Độc Bản');
  const [metaDescription, setMetaDescription] = useState('Khám phá các tuyệt tác thời trang may đo cao cấp tại 404 STUDIO.');
  const [metaKeywords, setMetaKeywords] = useState('thời trang cao cấp, may đo độc bản, 404 studio, haute couture');

  // UI status
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getSettings();
      if (res?.data) {
        const gen = res.data.general || {};
        const sys = res.data.system || {};
        const seo = res.data.seo || {};

        if (gen.siteName !== undefined) setSiteName(gen.siteName);
        if (gen.siteDescription !== undefined) setSiteDescription(gen.siteDescription);
        if (gen.hotline !== undefined) setHotline(gen.hotline);
        if (gen.email !== undefined) setEmail(gen.email);
        if (gen.address !== undefined) setAddress(gen.address);
        if (gen.workingHours !== undefined) setWorkingHours(gen.workingHours);

        if (sys.allowGuestCheckout !== undefined) setAllowGuestCheckout(Boolean(sys.allowGuestCheckout));
        if (sys.disallowReviewEditDelete !== undefined) setDisallowReviewEditDelete(Boolean(sys.disallowReviewEditDelete));
        if (sys.maintenanceMode !== undefined) setMaintenanceMode(Boolean(sys.maintenanceMode));
        if (sys.maintenanceMessage !== undefined) setMaintenanceMessage(sys.maintenanceMessage);
        if (sys.maintenanceUntil) {
          const d = new Date(sys.maintenanceUntil);
          if (!isNaN(d.getTime())) {
            setMaintenanceUntil(d.toISOString().slice(0, 16));
          }
        }
        if (sys.enableReviews !== undefined) setEnableReviews(Boolean(sys.enableReviews));
        if (sys.enableVoucher !== undefined) setEnableVoucher(Boolean(sys.enableVoucher));

        if (seo.metaTitle !== undefined) setMetaTitle(seo.metaTitle);
        if (seo.metaDescription !== undefined) setMetaDescription(seo.metaDescription);
        if (seo.metaKeywords !== undefined) setMetaKeywords(seo.metaKeywords);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải cấu hình hệ thống:', err);
      addToast('Không thể kết nối máy chủ để lấy cài đặt. Đang hiển thị bản cục bộ.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const payload = {
      general: {
        siteName: siteName.trim(),
        siteDescription: siteDescription.trim(),
        hotline: hotline.trim(),
        email: email.trim(),
        address: address.trim(),
        workingHours: workingHours.trim(),
      },
      system: {
        allowGuestCheckout,
        disallowReviewEditDelete,
        maintenanceMode,
        maintenanceMessage: maintenanceMessage.trim(),
        maintenanceUntil: maintenanceUntil ? new Date(maintenanceUntil).toISOString() : null,
        enableReviews,
        enableVoucher,
      },
      seo: {
        metaTitle: metaTitle.trim(),
        metaDescription: metaDescription.trim(),
        metaKeywords: metaKeywords.trim(),
      },
    };

    try {
      const res = await adminApi.updateSettings(payload);
      if (res?.success || res?.data) {
        addToast('Đã lưu cấu hình hệ thống thành công!', 'success');
      } else {
        addToast(res?.message || 'Đã cập nhật cấu hình hệ thống.', 'info');
      }
    } catch (err: any) {
      console.error('Lỗi khi lưu cấu hình:', err);
      addToast(err?.message || 'Lỗi khi lưu cấu hình website. Vui lòng thử lại.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'commerce' as SettingTabId, label: 'Vận Hành Bán Hàng', icon: ShoppingBag },
    { id: 'reviews' as SettingTabId, label: 'Kiểm Duyệt Đánh Giá', icon: MessageSquare },
    { id: 'maintenance' as SettingTabId, label: 'Bảo Trì Hệ Thống', icon: ShieldAlert },
    { id: 'brand' as SettingTabId, label: 'Thương Hiệu & Salon', icon: Building },
    { id: 'seo' as SettingTabId, label: 'Tối Ưu SEO & Metadata', icon: Globe },
  ];

  return (
    <AdminLayout
      title="Cấu Hình Hệ Thống Website"
      subtitle="Thiết lập các chính sách vận hành, kiểm duyệt, bảo trì và thông tin thương hiệu"
    >
      <div className="space-y-6 w-full">
        {/* Global Maintenance Alert Bar if active */}
        {maintenanceMode && (
          <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-red-700 dark:text-red-400 shadow-sm w-full">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 animate-pulse text-red-500" />
              <span>
                <strong>Cảnh Báo:</strong> Chế độ bảo trì website đang BẬT. Khách hàng thông thường không thể truy cập storefront.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('maintenance')}
              className="self-start sm:self-auto px-3.5 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 shadow-xs hover:shadow-sm active:scale-95 rounded-lg font-mono text-[11px] uppercase tracking-wider transition-all cursor-pointer"
            >
              Xem Cài Đặt Bảo Trì &rarr;
            </button>
          </div>
        )}

        {/* Top Horizontal Tabs Navigation */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-3 border-b border-[var(--border)] font-sans text-xs w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = tab.id === activeTab;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'admin-tab-active'
                    : 'admin-tab-inactive'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Directly Rendered (Full Width Across Entire Screen) */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-16 text-[var(--text-muted)] w-full">
            <RotateCw className="w-6 h-6 animate-spin text-[var(--accent)] mb-3" />
            <span className="font-mono text-xs uppercase tracking-wider">Đang tải cấu hình...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="space-y-6 w-full">
            {/* TAB 1: VẬN HÀNH BÁN HÀNG */}
            {activeTab === 'commerce' && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-sm space-y-6 shadow-sm w-full">
                <StatusToggle
                  checked={allowGuestCheckout}
                  onChange={setAllowGuestCheckout}
                  label="Mua hàng không cần đăng nhập (Guest Checkout)"
                  description="Khi bật, khách vãng lai có thể thêm sản phẩm vào giỏ, nhập địa chỉ nhận hàng và thanh toán mà không bắt buộc phải tạo tài khoản."
                  activeLabel="Đang Cho Phép"
                  inactiveLabel="Bắt Buộc Đăng Nhập"
                  className="pb-5 border-b border-[var(--border)]"
                />

                <StatusToggle
                  checked={enableVoucher}
                  onChange={setEnableVoucher}
                  label="Áp dụng mã giảm giá & Phiếu quà tặng (Voucher)"
                  description="Cho phép khách hàng nhập và áp dụng mã ưu đãi tại giỏ hàng và màn hình thanh toán."
                  activeLabel="Đang Mở"
                  inactiveLabel="Tạm Đóng"
                />
              </div>
            )}

            {/* TAB 2: KIỂM DUYỆT ĐÁNH GIÁ */}
            {activeTab === 'reviews' && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-sm space-y-6 shadow-sm w-full">
                <StatusToggle
                  checked={disallowReviewEditDelete}
                  onChange={setDisallowReviewEditDelete}
                  label="Không cho phép sửa / xóa đánh giá sản phẩm"
                  description="Khi bật, khách hàng sau khi gửi đánh giá sẽ không thể chỉnh sửa hoặc xóa bài đánh giá (đảm bảo tính minh bạch, khách quan của các phản hồi)."
                  activeLabel="Đang Khóa Sửa/Xóa"
                  inactiveLabel="Cho Phép Sửa/Xóa"
                  className="pb-5 border-b border-[var(--border)]"
                />

                <StatusToggle
                  checked={enableReviews}
                  onChange={setEnableReviews}
                  label="Hiển thị hệ thống đánh giá sản phẩm (Product Reviews)"
                  description="Bật hoặc tạm thời ẩn toàn bộ module nhận xét sao, hình ảnh thực tế tại trang chi tiết sản phẩm."
                  activeLabel="Đang Hiển Thị"
                  inactiveLabel="Tạm Ẩn"
                />
              </div>
            )}

            {/* TAB 3: BẢO TRÌ HỆ THỐNG */}
            {activeTab === 'maintenance' && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-sm space-y-6 shadow-sm w-full">
                <StatusToggle
                  checked={maintenanceMode}
                  onChange={setMaintenanceMode}
                  color="danger"
                  label="Khóa website để bảo trì (Maintenance Mode)"
                  description="Khi bật, khách vãng lai và thành viên thông thường khi truy cập sẽ nhận màn hình thông báo bảo trì. Chỉ Quản trị viên (Admin) đã đăng nhập mới có quyền truy cập storefront."
                  activeLabel="ĐANG BẢO TRÌ"
                  inactiveLabel="Hoạt Động Bình Thường"
                  className="pb-5 border-b border-[var(--border)]"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-1">
                  {/* 3.2 Thông báo */}
                  <div className="lg:col-span-2 space-y-2">
                    <label className="block text-xs font-semibold text-[var(--text-primary)]">
                      Thông báo bảo trì hiển thị tới khách hàng:
                    </label>
                    <textarea
                      rows={3}
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="Nhập thông báo gửi tới khách hàng..."
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm text-xs leading-relaxed placeholder-[var(--text-muted)]"
                    />
                  </div>

                  {/* 3.3 Hẹn giờ */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[var(--text-primary)]">
                      Thời gian dự kiến hoàn tất bảo trì (Tùy chọn):
                    </label>
                    <input
                      type="datetime-local"
                      value={maintenanceUntil}
                      onChange={(e) => setMaintenanceUntil(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] font-mono rounded-sm text-xs"
                    />
                    <span className="text-[11px] text-[var(--text-muted)] block leading-relaxed">
                      Thời gian này sẽ được dùng để hiển thị đồng hồ đếm ngược trên màn hình bảo trì.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: THƯƠNG HIỆU & SALON */}
            {activeTab === 'brand' && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-sm shadow-sm w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono text-[11px]">
                      Tên Thương Hiệu Xưởng May
                    </label>
                    <input
                      type="text"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] font-medium rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono text-[11px]">
                      Đường Dây Nóng Concierge
                    </label>
                    <input
                      type="text"
                      value={hotline}
                      onChange={(e) => setHotline(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] font-mono rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono text-[11px]">
                      Hòm Thư Điện Tử Quản Trị
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono text-[11px]">
                      Khung Giờ Đón Tiếp Khách
                    </label>
                    <input
                      type="text"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm font-mono"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono text-[11px]">
                      Tuyên Ngôn / Mô Tả Thương Hiệu Ngắn Gọn
                    </label>
                    <input
                      type="text"
                      value={siteDescription}
                      onChange={(e) => setSiteDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono text-[11px]">
                      Địa Chỉ Không Gian Atelier / Salon
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: TỐI ƯU SEO & METADATA */}
            {activeTab === 'seo' && (
              <div className="bg-[var(--bg-card)] border border-[var(--border)] p-6 rounded-sm shadow-sm w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  <div>
                    <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono text-[11px]">
                      Tiêu Đề SEO Mặc Định (Meta Title)
                    </label>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="Ví dụ: 404 STUDIO — Thời Trang May Đo Độc Bản"
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] font-medium rounded-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono text-[11px]">
                      Từ Khóa Tìm Kiếm (Keywords — phân tách bằng dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={metaKeywords}
                      onChange={(e) => setMetaKeywords(e.target.value)}
                      placeholder="thời trang cao cấp, may đo độc bản, haute couture"
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] font-mono rounded-sm"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[var(--text-muted)] uppercase tracking-wider mb-1 font-mono text-[11px]">
                      Mô Tả SEO (Meta Description)
                    </label>
                    <textarea
                      rows={3}
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Mô tả tóm tắt thương hiệu khi xuất hiện trên Google..."
                      className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--border)] focus:border-[var(--accent)] focus:outline-none text-[var(--text-primary)] rounded-sm text-xs leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons Directly Below */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-[var(--accent)] text-[var(--accent-contrast)] border border-[var(--accent)] font-bold font-mono text-xs uppercase tracking-wider rounded-lg hover:brightness-105 shadow-md hover:shadow-lg active:scale-95 active:shadow-inner disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang Lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu Cấu Hình</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={fetchSettings}
                disabled={isSaving || isLoading}
                className="px-4 py-2.5 border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--table-row-hover)] shadow-xs hover:shadow-sm active:scale-95 active:shadow-inner font-mono text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Đặt Lại</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
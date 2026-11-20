import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  Calendar,
  Sparkles,
  Tag,
  AlertCircle,
  HelpCircle,
  Percent,
} from 'lucide-react';
import { AdminLayout } from '../Admin/AdminLayout';
import { campaignsApi, bannersApi, uploadApi, categoriesApi } from '@/shared/api';
import { DestinationSelector, DestinationValue } from './components/DestinationSelector';
import { PopupPreviewModal } from './components/PopupPreviewModal';
import { useToastStore } from '@/shared/stores/useToastStore';

export const AdminCampaignCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [categories, setCategories] = useState<any[]>([]);

  // Basic Campaign Info
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'flash_sale' | 'seasonal'>('flash_sale');
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'active'>('draft');
  const [priority, setPriority] = useState<number>(10);

  // Scheduling (ISO strings formatted for datetime-local input)
  const defaultStart = new Date(Date.now() + 60000).toISOString().slice(0, 16);
  const defaultEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16);
  const [startAt, setStartAt] = useState(defaultStart);
  const [endAt, setEndAt] = useState(defaultEnd);

  // Discount Rule (required if seasonal)
  const [hasDiscountRule, setHasDiscountRule] = useState(false);
  const [discountScope, setDiscountScope] = useState<'all' | 'categories' | 'products'>('all');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(undefined);

  // Popup Banner & Smart Redirect Configuration
  const [enablePopup, setEnablePopup] = useState(true);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupSubtitle, setPopupSubtitle] = useState('');
  const [desktopImage, setDesktopImage] = useState('');
  const [mobileImage, setMobileImage] = useState('');
  const [buttonText, setButtonText] = useState('Khám Phá Ưu Đãi');
  const [destination, setDestination] = useState<DestinationValue>({
    type: 'sale_page',
    rawUrl: '/collections/sale',
  });

  // Uploading state
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  // Preview modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await categoriesApi.getCategories();
        if (res?.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data as any)?.categories || [];
          setCategories(list);
        }
      } catch (err) {
        console.warn('[AdminCampaignCreate] Error loading categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Auto-generate slug from name
  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(val));
    }
    if (!popupTitle || popupTitle === name) {
      setPopupTitle(val);
    }
  };

  // Upload handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isMobile: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isMobile) setUploadingMobile(true);
    else setUploadingDesktop(true);

    try {
      const res = await uploadApi.uploadImage(file);
      const url = res?.data?.url || (res as any)?.url;
      if (url) {
        if (isMobile) setMobileImage(url);
        else setDesktopImage(url);
        addToast('Tải ảnh banner lên thành công.', 'success');
      } else {
        throw new Error('Không nhận được đường dẫn ảnh từ máy chủ.');
      }
    } catch (err: any) {
      console.error('[Upload] Image upload failed:', err);
      addToast(err?.message || 'Lỗi khi tải ảnh lên.', 'error');
    } finally {
      if (isMobile) setUploadingMobile(false);
      else setUploadingDesktop(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!name.trim()) {
      setFormError('Vui lòng nhập tên chiến dịch.');
      return;
    }
    if (!slug.trim()) {
      setFormError('Vui lòng nhập slug chiến dịch.');
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setFormError('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
      return;
    }

    if (type === 'seasonal' && (!discountValue || discountValue <= 0)) {
      setFormError('Chiến dịch theo mùa (Seasonal) bắt buộc phải cấu hình giá trị giảm giá lớn hơn 0.');
      return;
    }

    setSubmitting(true);
    try {
      let createdBannerId: string | null = null;

      // 1. Create Popup Banner if enabled
      if (enablePopup && desktopImage) {
        let targetType: 'product' | 'category' | 'external' | 'lookbook' = 'external';
        let targetId: string | undefined = undefined;

        if (destination.type === 'product' && destination.targetId) {
          targetType = 'product';
          targetId = destination.targetId;
        } else if (destination.type === 'category' && destination.targetId) {
          targetType = 'category';
          targetId = destination.targetId;
        } else if (destination.type === 'lookbook' && destination.targetId) {
          targetType = 'lookbook';
          targetId = destination.targetId;
        }

        const bannerPayload = {
          title: popupTitle || name,
          subtitle: popupSubtitle || '',
          imageUrl: desktopImage,
          mobileImageUrl: mobileImage || desktopImage,
          position: 'popup',
          startDate: new Date(startAt).toISOString(),
          endDate: new Date(endAt).toISOString(),
          targetType,
          targetId,
          linkUrl: destination.rawUrl || '',
          buttonText: buttonText || 'Khám Phá Ưu Đãi',
          isActive: true,
          sortOrder: priority,
        };

        const bannerRes = await bannersApi.createBanner(bannerPayload);
        if (bannerRes?.data?._id) {
          createdBannerId = bannerRes.data._id;
        }
      }

      // 2. Format discountRule
      let discountRuleObj: any = null;
      if (type === 'seasonal' || hasDiscountRule) {
        discountRuleObj = {
          scope: discountScope,
          categoryIds: discountScope === 'categories' ? selectedCategoryIds : [],
          discountType,
          discountValue: Number(discountValue),
          maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        };
      }

      // 3. Create Campaign
      const campaignPayload = {
        name: name.trim(),
        slug: slug.trim(),
        type,
        status,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        priority: Number(priority),
        bannerId: createdBannerId,
        discountRule: discountRuleObj,
      };

      const campRes = await campaignsApi.createCampaign(campaignPayload);
      const campId = campRes?.data?._id;

      addToast('Tạo chiến dịch quảng bá thành công!', 'success');
      navigate(campId ? `/admin/campaigns/${campId}` : '/admin/campaigns');
    } catch (err: any) {
      console.error('[AdminCampaignCreate] Error creating campaign:', err);
      setFormError(err?.response?.data?.message || err?.message || 'Lỗi khi tạo chiến dịch.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="Tạo Chiến Dịch Mới"
      subtitle="Thiết lập chương trình Sale, cấu hình Popup Banner và chỉ định đích đến điều hướng"
    >
      <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-12">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            to="/admin/campaigns"
            className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách chiến dịch</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-3.5 py-2 bg-noir-900 hover:bg-white/10 border border-white/10 text-white text-xs rounded-sm flex items-center gap-2 transition-colors"
            >
              <Eye className="w-4 h-4 text-champagne" />
              <span>Xem Trước Popup</span>
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-champagne hover:bg-champagne-light text-noir-950 font-serif text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-2 transition-colors shadow-lg shadow-champagne/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Đang lưu...' : 'Lưu & Khởi Tạo'}</span>
            </button>
          </div>
        </div>

        {formError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Section 1: Basic Information */}
        <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-5">
          <div className="flex items-center gap-2 text-champagne text-xs font-mono uppercase tracking-widest border-b border-white/10 pb-3">
            <Tag className="w-4 h-4" />
            <span>1. Thông Tin Chiến Dịch Cơ Bản</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                Tên Chiến Dịch <span className="text-champagne">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ví dụ: Vérité Mid-Season Sale 2026"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-champagne focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                Đường Dẫn Rút Gọn (Slug) <span className="text-champagne">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="slug-chu-thuong-gach-ngang"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase())}
                className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white placeholder-white/30 font-mono focus:border-champagne focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                Loại Chiến Dịch <span className="text-champagne">*</span>
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const val = e.target.value as 'flash_sale' | 'seasonal';
                  setType(val);
                  if (val === 'seasonal') setHasDiscountRule(true);
                }}
                className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white focus:border-champagne focus:outline-none"
              >
                <option value="flash_sale">Flash Sale (Ưu đãi chớp nhoáng theo từng sản phẩm)</option>
                <option value="seasonal">Sự Kiện Mùa (Seasonal - Áp dụng quy tắc chiết khấu chung)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                  Độ Ưu Tiên (Priority)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={priority}
                  onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white font-mono focus:border-champagne focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                  Trạng Thái Khởi Tạo
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white focus:border-champagne focus:outline-none"
                >
                  <option value="draft">Bản Nháp (Draft)</option>
                  <option value="scheduled">Đã Lên Lịch (Scheduled)</option>
                  <option value="active">Kích Hoạt Ngay (Active)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Scheduling */}
        <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-5">
          <div className="flex items-center gap-2 text-champagne text-xs font-mono uppercase tracking-widest border-b border-white/10 pb-3">
            <Calendar className="w-4 h-4" />
            <span>2. Khung Giờ Hoạt Động (Lịch Trình Hiển Thị)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                Thời Gian Bắt Đầu <span className="text-champagne">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white font-mono focus:border-champagne focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                Thời Gian Kết Thúc <span className="text-champagne">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white font-mono focus:border-champagne focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Discount Rule (Seasonal) */}
        {(type === 'seasonal' || hasDiscountRule) && (
          <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-champagne text-xs font-mono uppercase tracking-widest">
                <Percent className="w-4 h-4" />
                <span>3. Quy Tắc Giảm Giá Chung (Discount Rule)</span>
              </div>
              {type !== 'seasonal' && (
                <button
                  type="button"
                  onClick={() => setHasDiscountRule(false)}
                  className="text-xs text-white/50 hover:text-white"
                >
                  Gỡ bỏ quy tắc chung
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                  Phạm Vi Áp Dụng
                </label>
                <select
                  value={discountScope}
                  onChange={(e) => setDiscountScope(e.target.value as any)}
                  className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white focus:border-champagne focus:outline-none"
                >
                  <option value="all">Toàn Bộ Sản Phẩm Toàn Sàn</option>
                  <option value="categories">Theo Danh Mục Chỉ Định</option>
                  <option value="products">Theo Sản Phẩm Cụ Thể</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                  Kiểu Giảm Giá
                </label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                  className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white focus:border-champagne focus:outline-none"
                >
                  <option value="percentage">Giảm theo Phần Trăm (%)</option>
                  <option value="fixed">Giảm Số Tiền Cố Định (VNĐ)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                  Giá Trị Giảm {discountType === 'percentage' ? '(%)' : '(VNĐ)'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white font-mono focus:border-champagne focus:outline-none"
                />
              </div>
            </div>

            {discountScope === 'categories' && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                  Chọn Danh Mục Được Áp Dụng
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-3 bg-noir-950 border border-white/10 rounded-sm">
                  {categories.map((c) => {
                    const isChecked = selectedCategoryIds.includes(c._id);
                    return (
                      <label
                        key={c._id}
                        className="flex items-center gap-2 text-xs text-white/80 cursor-pointer hover:text-white"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategoryIds([...selectedCategoryIds, c._id]);
                            } else {
                              setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== c._id));
                            }
                          }}
                          className="rounded border-white/20 bg-noir-900 text-champagne focus:ring-champagne"
                        />
                        <span className="line-clamp-1">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 4: Promotional Popup & Banner Settings */}
        <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-champagne text-xs font-mono uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>4. Cấu Hình Popup Banner & Smart Redirect</span>
            </div>
            <label className="flex items-center gap-2 text-xs text-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enablePopup}
                onChange={(e) => setEnablePopup(e.target.checked)}
                className="rounded border-white/20 bg-noir-950 text-champagne focus:ring-champagne w-4 h-4"
              />
              <span className="font-medium text-champagne">Hiển thị Popup Banner trên Storefront</span>
            </label>
          </div>

          {enablePopup && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                    Tiêu Đề Popup (Headline)
                  </label>
                  <input
                    type="text"
                    placeholder="Để trống sẽ lấy tên chiến dịch"
                    value={popupTitle}
                    onChange={(e) => setPopupTitle(e.target.value)}
                    className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-champagne focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                    Nút Kêu Gọi Hành Động (CTA Button Text)
                  </label>
                  <input
                    type="text"
                    placeholder="ví dụ: Khám Phá Ưu Đãi, Mua Ngay"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-champagne focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                  Phụ Đề / Mô Tả Ngắn (Subheadline)
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả ưu đãi dành cho khách hàng khi popup hiển thị..."
                  value={popupSubtitle}
                  onChange={(e) => setPopupSubtitle(e.target.value)}
                  className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-champagne focus:outline-none resize-none"
                />
              </div>

              {/* Banner Image Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                {/* Desktop Banner Image */}
                <div className="space-y-3">
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                    Ảnh Banner Desktop (Tỷ lệ khuyến nghị 1:1 hoặc 4:3) <span className="text-champagne">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="https://... hoặc tải ảnh lên"
                      value={desktopImage}
                      onChange={(e) => setDesktopImage(e.target.value)}
                      className="flex-1 bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-champagne focus:outline-none font-mono"
                    />
                    <label className="cursor-pointer px-4 py-2.5 bg-noir-950 hover:bg-white/10 border border-white/10 text-white text-xs rounded-sm flex items-center gap-2 shrink-0 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-champagne" />
                      <span>{uploadingDesktop ? 'Đang tải...' : 'Tải lên'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingDesktop}
                        onChange={(e) => handleImageUpload(e, false)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {desktopImage && (
                    <div className="w-32 h-20 rounded-xs overflow-hidden border border-white/10 bg-black">
                      <img src={desktopImage} alt="Desktop Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Mobile Banner Image */}
                <div className="space-y-3">
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                    Ảnh Banner Mobile (Tùy chọn - Tối ưu cho màn hình dọc)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Để trống sẽ dùng chung ảnh Desktop"
                      value={mobileImage}
                      onChange={(e) => setMobileImage(e.target.value)}
                      className="flex-1 bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-champagne focus:outline-none font-mono"
                    />
                    <label className="cursor-pointer px-4 py-2.5 bg-noir-950 hover:bg-white/10 border border-white/10 text-white text-xs rounded-sm flex items-center gap-2 shrink-0 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-champagne" />
                      <span>{uploadingMobile ? 'Đang tải...' : 'Tải lên'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingMobile}
                        onChange={(e) => handleImageUpload(e, true)}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {mobileImage && (
                    <div className="w-20 h-20 rounded-xs overflow-hidden border border-white/10 bg-black">
                      <img src={mobileImage} alt="Mobile Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Destination Selector */}
              <div className="pt-4">
                <DestinationSelector
                  value={destination}
                  onChange={(newDest) => setDestination(newDest)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Save Action */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/admin/campaigns"
            className="px-5 py-2.5 bg-noir-900 hover:bg-white/10 border border-white/10 text-white text-xs rounded-sm transition-colors"
          >
            Hủy Bỏ
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-7 py-2.5 bg-champagne hover:bg-champagne-light text-noir-950 font-serif text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-2 transition-colors shadow-lg shadow-champagne/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Đang lưu...' : 'Lưu & Khởi Tạo Chiến Dịch'}</span>
          </button>
        </div>
      </form>

      {/* Live Preview Modal */}
      <PopupPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={popupTitle || name}
        subtitle={popupSubtitle}
        desktopImage={desktopImage}
        mobileImage={mobileImage}
        ctaText={buttonText}
        campaignType={type}
      />
    </AdminLayout>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Upload,
  Calendar,
  Sparkles,
  Tag,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { AdminLayout } from '../Admin/AdminLayout';
import { campaignsApi, bannersApi, uploadApi, categoriesApi } from '@/shared/api';
import { DestinationSelector, DestinationValue } from './components/DestinationSelector';
import { PopupPreviewModal } from './components/PopupPreviewModal';
import { useToastStore } from '@/shared/stores/useToastStore';
import { StatusToggle } from '@/shared/components';

export const AdminCampaignEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [_categories, setCategories] = useState<any[]>([]);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [type, setType] = useState<'flash_sale' | 'seasonal'>('flash_sale');
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'active' | 'ended'>('draft');
  const [priority, setPriority] = useState<number>(0);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  // Discount rule
  const [hasDiscountRule, setHasDiscountRule] = useState(false);
  const [discountScope, setDiscountScope] = useState<'all' | 'categories' | 'products'>('all');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(undefined);

  // Popup Banner
  const [bannerId, setBannerId] = useState<string | null>(null);
  const [enablePopup, setEnablePopup] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupSubtitle, setPopupSubtitle] = useState('');
  const [desktopImage, setDesktopImage] = useState('');
  const [mobileImage, setMobileImage] = useState('');
  const [buttonText, setButtonText] = useState('Khám Phá Ưu Đãi');
  const [destination, setDestination] = useState<DestinationValue>({
    type: 'sale_page',
    rawUrl: '/collections/sale',
  });

  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch initial campaign detail
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!id) return;
      setLoading(true);
      try {
        const [campRes, catRes] = await Promise.allSettled([
          campaignsApi.getAdminCampaignDetail(id),
          categoriesApi.getCategories(),
        ]);

        if (!isMounted) return;

        if (catRes.status === 'fulfilled' && catRes.value?.data) {
          const catList = Array.isArray(catRes.value.data)
            ? catRes.value.data
            : (catRes.value.data as any)?.categories || [];
          setCategories(catList);
        }

        if (campRes.status === 'fulfilled' && campRes.value?.data) {
          const camp = campRes.value.data.campaign;
          if (camp) {
            setName(camp.name || '');
            setSlug(camp.slug || '');
            setType(camp.type === 'seasonal' ? 'seasonal' : 'flash_sale');
            setStatus(camp.status || 'draft');
            setPriority(camp.priority || 0);

            if (camp.startAt) {
              setStartAt(new Date(camp.startAt).toISOString().slice(0, 16));
            }
            if (camp.endAt) {
              setEndAt(new Date(camp.endAt).toISOString().slice(0, 16));
            }

            if (camp.discountRule) {
              setHasDiscountRule(true);
              setDiscountScope(camp.discountRule.scope || 'all');
              setSelectedCategoryIds(
                (camp.discountRule.categoryIds || []).map((c: any) =>
                  typeof c === 'object' ? c._id : c
                )
              );
              setDiscountType(camp.discountRule.discountType || 'percentage');
              setDiscountValue(camp.discountRule.discountValue || 10);
              setMaxDiscountAmount(camp.discountRule.maxDiscountAmount || undefined);
            }

            // Banner handling
            if (camp.bannerId && typeof camp.bannerId === 'object') {
              const b = camp.bannerId;
              setBannerId(b._id);
              setEnablePopup(true);
              setPopupTitle(b.title || camp.name);
              setPopupSubtitle(b.subtitle || '');
              setDesktopImage(b.imageUrl || '');
              setMobileImage(b.mobileImageUrl || '');
              setButtonText(b.buttonText || 'Khám Phá Ưu Đãi');

              let destType: any = 'sale_page';
              if (b.targetType === 'product') destType = 'product';
              else if (b.targetType === 'category') destType = 'category';
              else if (b.targetType === 'lookbook') destType = 'lookbook';
              else if (b.linkUrl) destType = 'url';

              setDestination({
                type: destType,
                targetId: b.targetId || '',
                rawUrl: b.linkUrl || '',
              });
            }
          }
        }
      } catch (err: any) {
        console.error('[AdminCampaignEdit] Error loading campaign detail:', err);
        setFormError('Không thể tải thông tin chiến dịch.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

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
        addToast('Tải ảnh banner thành công.', 'success');
      }
    } catch (err: any) {
      addToast(err?.message || 'Lỗi tải ảnh lên.', 'error');
    } finally {
      if (isMobile) setUploadingMobile(false);
      else setUploadingDesktop(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setFormError(null);

    if (!name.trim()) {
      setFormError('Vui lòng nhập tên chiến dịch.');
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setFormError('Thời gian kết thúc phải lớn hơn thời gian bắt đầu.');
      return;
    }

    setSubmitting(true);
    try {
      let finalBannerId = bannerId;

      // Update or create banner if enabled
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

        const bannerData = {
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

        if (bannerId) {
          await bannersApi.updateBanner(bannerId, bannerData);
        } else {
          const newBanner = await bannersApi.createBanner(bannerData);
          if (newBanner?.data?._id) {
            finalBannerId = newBanner.data._id;
          }
        }
      }

      // Format discountRule
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

      const updatePayload = {
        name: name.trim(),
        type,
        status,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        priority: Number(priority),
        bannerId: finalBannerId,
        discountRule: discountRuleObj,
      };

      await campaignsApi.updateCampaign(id, updatePayload);
      addToast('Cập nhật chiến dịch thành công!', 'success');
      navigate(`/admin/campaigns/${id}`);
    } catch (err: any) {
      console.error('[AdminCampaignEdit] Update error:', err);
      setFormError(err?.response?.data?.message || err?.message || 'Lỗi khi cập nhật chiến dịch.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Đang Tải Chiến Dịch" subtitle="Đang lấy thông tin chi tiết từ hệ thống...">
        <div className="p-16 text-center text-xs text-white/50 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border border-champagne/40 border-t-champagne animate-spin" />
          <span>Đang tải dữ liệu...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={`Chỉnh Sửa: ${name || 'Chiến Dịch'}`}
      subtitle="Cập nhật thông số chiến dịch, thời gian biểu và thiết lập Popup Banner"
    >
      <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-12">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <Link
            to={`/admin/campaigns/${id}`}
            className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại trang chi tiết chiến dịch</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-3.5 py-2 bg-[var(--bg-card)] hover:bg-[var(--table-row-hover)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] text-xs font-mono uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shadow-xs hover:shadow-sm cursor-pointer"
            >
              <Eye className="w-4 h-4 text-[var(--accent)]" />
              <span>Xem Trước Popup</span>
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[var(--accent)] hover:brightness-105 text-[var(--accent-contrast)] border border-[var(--accent)] font-mono text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </div>

        {formError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Section 1: Basic Campaign Info */}
        <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-5">
          <div className="flex items-center gap-2 text-champagne text-xs font-mono uppercase tracking-widest border-b border-white/10 pb-3">
            <Tag className="w-4 h-4" />
            <span>1. Thông Tin Chiến Dịch</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                Tên Chiến Dịch <span className="text-champagne">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white focus:border-champagne focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                Đường Dẫn Rút Gọn (Slug - Cố định)
              </label>
              <input
                type="text"
                disabled
                value={slug}
                className="w-full bg-noir-950/60 border border-white/5 rounded-sm px-3.5 py-2.5 text-xs text-white/50 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                Loại Chiến Dịch
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white focus:border-champagne focus:outline-none"
              >
                <option value="flash_sale">Flash Sale</option>
                <option value="seasonal">Sự Kiện Mùa (Seasonal)</option>
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
                  Trạng Thái
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white focus:border-champagne focus:outline-none"
                >
                  <option value="draft">Bản Nháp (Draft)</option>
                  <option value="scheduled">Đã Lên Lịch (Scheduled)</option>
                  <option value="active">Đang Diễn Ra (Active)</option>
                  <option value="ended">Đã Kết Thúc (Ended)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Scheduling */}
        <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-5">
          <div className="flex items-center gap-2 text-champagne text-xs font-mono uppercase tracking-widest border-b border-white/10 pb-3">
            <Calendar className="w-4 h-4" />
            <span>2. Khung Giờ Hoạt Động</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                Thời Gian Bắt Đầu
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
                Thời Gian Kết Thúc
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

        {/* Section 3: Discount Rule */}
        {(type === 'seasonal' || hasDiscountRule) && (
          <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-champagne text-xs font-mono uppercase tracking-widest">
                <Percent className="w-4 h-4" />
                <span>3. Quy Tắc Giảm Giá (Discount Rule)</span>
              </div>
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
                  <option value="all">Toàn Bộ Sản Phẩm</option>
                  <option value="categories">Theo Danh Mục</option>
                  <option value="products">Theo Sản Phẩm</option>
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
                  <option value="percentage">Phần Trăm (%)</option>
                  <option value="fixed">Số Tiền (VNĐ)</option>
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
          </div>
        )}

        {/* Section 4: Popup Banner & Smart Redirect */}
        <div className="p-6 bg-noir-900 border border-white/10 rounded-sm space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 text-champagne text-xs font-mono uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>4. Cấu Hình Popup Banner & Smart Redirect</span>
            </div>
            <div className="flex items-center gap-2.5">
              <StatusToggle
                checked={enablePopup}
                onChange={setEnablePopup}
                ariaLabel="Bật Popup Banner trên Storefront"
              />
              <span className="font-medium text-xs text-champagne select-none">Bật Popup Banner trên Storefront</span>
            </div>
          </div>

          {enablePopup && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                    Tiêu Đề Popup
                  </label>
                  <input
                    type="text"
                    value={popupTitle}
                    onChange={(e) => setPopupTitle(e.target.value)}
                    className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white focus:border-champagne focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                    Nút Kêu Gọi (CTA Text)
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white focus:border-champagne focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-2">
                  Phụ Đề / Mô Tả Ngắn
                </label>
                <textarea
                  rows={2}
                  value={popupSubtitle}
                  onChange={(e) => setPopupSubtitle(e.target.value)}
                  className="w-full bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white focus:border-champagne focus:outline-none resize-none"
                />
              </div>

              {/* Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                <div className="space-y-3">
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                    Ảnh Banner Desktop
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={desktopImage}
                      onChange={(e) => setDesktopImage(e.target.value)}
                      className="flex-1 bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white font-mono focus:border-champagne focus:outline-none"
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

                <div className="space-y-3">
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                    Ảnh Banner Mobile
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={mobileImage}
                      onChange={(e) => setMobileImage(e.target.value)}
                      className="flex-1 bg-noir-950 border border-white/10 rounded-sm px-3.5 py-2.5 text-xs text-white font-mono focus:border-champagne focus:outline-none"
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

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to={`/admin/campaigns/${id}`}
            className="px-5 py-2.5 bg-[var(--bg-card)] hover:bg-[var(--table-row-hover)] border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-primary)] text-xs font-mono uppercase tracking-wider rounded-lg transition-all shadow-xs hover:shadow-sm"
          >
            Hủy Bỏ
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="px-7 py-2.5 bg-[var(--accent)] hover:brightness-105 text-[var(--accent-contrast)] border border-[var(--accent)] font-mono text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </form>

      {/* Preview Modal */}
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

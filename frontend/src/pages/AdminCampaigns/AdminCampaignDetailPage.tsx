import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Power,
  Eye,
  Plus,
  Package,
  Clock,
  Sparkles,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Tag,
  CheckCircle,
} from 'lucide-react';
import { AdminLayout } from '../Admin/AdminLayout';
import { campaignsApi, productsApi } from '@/shared/api';
import { Campaign, CampaignProductItem, CampaignStats } from '@/shared/campaigns';
import { PopupPreviewModal } from './components/PopupPreviewModal';
import { useToastStore } from '@/shared/stores/useToastStore';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';

export const AdminCampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [products, setProducts] = useState<CampaignProductItem[]>([]);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Add product modal state
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [salePrice, setSalePrice] = useState<number>(0);
  const [quota, setQuota] = useState<number>(100);
  const [perUserLimit, setPerUserLimit] = useState<number>(2);
  const [addingProduct, setAddingProduct] = useState(false);
  const [addProductError, setAddProductError] = useState<string | null>(null);

  // Edit product modal state
  const [editingProduct, setEditingProduct] = useState<CampaignProductItem | null>(null);
  const [editSalePrice, setEditSalePrice] = useState<number>(0);
  const [editQuota, setEditQuota] = useState<number>(0);
  const [updatingProduct, setUpdatingProduct] = useState(false);

  const { overlayZIndex: addProdOverlayZ, contentZIndex: addProdContentZ } = useModal({
    id: 'admin-campaign-add-product-modal',
    isOpen: isAddProductModalOpen,
    onClose: () => setIsAddProductModalOpen(false),
  });

  const { overlayZIndex: editProdOverlayZ, contentZIndex: editProdContentZ } = useModal({
    id: 'admin-campaign-edit-product-modal',
    isOpen: Boolean(editingProduct),
    onClose: () => setEditingProduct(null),
  });

  const fetchCampaignDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await campaignsApi.getAdminCampaignDetail(id);
      if (response && response.data) {
        setCampaign(response.data.campaign);
        setProducts(response.data.products || []);
        setStats(response.data.stats || null);
      }
    } catch (err: any) {
      console.error('[AdminCampaignDetail] Error loading campaign:', err);
      setError(err?.response?.data?.message || 'Không thể tải chi tiết chiến dịch.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaignDetail();
  }, [fetchCampaignDetail]);

  // Load available products for adding
  const handleOpenAddProduct = async () => {
    setIsAddProductModalOpen(true);
    setAddProductError(null);
    try {
      const res = await productsApi.getProducts({ limit: 100 });
      if (res?.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data as any)?.products || [];
        setAvailableProducts(list);
        if (list.length > 0) {
          const first = list[0];
          setSelectedProductId(first._id);
          const origPrice = first.new_price ?? first.price ?? 100000;
          setSalePrice(Math.round(origPrice * 0.8));
        }
      }
    } catch (err) {
      console.warn('[AdminCampaignDetail] Error loading catalog products:', err);
    }
  };

  const handleProductSelectChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = availableProducts.find((p) => p._id === prodId);
    if (prod) {
      const origPrice = prod.new_price ?? prod.price ?? 100000;
      setSalePrice(Math.round(origPrice * 0.8));
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedProductId) return;

    const prod = availableProducts.find((p) => p._id === selectedProductId);
    const origPrice = Number(prod?.new_price ?? prod?.price ?? 0);
    if (salePrice >= origPrice) {
      setAddProductError(`Giá khuyến mãi (${salePrice.toLocaleString('vi-VN')}₫) phải nhỏ hơn giá gốc (${origPrice.toLocaleString('vi-VN')}₫).`);
      return;
    }

    setAddingProduct(true);
    setAddProductError(null);
    try {
      await campaignsApi.addCampaignProduct(id, {
        product_id: selectedProductId,
        sale_price: Number(salePrice),
        quota: Number(quota),
        per_user_limit: Number(perUserLimit) || null,
      });

      addToast('Thêm sản phẩm vào chiến dịch thành công!', 'success');
      setIsAddProductModalOpen(false);
      fetchCampaignDetail();
    } catch (err: any) {
      setAddProductError(err?.response?.data?.message || 'Không thể thêm sản phẩm.');
    } finally {
      setAddingProduct(false);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!id) return;
    if (!window.confirm('Bạn có chắc muốn gỡ sản phẩm này khỏi chiến dịch?')) return;

    try {
      await campaignsApi.removeCampaignProduct(id, productId);
      addToast('Đã gỡ sản phẩm khỏi chiến dịch.', 'success');
      fetchCampaignDetail();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Lỗi khi gỡ sản phẩm.', 'error');
    }
  };

  const handleOpenEditProduct = (cp: CampaignProductItem) => {
    setEditingProduct(cp);
    setEditSalePrice(cp.sale_price);
    setEditQuota(cp.quota);
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !editingProduct?._id) return;

    setUpdatingProduct(true);
    try {
      await campaignsApi.updateCampaignProduct(id, editingProduct._id, {
        sale_price: Number(editSalePrice),
        quota: Number(editQuota),
      });
      addToast('Cập nhật sản phẩm thành công!', 'success');
      setEditingProduct(null);
      fetchCampaignDetail();
    } catch (err: any) {
      addToast(err?.response?.data?.message || 'Lỗi khi cập nhật sản phẩm.', 'error');
    } finally {
      setUpdatingProduct(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Đang Tải Chi Tiết" subtitle="Đang lấy dữ liệu chiến dịch từ Backend...">
        <div className="p-16 text-center text-xs text-white/50 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border border-champagne/40 border-t-champagne animate-spin" />
          <span>Đang truy xuất thông số chiến dịch và số liệu bán hàng...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error || !campaign) {
    return (
      <AdminLayout title="Lỗi Truy Cập" subtitle="Không thể hiển thị thông tin chiến dịch">
        <div className="p-12 text-center text-xs text-rose-400 bg-rose-500/5 max-w-xl mx-auto rounded-sm border border-rose-500/20">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm font-medium mb-4">{error || 'Chiến dịch không tồn tại.'}</p>
          <Link
            to="/admin/campaigns"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại danh sách</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const banner = typeof campaign.bannerId === 'object' ? (campaign.bannerId as any) : null;
  const startStr = new Date(campaign.startAt).toLocaleString('vi-VN');
  const endStr = new Date(campaign.endAt).toLocaleString('vi-VN');

  return (
    <AdminLayout
      title={`Chi Tiết: ${campaign.name}`}
      subtitle="Quản lý hiệu suất, danh sách sản phẩm ưu đãi và cấu hình Popup Banner"
    >
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* Top Navigation & Action Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <Link
            to="/admin/campaigns"
            className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại danh sách chiến dịch</span>
          </Link>

          <div className="flex items-center gap-3">
            {banner && (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-3.5 py-2 bg-noir-900 hover:bg-white/10 border border-white/10 text-white text-xs rounded-sm flex items-center gap-2 transition-colors"
              >
                <Eye className="w-4 h-4 text-champagne" />
                <span>Xem Trước Popup Banner</span>
              </button>
            )}

            <Link
              to={`/admin/campaigns/${campaign._id}/edit`}
              className="px-4 py-2 bg-champagne hover:bg-champagne-light text-noir-950 font-serif text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-2 transition-colors shadow-md"
            >
              <Edit3 className="w-4 h-4" />
              <span>Chỉnh Sửa Chiến Dịch</span>
            </Link>
          </div>
        </div>

        {/* Live Performance Analytics Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-noir-900 border border-white/10 rounded-sm">
            <div className="flex items-center justify-between text-white/50 text-xs mb-2">
              <span className="font-mono uppercase tracking-wider">Doanh Thu Chiến Dịch</span>
              <DollarSign className="w-4 h-4 text-champagne" />
            </div>
            <div className="text-xl sm:text-2xl font-serif text-white font-light">
              {(stats?.totalRevenue || 0).toLocaleString('vi-VN')}₫
            </div>
            <span className="text-[10px] text-white/40 mt-1 block">
              Tổng giá trị từ đơn hàng có mã chiến dịch
            </span>
          </div>

          <div className="p-5 bg-noir-900 border border-white/10 rounded-sm">
            <div className="flex items-center justify-between text-white/50 text-xs mb-2">
              <span className="font-mono uppercase tracking-wider">Sản Phẩm Đã Bán</span>
              <Package className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-serif text-white font-light">
              {(stats?.totalItemsSold || stats?.totalSold || 0).toLocaleString('vi-VN')}
            </div>
            <span className="text-[10px] text-white/40 mt-1 block">
              Số lượng sản phẩm ưu đãi đã chốt đơn
            </span>
          </div>

          <div className="p-5 bg-noir-900 border border-white/10 rounded-sm">
            <div className="flex items-center justify-between text-white/50 text-xs mb-2">
              <span className="font-mono uppercase tracking-wider">Đơn Hàng Ghi Nhận</span>
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-serif text-white font-light">
              {(stats?.totalOrders || 0).toLocaleString('vi-VN')}
            </div>
            <span className="text-[10px] text-white/40 mt-1 block">
              Số lượng đơn hàng tham gia ưu đãi
            </span>
          </div>

          <div className="p-5 bg-noir-900 border border-white/10 rounded-sm">
            <div className="flex items-center justify-between text-white/50 text-xs mb-2">
              <span className="font-mono uppercase tracking-wider">Suất Bán Còn Lại</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl sm:text-2xl font-serif text-champagne font-light">
              {(stats?.totalRemainingQuota || 0).toLocaleString('vi-VN')}{' '}
              <span className="text-xs text-white/40 font-mono">
                / {(stats?.totalQuota || 0).toLocaleString('vi-VN')}
              </span>
            </div>
            <span className="text-[10px] text-white/40 mt-1 block">
              Tổng số suất khuyến mãi còn khả dụng
            </span>
          </div>
        </div>

        {/* Campaign Info & Banner Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Details Info */}
          <div className="lg:col-span-2 p-6 bg-noir-900 border border-white/10 rounded-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif text-base text-white uppercase tracking-wider">
                Thông Số Hoạt Động
              </h3>
              <span className="text-xs font-mono uppercase bg-champagne/15 text-champagne border border-champagne/30 px-2.5 py-0.5">
                {campaign.type === 'flash_sale' ? 'Flash Sale' : 'Sự Kiện Mùa'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-white/50 block font-mono text-[10px] uppercase">Slug Chiến Dịch</span>
                <span className="text-white font-mono text-xs">{campaign.slug}</span>
              </div>
              <div>
                <span className="text-white/50 block font-mono text-[10px] uppercase">Độ Ưu Tiên</span>
                <span className="text-champagne font-mono font-bold">{campaign.priority || 0}</span>
              </div>
              <div>
                <span className="text-white/50 block font-mono text-[10px] uppercase">Thời Gian Bắt Đầu</span>
                <span className="text-white font-mono">{startStr}</span>
              </div>
              <div>
                <span className="text-white/50 block font-mono text-[10px] uppercase">Thời Gian Kết Thúc</span>
                <span className="text-white font-mono">{endStr}</span>
              </div>
              <div>
                <span className="text-white/50 block font-mono text-[10px] uppercase">Trạng Thái Hệ Thống</span>
                <span className="text-emerald-400 font-mono uppercase">{campaign.status}</span>
              </div>
              <div>
                <span className="text-white/50 block font-mono text-[10px] uppercase">Quy Tắc Giảm Giá</span>
                <span className="text-white/80">
                  {campaign.discountRule
                    ? `${campaign.discountRule.discountValue}${
                        campaign.discountRule.discountType === 'percentage' ? '%' : '₫'
                      } (Phạm vi: ${campaign.discountRule.scope})`
                    : 'Theo từng sản phẩm'}
                </span>
              </div>
            </div>
          </div>

          {/* Popup Banner Visual Preview Card */}
          <div className="p-6 bg-noir-900 border border-white/10 rounded-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 className="font-serif text-base text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-champagne" />
                  <span>Popup Banner</span>
                </h3>
                {banner ? (
                  <span className="text-[10px] text-emerald-400 font-mono uppercase">Đang Bật</span>
                ) : (
                  <span className="text-[10px] text-white/40 font-mono uppercase">Chưa Gắn Banner</span>
                )}
              </div>

              {banner ? (
                <div className="space-y-3">
                  <div className="w-full h-36 rounded-xs overflow-hidden border border-white/10 bg-black relative group">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        onClick={() => setIsPreviewOpen(true)}
                        className="px-3 py-1 bg-champagne text-noir-950 font-serif text-[11px] font-semibold uppercase tracking-wider"
                      >
                        Mở Xem Trước
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{banner.title}</h4>
                    {banner.subtitle && (
                      <p className="text-xs text-white/50 line-clamp-2 mt-0.5">{banner.subtitle}</p>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-champagne pt-1">
                    Đích đến: {banner.linkUrl || `targetId: ${banner.targetId || 'N/A'}`}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-white/40">
                  Chiến dịch này chưa được liên kết với Popup Banner. Hãy chọn "Chỉnh Sửa" để cấu hình
                  hình ảnh và đích đến thông minh.
                </div>
              )}
            </div>

            {banner && (
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="w-full mt-4 py-2 bg-noir-950 hover:bg-white/5 border border-white/10 text-white text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 rounded-xs transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-champagne" />
                <span>Xem Thử Giao Diện Popup</span>
              </button>
            )}
          </div>
        </div>

        {/* Participating Products Section */}
        <div className="bg-noir-900 border border-white/10 rounded-sm overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-base text-white uppercase tracking-wider">
                Sản Phẩm Trong Chiến Dịch ({products.length})
              </h3>
              <p className="text-xs text-white/50 mt-0.5">
                Danh sách các sản phẩm và biến thể được thiết lập mức giá ưu đãi và giới hạn suất bán.
              </p>
            </div>
            <button
              onClick={handleOpenAddProduct}
              className="px-4 py-2 bg-champagne hover:bg-champagne-light text-noir-950 font-serif text-xs font-semibold uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Sản Phẩm</span>
            </button>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center text-xs text-white/50">
              <Package className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/70 font-medium mb-1">Chưa có sản phẩm nào trong chiến dịch</p>
              <p className="text-white/40 mb-4">
                Thêm sản phẩm để áp dụng mức giá Flash Sale riêng biệt cho từng tuyệt tác thời trang.
              </p>
              <button
                onClick={handleOpenAddProduct}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-champagne text-noir-950 font-serif text-xs uppercase font-semibold rounded-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Sản Phẩm Ngay</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-noir-950/70 border-b border-white/10 text-[11px] font-mono uppercase text-white/60 tracking-wider">
                    <th className="py-3 px-4">Sản Phẩm</th>
                    <th className="py-3 px-4">Giá Ưu Đãi (Sale)</th>
                    <th className="py-3 px-4">Tổng Suất (Quota)</th>
                    <th className="py-3 px-4">Đã Bán</th>
                    <th className="py-3 px-4">Còn Lại</th>
                    <th className="py-3 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.map((item) => {
                    const prodName =
                      typeof item.product_id === 'object' && item.product_id?.name
                        ? item.product_id.name
                        : item.name || 'Sản phẩm Atelier';
                    const prodImg =
                      typeof item.product_id === 'object' && item.product_id?.image
                        ? item.product_id.image
                        : item.image;
                    const remaining = Math.max(0, item.quota - (item.sold || 0));

                    return (
                      <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {prodImg ? (
                              <img
                                src={prodImg}
                                alt={prodName}
                                className="w-9 h-9 object-cover rounded-xs border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 bg-white/5 flex items-center justify-center shrink-0">
                                <Package className="w-4 h-4 text-white/40" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-white line-clamp-1">{prodName}</p>
                              {item.per_user_limit && (
                                <p className="text-[10px] text-white/40 font-mono">
                                  Giới hạn: {item.per_user_limit} sản phẩm / khách
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-champagne">
                          {item.sale_price.toLocaleString('vi-VN')}₫
                        </td>

                        <td className="py-3 px-4 font-mono text-white/80">
                          {item.quota.toLocaleString('vi-VN')}
                        </td>

                        <td className="py-3 px-4 font-mono text-sky-400">
                          {(item.sold || 0).toLocaleString('vi-VN')}
                        </td>

                        <td className="py-3 px-4 font-mono text-emerald-400">
                          {remaining.toLocaleString('vi-VN')}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditProduct(item)}
                              className="p-1.5 text-white/60 hover:text-white hover:bg-white/5 rounded-xs transition-colors"
                              title="Sửa giá & quota"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleRemoveProduct(item._id!)}
                              className="p-1.5 text-white/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-xs transition-colors"
                              title="Xóa khỏi chiến dịch"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddProductModalOpen && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto"
            style={{ zIndex: addProdOverlayZ }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsAddProductModalOpen(false);
            }}
          >
            <div
              className="w-full max-w-lg bg-noir-900 border border-white/20 p-6 rounded-sm text-white shadow-2xl space-y-4 max-h-[calc(100dvh-32px)] overflow-y-auto"
              style={{ zIndex: addProdContentZ }}
            >
              <h3 className="font-serif text-base uppercase tracking-wider font-medium text-champagne">
                Thêm Sản Phẩm Vào Chiến Dịch
              </h3>

              {addProductError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xs">
                  {addProductError}
                </div>
              )}

              <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                    Chọn Sản Phẩm Từ Danh Mục
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelectChange(e.target.value)}
                    className="w-full bg-noir-950 border border-white/10 rounded-sm px-3 py-2 text-xs text-white focus:border-champagne focus:outline-none"
                  >
                    {availableProducts.map((p) => {
                      const price = p.new_price ?? p.price ?? 0;
                      return (
                        <option key={p._id} value={p._id}>
                          {p.name} - Giá gốc: {price.toLocaleString('vi-VN')}₫
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                      Giá Khuyến Mãi (Sale Price VNĐ) <span className="text-champagne">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1000"
                      value={salePrice}
                      onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
                      className="w-full bg-noir-950 border border-white/10 rounded-sm px-3 py-2 text-xs text-white font-mono focus:border-champagne focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                      Tổng Suất Bán (Quota) <span className="text-champagne">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quota}
                      onChange={(e) => setQuota(parseInt(e.target.value, 10) || 1)}
                      className="w-full bg-noir-950 border border-white/10 rounded-sm px-3 py-2 text-xs text-white font-mono focus:border-champagne focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                    Giới Hạn Mua Mỗi Khách Hàng (Tùy chọn)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-noir-950 border border-white/10 rounded-sm px-3 py-2 text-xs text-white font-mono focus:border-champagne focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddProductModalOpen(false)}
                    className="px-4 py-2 bg-noir-950 border border-white/10 text-xs text-white/70 hover:text-white rounded-xs"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={addingProduct}
                    className="px-5 py-2 bg-champagne hover:bg-champagne-light text-noir-950 font-serif text-xs font-semibold uppercase tracking-wider rounded-xs shadow-md disabled:opacity-50"
                  >
                    {addingProduct ? 'Đang thêm...' : 'Xác Nhận Thêm'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <ModalPortal>
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto"
            style={{ zIndex: editProdOverlayZ }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setEditingProduct(null);
            }}
          >
            <div
              className="w-full max-w-md bg-noir-900 border border-white/20 p-6 rounded-sm text-white shadow-2xl space-y-4 max-h-[calc(100dvh-32px)] overflow-y-auto"
              style={{ zIndex: editProdContentZ }}
            >
              <h3 className="font-serif text-base uppercase tracking-wider font-medium text-champagne">
                Sửa Mức Giá & Quota Sản Phẩm
              </h3>

              <form onSubmit={handleUpdateProductSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                    Giá Khuyến Mãi (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    value={editSalePrice}
                    onChange={(e) => setEditSalePrice(Number(e.target.value) || 0)}
                    className="w-full bg-noir-950 border border-white/10 rounded-sm px-3 py-2 text-xs text-white font-mono focus:border-champagne focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70 mb-1.5">
                    Tổng Suất Bán (Quota)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editQuota}
                    onChange={(e) => setEditQuota(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-noir-950 border border-white/10 rounded-sm px-3 py-2 text-xs text-white font-mono focus:border-champagne focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2 bg-noir-950 border border-white/10 text-xs text-white/70 hover:text-white rounded-xs"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={updatingProduct}
                    className="px-5 py-2 bg-champagne hover:bg-champagne-light text-noir-950 font-serif text-xs font-semibold uppercase tracking-wider rounded-xs shadow-md disabled:opacity-50"
                  >
                    {updatingProduct ? 'Đang cập nhật...' : 'Lưu Thay Đổi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Live Preview Modal */}
      {banner && (
        <PopupPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title={banner.title}
          subtitle={banner.subtitle}
          desktopImage={banner.imageUrl}
          mobileImage={banner.mobileImageUrl}
          ctaText={banner.buttonText}
          campaignType={campaign.type}
        />
      )}
    </AdminLayout>
  );
};

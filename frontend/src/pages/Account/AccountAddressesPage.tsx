import React, { useState } from 'react';
import { AccountLayout } from './AccountLayout';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useToastStore } from '@/shared/stores/useToastStore';
import { MapPin, Plus, Trash2, CheckCircle2, X } from 'lucide-react';
import { ShippingAddress } from '@/shared/types';

export const AccountAddressesPage: React.FC = () => {
  const { user, addAddress, removeAddress, setDefaultAddress } = useAuthStore();
  const { addToast } = useToastStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ShippingAddress>({
    name: 'Tư gia',
    firstName: user?.name.split(' ')[0] || 'Geneviève',
    lastName: user?.name.split(' ')[1] || 'Laurent',
    email: user?.email || 'patron@verite-atelier.com',
    phone: user?.phone || '+84 90 123 4567',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Việt Nam',
    isDefault: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.addressLine1 || !formData.city || !formData.postalCode) {
      addToast({
        type: 'error',
        title: 'Chưa đủ thông tin',
        message: 'Vui lòng điền đầy đủ các thông tin địa chỉ bắt buộc.',
      });
      return;
    }

    addAddress(formData);
    setIsModalOpen(false);
    setFormData({
      name: 'Tư gia',
      firstName: user?.name.split(' ')[0] || 'Geneviève',
      lastName: user?.name.split(' ')[1] || 'Laurent',
      email: user?.email || 'patron@verite-atelier.com',
      phone: user?.phone || '+84 90 123 4567',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Việt Nam',
      isDefault: false,
    });
    addToast({
      type: 'success',
      title: 'Đã thêm địa chỉ',
      message: 'Địa chỉ giao hàng mới đã được lưu thành công vào hồ sơ của quý khách.',
    });
  };

  return (
    <AccountLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-6 gap-4">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
              SỔ ĐỊA CHỈ CONCIERGE
            </span>
            <h1 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
              Sổ Địa Chỉ Giao Hàng
            </h1>
            <p className="text-xs text-platinum-dark font-sans mt-0.5">
              Quản lý các địa chỉ nhận kiện hàng găng tay trắng tại tư gia hoặc văn phòng đại diện.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold text-xs uppercase tracking-widest rounded-lg transition-colors flex items-center gap-2 self-start sm:self-auto shadow-md"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm địa chỉ mới</span>
          </button>
        </div>

        {/* Address Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {user?.addresses.map((addr, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl border relative transition-colors ${
                addr.isDefault
                  ? 'bg-noir-900 border-champagne/40 shadow-lg'
                  : 'bg-noir-950 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-display text-base text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-champagne" /> {addr.name || `Địa chỉ #${index + 1}`}
                </span>
                {addr.isDefault && (
                  <span className="px-2.5 py-0.5 rounded-full bg-champagne/15 text-champagne text-[10px] font-mono uppercase tracking-wider">
                    Mặc định
                  </span>
                )}
              </div>

              <div className="text-xs font-sans text-platinum-dark space-y-1 mb-6">
                <p className="text-white font-medium">{addr.firstName} {addr.lastName}</p>
                <p className="text-white">{addr.addressLine1}</p>
                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                <p>
                  {addr.city}, {addr.state} {addr.postalCode}
                </p>
                <p>{addr.country}</p>
                <p className="font-mono text-white/50 pt-1">{addr.phone}</p>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs font-sans">
                {!addr.isDefault ? (
                  <button
                    onClick={() => setDefaultAddress(index)}
                    className="text-white/60 hover:text-champagne transition-colors underline"
                  >
                    Đặt làm mặc định
                  </button>
                ) : (
                  <span className="text-champagne flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Địa chỉ chính thức
                  </span>
                )}

                <button
                  onClick={() => removeAddress(index)}
                  className="text-white/40 hover:text-red-400 p-1 transition-colors"
                  aria-label="Xóa địa chỉ"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal for adding address */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-lg bg-noir-950 border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="font-display text-xl text-white">Thêm Địa Chỉ Giao Hàng</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/60 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-white/60 mb-1">Tên nhãn địa chỉ *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="VD: Tư gia, Văn phòng, Biệt thự..."
                    className="w-full px-4 py-2.5 bg-noir-900 border border-white/15 rounded-lg text-white outline-none focus:border-champagne"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 mb-1">Tên người nhận *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-noir-900 border border-white/15 rounded-lg text-white outline-none focus:border-champagne"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 mb-1">Họ người nhận *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-noir-900 border border-white/15 rounded-lg text-white outline-none focus:border-champagne"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 mb-1">Địa chỉ đường / số nhà *</label>
                  <input
                    type="text"
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    required
                    placeholder="Số nhà, tên đường..."
                    className="w-full px-4 py-2.5 bg-noir-900 border border-white/15 rounded-lg text-white outline-none focus:border-champagne"
                  />
                </div>

                <div>
                  <label className="block text-white/60 mb-1">Căn hộ / Tòa nhà (Tùy chọn)</label>
                  <input
                    type="text"
                    value={formData.addressLine2 || ''}
                    onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                    placeholder="Phòng, số tầng..."
                    className="w-full px-4 py-2.5 bg-noir-900 border border-white/15 rounded-lg text-white outline-none focus:border-champagne"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 mb-1">Thành phố *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      placeholder="TP. Hồ Chí Minh"
                      className="w-full px-4 py-2.5 bg-noir-900 border border-white/15 rounded-lg text-white outline-none focus:border-champagne"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 mb-1">Mã bưu chính *</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      required
                      placeholder="700000"
                      className="w-full px-4 py-2.5 bg-noir-900 border border-white/15 rounded-lg text-white outline-none focus:border-champagne font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/60 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required
                      placeholder="+84 90 123 4567"
                      className="w-full px-4 py-2.5 bg-noir-900 border border-white/15 rounded-lg text-white outline-none focus:border-champagne font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-white/60 mb-1">Quốc gia</label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-4 py-2.5 bg-noir-900 border border-white/15 rounded-lg text-white outline-none focus:border-champagne"
                    >
                      <option value="Việt Nam">Việt Nam</option>
                      <option value="France">Pháp</option>
                      <option value="Japan">Nhật Bản</option>
                      <option value="United States">Hoa Kỳ</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-lg border border-white/10 text-white/60 hover:text-white"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold uppercase tracking-wider rounded-lg transition-colors"
                  >
                    Lưu địa chỉ
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AccountLayout>
  );
};

import React, { useState } from 'react';
import { AccountLayout } from './AccountLayout';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { useToastStore } from '../../shared/stores/useToastStore';
import { ShieldCheck, UserCheck, Bell, Lock } from 'lucide-react';

export const AccountSettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, phone });
    addToast({
      type: 'success',
      title: 'Đã cập nhật hồ sơ',
      message: 'Thông tin cá nhân của quý khách đã được lưu thành công.',
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    setCurrentPassword('');
    setNewPassword('');
    addToast({
      type: 'success',
      title: 'Mật khẩu đã đổi',
      message: 'Mật khẩu tài khoản Patron đã được cập nhật bảo mật an toàn.',
    });
  };

  return (
    <AccountLayout>
      <div className="space-y-12">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-ultra text-champagne">
            CÀI ĐẶT BẢO MẬT & HỒ SƠ
          </span>
          <h1 className="font-display text-2xl sm:text-3xl text-white tracking-wide">
            Cài Đặt Tài Khoản Patron
          </h1>
          <p className="text-xs text-platinum-dark font-sans mt-0.5">
            Cập nhật thông tin định danh thành viên, phương thức bảo mật và kênh nhận thư mời Runway riêng.
          </p>
        </div>

        {/* Profile Details Form */}
        <div className="p-8 rounded-2xl bg-noir-950 border border-white/5 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <UserCheck className="w-4 h-4 text-champagne" />
            <h3 className="font-display text-lg text-white">Thông Tin Định Danh</h3>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs font-sans max-w-xl">
            <div>
              <label className="block text-white/60 mb-1.5">Họ và tên quý khách</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-noir-900 border border-white/15 rounded-lg text-white focus:border-champagne outline-none"
              />
            </div>

            <div>
              <label className="block text-white/60 mb-1.5">Email tài khoản (Cố định theo thẻ Patron)</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 bg-noir-900/50 border border-white/10 rounded-lg text-white/50 cursor-not-allowed outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-white/60 mb-1.5">Số điện thoại liên hệ riêng</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-noir-900 border border-white/15 rounded-lg text-white focus:border-champagne outline-none font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold uppercase tracking-wider rounded-lg transition-colors text-xs"
              >
                Lưu thay đổi hồ sơ
              </button>
            </div>
          </form>
        </div>

        {/* Password Reset Form */}
        <div className="p-8 rounded-2xl bg-noir-950 border border-white/5 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Lock className="w-4 h-4 text-champagne" />
            <h3 className="font-display text-lg text-white">Bảo Mật Mật Khẩu</h3>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs font-sans max-w-xl">
            <div>
              <label className="block text-white/60 mb-1.5">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-noir-900 border border-white/15 rounded-lg text-white focus:border-champagne outline-none"
              />
            </div>

            <div>
              <label className="block text-white/60 mb-1.5">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 bg-noir-900 border border-white/15 rounded-lg text-white focus:border-champagne outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold uppercase tracking-wider rounded-lg transition-colors text-xs"
              >
                Cập nhật mật khẩu mới
              </button>
            </div>
          </form>
        </div>

        {/* Notifications & Gazette */}
        <div className="p-8 rounded-2xl bg-noir-950 border border-white/5 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Bell className="w-4 h-4 text-champagne" />
            <h3 className="font-display text-lg text-white">Quyền Riêng Tư & Thư Mời Salon</h3>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none text-xs font-sans text-platinum-light">
            <input
              type="checkbox"
              checked={newsletterSubscribed}
              onChange={(e) => setNewsletterSubscribed(e.target.checked)}
              className="w-4 h-4 rounded text-champagne accent-champagne"
            />
            <span>
              Tiếp nhận thư mời riêng tham dự các buổi diễn Runway Paris & Tokyo, bản tin khảo luận nội bộ và thông báo bộ sưu tập giới hạn.
            </span>
          </label>
        </div>
      </div>
    </AccountLayout>
  );
};

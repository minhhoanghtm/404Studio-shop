import React, { useState } from 'react';
import { AccountLayout } from './AccountLayout';
import { useAuthStore } from '../../shared/stores/useAuthStore';
import { useToastStore } from '../../shared/stores/useToastStore';
import { ShieldCheck, UserCheck, Bell, Lock, Phone, Mail, KeyRound } from 'lucide-react';
import { SecurityVerificationModal, SensitiveActionType } from '../../shared/components/security/SecurityVerificationModal';

export const AccountSettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [name, setName] = useState(user?.name || '');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(true);

  // Security Modal state
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [activeActionType, setActiveActionType] = useState<SensitiveActionType>('PASSWORD_CHANGE');

  const handleOpenSecurityModal = (actionType: SensitiveActionType) => {
    setActiveActionType(actionType);
    setSecurityModalOpen(true);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name });
    addToast({
      type: 'success',
      title: 'Đã cập nhật hồ sơ',
      message: 'Thông tin cá nhân của quý khách đã được lưu thành công.',
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
            Cập nhật thông tin định danh thành viên, phương thức bảo mật hai lớp OTP và kênh nhận thư mời Runway riêng.
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

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-3 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold uppercase tracking-wider rounded-lg transition-colors text-xs"
              >
                Lưu thay đổi họ tên
              </button>
            </div>
          </form>
        </div>

        {/* Sensitive Information Security Management (OTP Protected) */}
        <div className="p-8 rounded-2xl bg-noir-950 border border-white/5 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <ShieldCheck className="w-4 h-4 text-champagne" />
            <h3 className="font-display text-lg text-white">Thông Tin Liên Hệ & Xác Thực Nhạy Cảm</h3>
          </div>
          <p className="text-xs text-platinum-dark font-sans">
            Theo tiêu chuẩn an ninh thông tin, việc thay đổi email, số điện thoại hoặc mật khẩu bắt buộc phải xác minh quyền sở hữu qua mã OTP gửi tới kênh tin cậy của bạn.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl text-xs font-sans">
            {/* Email Card */}
            <div className="p-5 rounded-xl bg-noir-900 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-white/80">
                <Mail className="w-4 h-4 text-champagne" />
                <span className="font-medium">Email Tài Khoản</span>
              </div>
              <div className="font-mono text-white text-xs truncate">
                {user?.email || 'Chưa thiết lập'}
              </div>
              <button
                type="button"
                onClick={() => handleOpenSecurityModal('EMAIL_CHANGE')}
                className="w-full py-2.5 px-3 rounded-lg border border-white/20 hover:border-champagne text-white hover:text-champagne transition-colors font-medium uppercase tracking-wider text-[11px]"
              >
                Yêu cầu đổi email
              </button>
            </div>

            {/* Phone Card */}
            <div className="p-5 rounded-xl bg-noir-900 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-white/80">
                <Phone className="w-4 h-4 text-champagne" />
                <span className="font-medium">Số Điện Thoại Xác Thực</span>
              </div>
              <div className="font-mono text-white text-xs">
                {user?.phone || 'Chưa thiết lập'}
              </div>
              <button
                type="button"
                onClick={() => handleOpenSecurityModal('PHONE_CHANGE')}
                className="w-full py-2.5 px-3 rounded-lg border border-white/20 hover:border-champagne text-white hover:text-champagne transition-colors font-medium uppercase tracking-wider text-[11px]"
              >
                Cập nhật số điện thoại (OTP)
              </button>
            </div>
          </div>
        </div>

        {/* Password Security Management (OTP Protected) */}
        <div className="p-8 rounded-2xl bg-noir-950 border border-white/5 space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Lock className="w-4 h-4 text-champagne" />
            <h3 className="font-display text-lg text-white">Bảo Mật Mật Khẩu</h3>
          </div>
          <p className="text-xs text-platinum-dark font-sans max-w-xl">
            Để bảo vệ tài khoản khỏi truy cập trái phép, thao tác đổi mật khẩu yêu cầu xác minh hai lớp bằng mã OTP trước khi thiết lập mật khẩu mới.
          </p>

          <div>
            <button
              type="button"
              onClick={() => handleOpenSecurityModal('PASSWORD_CHANGE')}
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-champagne hover:bg-champagne-hover text-noir-950 font-semibold uppercase tracking-wider rounded-lg transition-colors text-xs shadow-md shadow-champagne/20"
            >
              <KeyRound className="w-4 h-4" />
              <span>Xác Minh OTP Để Đổi Mật Khẩu</span>
            </button>
          </div>
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

      {/* Security Verification Modal */}
      <SecurityVerificationModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        actionType={activeActionType}
        initialIdentifier={user?.email || user?.phone || undefined}
      />
    </AccountLayout>
  );
};

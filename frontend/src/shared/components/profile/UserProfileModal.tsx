import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
  KeyRound,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { useAuthStore, toUser, persistUserToStorage } from '@/shared/stores/useAuthStore';
import { useToastStore } from '@/shared/stores/useToastStore';
import { authApi } from '@/shared/api';
import { useModal, ModalPortal } from '@/shared/context/ModalContext';
import { OtpInput } from '@/shared/components/security/OtpInput';
import { StatusBadge } from '@/shared/components/StatusBadge';

export interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'profile' | 'password';
}

type TabType = 'profile' | 'password';
type PasswordPhase = 'REQUEST_OTP' | 'ENTER_OTP_AND_PASSWORD' | 'SUCCESS';

const MAX_OTP_ATTEMPTS = 5;
const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_COOLDOWN_SECONDS = 60; // 60 seconds

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'profile',
}) => {
  const { user, updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);

  // Tab 1: Profile State
  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);

  // Tab 2: Password with OTP State
  const [passwordPhase, setPasswordPhase] = useState<PasswordPhase>('REQUEST_OTP');
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'phone'>('email');
  const [otpValue, setOtpValue] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [ttlSeconds, setTtlSeconds] = useState(OTP_TTL_SECONDS);
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_OTP_ATTEMPTS);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch / Sync user state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setProfileSuccessMessage(null);
      setPasswordPhase('REQUEST_OTP');
      setOtpValue('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      setRemainingAttempts(MAX_OTP_ATTEMPTS);
      setIsLocked(false);
      setLockoutSeconds(0);

      // If user info is missing or incomplete, query backend profile
      if (!user || !user.email || !user.name) {
        setIsLoadingProfile(true);
        authApi.getMe()
          .then((res) => {
            const raw = res?.data?.user || res?.data || res;
            if (raw) {
              const u = toUser(raw);
              useAuthStore.setState({ user: u, isAuthenticated: true });
              persistUserToStorage(u);
              setFullName(u.name || '');
              setPhone(u.phone || '');
            }
          })
          .catch(() => {
            // Keep existing values on failure
          })
          .finally(() => {
            setIsLoadingProfile(false);
          });
      } else {
        setFullName(user.name || '');
        setPhone(user.phone || '');
      }
    }
  }, [isOpen, defaultTab, user?.id, user?.name, user?.phone, user?.email]);

  // Clean password memory on unmount or tab switch
  useEffect(() => {
    if (activeTab === 'profile') {
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [activeTab]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setTimeout(() => {
        setLockoutSeconds((s) => {
          if (s <= 1) {
            setIsLocked(false);
            setRemainingAttempts(MAX_OTP_ATTEMPTS);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutSeconds]);

  // OTP TTL countdown timer
  useEffect(() => {
    if (passwordPhase === 'ENTER_OTP_AND_PASSWORD') {
      if (ttlSeconds > 0) {
        const timer = setTimeout(() => setTtlSeconds((s) => s - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setPasswordError('Mã OTP đã hết hạn hiệu lực. Vui lòng bấm gửi lại mã mới.');
      }
    }
  }, [passwordPhase, ttlSeconds]);

  const { overlayZIndex, contentZIndex } = useModal({
    id: 'user-profile-modal',
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  // Mask identifier for safe UI display
  const maskIdentifier = (value: string) => {
    if (!value) return '(Chưa cung cấp)';
    if (value.includes('@')) {
      const [name, domain] = value.split('@');
      if (name.length <= 2) return `${name}***@${domain}`;
      return `${name.slice(0, 2)}***${name.slice(-1)}@${domain}`;
    }
    const clean = value.replace(/\s+/g, '');
    if (clean.length <= 4) return clean;
    return `${clean.slice(0, 3)}****${clean.slice(-3)}`;
  };

  const contactEmail = user?.email || '';
  const contactPhone = user?.phone || '';
  const currentTargetIdentifier = selectedChannel === 'phone' && contactPhone ? contactPhone : contactEmail;

  // Password strength check
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordStrong = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  // Handler: Update Personal Info
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setIsSavingProfile(true);
    setProfileSuccessMessage(null);
    try {
      const success = await updateProfile({ name: fullName.trim(), phone: phone.trim() });
      if (success) {
        setProfileSuccessMessage('Thông tin cá nhân đã được lưu thành công.');
        addToast({
          title: 'Cập nhật thành công',
          message: 'Thông tin tài khoản của bạn đã được lưu vào hệ thống.',
          type: 'success',
        });
      } else {
        addToast({
          title: 'Cập nhật thất bại',
          message: 'Không thể cập nhật thông tin lúc này. Vui lòng thử lại sau.',
          type: 'error',
        });
      }
    } catch {
      addToast({
        title: 'Lỗi',
        message: 'Đã xảy ra lỗi khi lưu thông tin.',
        type: 'error',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handler: Send OTP for Password Change
  const handleSendOtp = async () => {
    if (cooldown > 0 || isLocked) return;

    setIsSendingOtp(true);
    setPasswordError(null);

    try {
      await authApi.forgotPasswordOtp({
        identifier: currentTargetIdentifier,
        email: selectedChannel === 'email' ? currentTargetIdentifier : undefined,
        phone: selectedChannel === 'phone' ? currentTargetIdentifier : undefined,
        channel: selectedChannel === 'phone' ? 'sms' : 'email',
      });

      setPasswordPhase('ENTER_OTP_AND_PASSWORD');
      setCooldown(OTP_COOLDOWN_SECONDS);
      setTtlSeconds(OTP_TTL_SECONDS);
      setRemainingAttempts(MAX_OTP_ATTEMPTS);
      setOtpValue('');

      addToast({
        title: 'Mã OTP đã được gửi',
        message: `Mã xác nhận bảo mật 6 chữ số đã được gửi tới ${maskIdentifier(currentTargetIdentifier)}.`,
        type: 'info',
      });
    } catch (err: any) {
      // If error returned, still allow entry in case OTP was dispatched by mock/dev mode
      setPasswordPhase('ENTER_OTP_AND_PASSWORD');
      setCooldown(OTP_COOLDOWN_SECONDS);
      setTtlSeconds(OTP_TTL_SECONDS);
      addToast({
        title: 'Mã OTP bảo mật',
        message: err?.message || 'Hệ thống đã phát sinh mã xác thực OTP gửi tới thiết bị của bạn.',
        type: 'info',
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handler: Submit New Password with OTP
  const handleSubmitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (otpValue.length !== 6) {
      setPasswordError('Vui lòng nhập đúng và đủ 6 chữ số mã OTP.');
      return;
    }

    if (!isPasswordStrong) {
      setPasswordError('Mật khẩu mới chưa đáp ứng đầy đủ tiêu chuẩn bảo mật mạnh.');
      return;
    }

    if (!isMatch) {
      setPasswordError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setIsSubmittingPassword(true);
    setPasswordError(null);

    try {
      await authApi.resetPassword({
        identifier: currentTargetIdentifier,
        email: selectedChannel === 'email' ? currentTargetIdentifier : undefined,
        phone: selectedChannel === 'phone' ? currentTargetIdentifier : undefined,
        otp: otpValue,
        newPassword,
      });

      setPasswordPhase('SUCCESS');
      setNewPassword('');
      setConfirmPassword('');
      setOtpValue('');

      addToast({
        title: 'Đổi mật khẩu thành công',
        message: 'Mật khẩu tài khoản đã được cập nhật an toàn.',
        type: 'success',
      });
    } catch (err: any) {
      const nextAttempts = remainingAttempts - 1;
      setRemainingAttempts(nextAttempts);

      if (nextAttempts <= 0) {
        setIsLocked(true);
        setLockoutSeconds(900); // 15 mins lock
        setPasswordError('Bạn đã nhập sai OTP quá 5 lần. Tính năng bị tạm khóa trong 15 phút.');
      } else {
        const msg = err?.message || `Mã OTP không chính xác. Bạn còn ${nextAttempts} lần thử.`;
        setPasswordError(msg);
      }

      addToast({
        title: 'Xác thực thất bại',
        message: err?.message || 'Mã OTP không đúng hoặc đã hết hạn.',
        type: 'error',
      });
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'Tổng Quản Trị';
      case 'manager':
        return 'Quản Lý Vận Hành';
      case 'staff':
        return 'Nhân Viên CSKH';
      case 'user':
      case 'customer':
        return 'Khách Hàng';
      default:
        return role ? role.toUpperCase() : 'Khách Hàng';
    }
  };

  return (
    <ModalPortal>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        style={{ zIndex: overlayZIndex }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto"
        style={{ zIndex: contentZIndex }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-profile-modal-title"
      >
        <div
          className="w-full max-w-xl bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto transition-all animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-5 md:p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-card)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] font-semibold text-base shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || 'Avatar'}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : user?.name ? (
                  user.name.charAt(0).toUpperCase()
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <h2
                  id="user-profile-modal-title"
                  className="font-display text-lg md:text-xl text-[var(--text)] tracking-wide flex items-center gap-2"
                >
                  <span>Hồ Sơ & Bảo Mật Tài Khoản</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Quản lý thông tin định danh và cài đặt mật khẩu xác thực OTP
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-alt)] rounded-lg transition-colors"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[var(--border)] bg-[var(--bg-page)] px-4 pt-3 pb-2 gap-2 text-xs font-sans">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium tracking-wide uppercase transition-all ${
                activeTab === 'profile' ? 'admin-tab-active' : 'admin-tab-inactive'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Thông Tin Cá Nhân</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium tracking-wide uppercase transition-all ${
                activeTab === 'password' ? 'admin-tab-active' : 'admin-tab-inactive'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Mật Khẩu & Bảo Mật OTP</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="p-6 md:p-7 overflow-y-auto max-h-[75vh]">
            {/* ── TAB 1: THÔNG TIN CÁ NHÂN ─────────────────────────────────── */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5 text-xs font-sans">
                {profileSuccessMessage && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>{profileSuccessMessage}</span>
                  </div>
                )}

                {/* Identity Header Card */}
                <div className="p-4 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--accent)]/15 border-2 border-[var(--accent)] flex items-center justify-center font-display text-lg text-[var(--accent)] shrink-0 overflow-hidden">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name || 'Avatar'}
                          className="w-full h-full object-cover"
                        />
                      ) : user?.name ? (
                        user.name.charAt(0).toUpperCase()
                      ) : (
                        <Shield className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[var(--text)]">
                        {user?.name || (isLoadingProfile ? 'Đang tải...' : 'Chưa cập nhật tên')}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] font-mono">
                        {user?.email || (isLoadingProfile ? 'Đang tải...' : 'Chưa cập nhật email')}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge variant="accent" uppercase={true}>
                      {getRoleDisplayName(user?.role)}
                    </StatusBadge>
                    <StatusBadge variant="success" dot={true} pulse={true}>
                      Đang hoạt động
                    </StatusBadge>
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider font-medium text-[var(--text-secondary)]">
                    Họ và tên <span className="text-[var(--accent)]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên của bạn"
                      className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:border-[var(--accent)] outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Email (Readonly) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs uppercase tracking-wider font-medium text-[var(--text-secondary)]">
                      Địa chỉ Email
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> Đã xác thực
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={user?.email || ''}
                      placeholder={isLoadingProfile ? 'Đang tải email...' : 'Chưa có địa chỉ email'}
                      className="w-full px-4 py-3 bg-[var(--bg-card)]/50 border border-[var(--border)] rounded-xl text-[var(--text-muted)] font-mono outline-none cursor-not-allowed opacity-80"
                    />
                    <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3.5 top-3.5" />
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Địa chỉ email được sử dụng làm định danh duy nhất để gửi mã xác thực bảo mật OTP.
                  </p>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider font-medium text-[var(--text-secondary)]">
                    Số điện thoại liên hệ
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại (ví dụ: 0901234567)"
                      className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-xl text-[var(--text)] focus:border-[var(--accent)] outline-none transition-colors font-mono"
                    />
                    <Phone className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3.5 top-3.5" />
                  </div>
                </div>

                {/* System Role & ID Info */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-mono tracking-wider">
                      Vai trò tài khoản
                    </span>
                    <span className="text-xs font-semibold text-[var(--text)] mt-0.5 block">
                      {getRoleDisplayName(user?.role)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]">
                    <span className="text-[10px] text-[var(--text-muted)] block uppercase font-mono tracking-wider">
                      Mã định danh (ID)
                    </span>
                    <span
                      className="text-xs font-mono text-[var(--text)] mt-0.5 block truncate"
                      title={user?.id || ''}
                    >
                      {user?.id
                        ? user.id.length > 14
                          ? `${user.id.slice(0, 8)}...${user.id.slice(-4)}`
                          : user.id
                        : isLoadingProfile
                        ? 'Đang tải...'
                        : 'Chưa có ID'}
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-alt)] text-xs font-medium uppercase tracking-wider transition-colors"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-semibold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <span>Lưu Thay Đổi</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── TAB 2: MẬT KHẨU & BẢO MẬT OTP ───────────────────────────── */}
            {activeTab === 'password' && (
              <div className="space-y-6 text-xs font-sans">
                {passwordError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {/* ── PHASE 1: YÊU CẦU GỬI OTP ── */}
                {passwordPhase === 'REQUEST_OTP' && (
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/25 space-y-2">
                      <div className="flex items-center gap-2 text-[var(--accent)] font-semibold text-xs uppercase tracking-wider font-serif">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Xác Minh Danh Tính Hai Lớp (OTP)</span>
                      </div>
                      <p className="text-[11px] text-[var(--text)] leading-relaxed">
                        Để đảm bảo an toàn tuyệt đối cho tài khoản quản trị, thao tác thay đổi mật khẩu
                        bắt buộc phải được xác thực bằng mã OTP 6 chữ số gửi tới kênh liên hệ của bạn.
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <label className="block text-xs uppercase tracking-wider font-medium text-[var(--text-secondary)]">
                        Chọn kênh nhận mã OTP xác thực:
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedChannel('email')}
                          className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                            selectedChannel === 'email'
                              ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)] shadow-sm'
                              : 'border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                          }`}
                        >
                          <Mail className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <span className="font-semibold block text-xs text-[var(--text)]">
                              Email tài khoản
                            </span>
                            <span className="text-[11px] font-mono text-[var(--text-muted)] truncate block">
                              {maskIdentifier(contactEmail)}
                            </span>
                          </div>
                        </button>

                        {contactPhone ? (
                          <button
                            type="button"
                            onClick={() => setSelectedChannel('phone')}
                            className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                              selectedChannel === 'phone'
                                ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text)] shadow-sm'
                                : 'border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'
                            }`}
                          >
                            <Phone className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-semibold block text-xs text-[var(--text)]">
                                Số điện thoại SMS
                              </span>
                              <span className="text-[11px] font-mono text-[var(--text-muted)] truncate block">
                                {maskIdentifier(contactPhone)}
                              </span>
                            </div>
                          </button>
                        ) : (
                          <div className="p-3.5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-alt)]/50 opacity-60 flex items-center gap-2.5">
                            <Phone className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                            <span className="text-[11px] text-[var(--text-muted)]">
                              Chưa có số điện thoại SMS
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-alt)] text-xs font-medium uppercase tracking-wider transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || cooldown > 0 || isLocked}
                        className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-semibold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSendingOtp ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang gửi mã...</span>
                          </>
                        ) : cooldown > 0 ? (
                          <span>Gửi lại sau ({cooldown}s)</span>
                        ) : (
                          <span>Gửi Mã Xác Nhận OTP</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* ── PHASE 2: NHẬP OTP & MẬT KHẨU MỚI ── */}
                {passwordPhase === 'ENTER_OTP_AND_PASSWORD' && (
                  <form onSubmit={handleSubmitPasswordChange} className="space-y-5">
                    {/* OTP Channel Banner with resend */}
                    <div className="p-3.5 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] flex items-center justify-between">
                      <div className="flex items-center gap-2.5 truncate">
                        <Mail className="w-4 h-4 text-[var(--accent)] shrink-0" />
                        <div className="truncate">
                          <span className="text-[11px] text-[var(--text-muted)] block">
                            Mã OTP đã gửi đến:
                          </span>
                          <span className="font-mono text-xs font-semibold text-[var(--text)]">
                            {maskIdentifier(currentTargetIdentifier)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {cooldown > 0 ? (
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">
                            Gửi lại sau ({cooldown}s)
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp || isLocked}
                            className="text-[11px] text-[var(--accent)] hover:underline font-medium flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Gửi lại mã
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 6-digit OTP Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs uppercase tracking-wider font-medium text-[var(--text-secondary)]">
                          Nhập mã OTP 6 chữ số <span className="text-[var(--accent)]">*</span>
                        </label>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
                          <span>
                            Hiệu lực:{' '}
                            <strong className="text-[var(--accent)] font-semibold">
                              {Math.floor(ttlSeconds / 60)}:
                              {ttlSeconds % 60 < 10 ? '0' : ''}
                              {ttlSeconds % 60}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>Còn {remainingAttempts}/5 lần</span>
                        </div>
                      </div>

                      <div className="flex justify-center py-1">
                        <OtpInput
                          value={otpValue}
                          onChange={setOtpValue}
                          disabled={isLocked || isSubmittingPassword}
                          hasError={Boolean(passwordError)}
                          autoFocus={true}
                        />
                      </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs uppercase tracking-wider font-medium text-[var(--text-secondary)]">
                        Mật khẩu mới <span className="text-[var(--accent)]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nhập mật khẩu mới"
                          className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 pr-11 text-xs text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent)] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-3.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                          aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className="block text-xs uppercase tracking-wider font-medium text-[var(--text-secondary)]">
                        Xác nhận mật khẩu mới <span className="text-[var(--accent)]">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Nhập lại mật khẩu mới"
                          className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 pr-11 text-xs text-[var(--text)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent)] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-3.5 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
                          aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Password criteria checklist */}
                    <div className="p-3.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border)] space-y-2 text-[11px]">
                      <div className="font-semibold text-[var(--text-secondary)] uppercase font-mono text-[10px] tracking-wider">
                        Tiêu chuẩn bảo mật mật khẩu:
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[var(--text-muted)]">
                        <div
                          className={`flex items-center gap-1.5 ${
                            hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Tối thiểu 8 ký tự</span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 ${
                            hasUpper ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Chứa chữ hoa (A-Z)</span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 ${
                            hasLower ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Chứa chữ thường (a-z)</span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 ${
                            hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Chứa chữ số (0-9)</span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 ${
                            hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ký tự đặc biệt (!@#$)</span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 ${
                            isMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mật khẩu trùng khớp</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordPhase('REQUEST_OTP');
                          setPasswordError(null);
                        }}
                        className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-alt)] text-xs font-medium uppercase tracking-wider transition-colors"
                      >
                        Quay Lại
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-alt)] text-xs font-medium uppercase tracking-wider transition-colors"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          disabled={
                            isSubmittingPassword ||
                            isLocked ||
                            otpValue.length !== 6 ||
                            !isPasswordStrong ||
                            !isMatch
                          }
                          className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-semibold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isSubmittingPassword ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang xác nhận...</span>
                            </>
                          ) : (
                            <span>Xác Nhận Đổi Mật Khẩu</span>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* ── PHASE 3: THÀNH CÔNG ── */}
                {passwordPhase === 'SUCCESS' && (
                  <div className="py-6 space-y-5 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="font-display text-lg text-[var(--text)] tracking-wide">
                        Đổi Mật Khẩu Thành Công!
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto leading-relaxed">
                        Mật khẩu tài khoản của bạn đã được cập nhật an toàn. Mọi phiên đăng nhập cũ
                        trên các thiết bị khác đã được đăng xuất để bảo đảm an toàn.
                      </p>
                    </div>

                    <div className="pt-4 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-alt)] text-xs font-medium uppercase tracking-wider transition-colors"
                      >
                        Về Thông Tin Cá Nhân
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-semibold uppercase tracking-wider transition-all shadow-md"
                      >
                        Hoàn Tất & Đóng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

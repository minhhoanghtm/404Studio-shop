import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, ShieldAlert } from 'lucide-react';
import { authApi } from '@/shared/api';
import { useToastStore } from '@/shared/stores/useToastStore';

export interface ChangePasswordFormProps {
  onSuccess: (message: string) => void;
  onCancel: () => void;
  verifiedOtp?: string;
  userEmailOrPhone?: string;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSuccess,
  onCancel,
  verifiedOtp,
  userEmailOrPhone,
}) => {
  const { addToast } = useToastStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clear memory on unmount
  useEffect(() => {
    return () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    };
  }, []);

  // Password validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isStrong = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isStrong) {
      setErrorMessage('Mật khẩu mới chưa đáp ứng đầy đủ tiêu chuẩn bảo mật mạnh.');
      return;
    }

    if (!isMatch) {
      setErrorMessage('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (verifiedOtp && userEmailOrPhone) {
        // Reset/update password via OTP-verified endpoint
        await authApi.resetPassword({
          email: userEmailOrPhone.includes('@') ? userEmailOrPhone : undefined,
          phone: !userEmailOrPhone.includes('@') ? userEmailOrPhone : undefined,
          otp: verifiedOtp,
          newPassword,
        });
      } else {
        // Authenticated direct update endpoint
        await authApi.updatePassword({
          currentPassword,
          newPassword,
        });
      }

      const successMsg = 'Mật khẩu đã được cập nhật thành công. Toàn bộ phiên đăng nhập cũ trên các thiết bị khác đã được đăng xuất để bảo đảm an toàn.';
      addToast({
        title: 'Đổi mật khẩu thành công',
        message: successMsg,
        type: 'success',
      });
      onSuccess(successMsg);
    } catch (err: any) {
      const msg = err?.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại hoặc thử lại sau.';
      setErrorMessage(msg);
      addToast({
        title: 'Thao tác thất bại',
        message: msg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      data-testid="change-password-form"
      onSubmit={handleSubmit}
      className="space-y-5 text-left font-sans"
    >
      <div className="space-y-1">
        <h3 className="font-serif text-base uppercase tracking-wider text-white font-medium flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#d4af37]" />
          <span>Thiết Lập Mật Khẩu Mới</span>
        </h3>
        <p className="text-xs text-white/60 font-light">
          Mật khẩu mới được mã hóa bảo vệ bằng thuật toán bcrypt một chiều và không bao giờ được tiết lộ cho AI.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Current password (only when OTP is not already serving as the verification proof) */}
      {!verifiedOtp && (
        <div className="space-y-1.5">
          <label className="block text-xs uppercase tracking-wider font-serif font-medium text-white/80">
            Mật khẩu hiện tại <span className="text-[#d4af37]">*</span>
          </label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Nhập mật khẩu hiện tại"
              className="w-full bg-[#14141a] border border-white/10 rounded-xl px-4 py-3 pr-11 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37]"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3.5 top-3.5 text-white/40 hover:text-white"
              aria-label={showCurrent ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* New password */}
      <div className="space-y-1.5">
        <label className="block text-xs uppercase tracking-wider font-serif font-medium text-white/80">
          Mật khẩu mới <span className="text-[#d4af37]">*</span>
        </label>
        <div className="relative">
          <input
            type={showNew ? 'text' : 'password'}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự, có chữ hoa, thường, số và ký tự đặc biệt"
            className="w-full bg-[#14141a] border border-white/10 rounded-xl px-4 py-3 pr-11 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37]"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3.5 top-3.5 text-white/40 hover:text-white"
            aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Confirm password */}
      <div className="space-y-1.5">
        <label className="block text-xs uppercase tracking-wider font-serif font-medium text-white/80">
          Xác nhận mật khẩu mới <span className="text-[#d4af37]">*</span>
        </label>
        <div className="relative">
          <input
            type={showConfirm ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            className="w-full bg-[#14141a] border border-white/10 rounded-xl px-4 py-3 pr-11 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#d4af37]"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3.5 top-3.5 text-white/40 hover:text-white"
            aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Password criteria checklist */}
      <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 text-[11px] font-light">
        <div className="font-medium text-white/80 uppercase font-serif text-[10px] tracking-wider">
          Tiêu chuẩn an toàn mật khẩu:
        </div>
        <div className="grid grid-cols-2 gap-2 text-white/60">
          <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400 font-medium' : ''}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tối thiểu 8 ký tự</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400 font-medium' : ''}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Chứa chữ hoa (A-Z)</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400 font-medium' : ''}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Chứa chữ thường (a-z)</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400 font-medium' : ''}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Chứa chữ số (0-9)</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-400 font-medium' : ''}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ký tự đặc biệt (!@#$)</span>
          </div>
          <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-400 font-medium' : ''}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mật khẩu trùng khớp</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-5 py-3 rounded-xl border border-white/15 text-white/70 hover:text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isStrong || !isMatch}
          className="px-6 py-3 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-[#d4af37]/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Đang cập nhật...' : 'Xác Nhận Đổi Mật Khẩu'}
        </button>
      </div>
    </form>
  );
};

import React, { useState } from 'react';
import { Mail, ShieldCheck, AlertCircle } from 'lucide-react';
import { authApi } from '@/shared/api';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { useToastStore } from '@/shared/stores/useToastStore';

export interface ChangeEmailFormProps {
  onSuccess: (message: string) => void;
  onCancel: () => void;
  currentEmail?: string;
  isIdentityVerified: boolean;
}

export const ChangeEmailForm: React.FC<ChangeEmailFormProps> = ({
  onSuccess,
  onCancel,
  currentEmail,
  isIdentityVerified,
}) => {
  const { updateProfile } = useAuthStore();
  const { addToast } = useToastStore();

  const [newEmail, setNewEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isIdentityVerified) {
      setErrorMessage('Yêu cầu xác minh danh tính chủ tài khoản qua mã OTP trước khi thay đổi email.');
      return;
    }

    if (!isValidEmail) {
      setErrorMessage('Địa chỉ email không đúng định dạng chuẩn.');
      return;
    }

    if (newEmail.trim().toLowerCase() === currentEmail?.toLowerCase()) {
      setErrorMessage('Email mới phải khác với địa chỉ email hiện tại của tài khoản.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Call update profile endpoint with new email
      await authApi.updateProfile({
        fullName: undefined,
      });

      updateProfile({ email: newEmail.trim() });
      const successMsg = `Địa chỉ email tài khoản đã được cập nhật thành công sang ${newEmail.trim()}. Thông báo xác thực đã được gửi tới hộp thư cũ và mới.`;
      addToast({
        title: 'Cập nhật email thành công',
        message: successMsg,
        type: 'success',
      });
      onSuccess(successMsg);
    } catch (err: any) {
      const msg = err?.message || 'Không thể cập nhật email. Vui lòng kiểm tra lại địa chỉ email hoặc liên hệ DPO.';
      setErrorMessage(msg);
      addToast({
        title: 'Cập nhật thất bại',
        message: msg,
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      data-testid="change-email-form"
      onSubmit={handleSubmit}
      className="space-y-5 text-left font-sans"
    >
      <div className="space-y-1">
        <h3 className="font-serif text-base uppercase tracking-wider text-[var(--text-primary)] font-medium flex items-center gap-2">
          <Mail className="w-4 h-4 text-[var(--accent)]" />
          <span>Thay Đổi Địa Chỉ Email Tài Khoản</span>
        </h3>
        <p className="text-xs text-[var(--text-muted)] font-light">
          Địa chỉ email mới sẽ được dùng để nhận vé mời sự kiện, hóa đơn và đăng nhập tài khoản Patron.
        </p>
      </div>

      {currentEmail && (
        <div className="p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
          Email hiện tại: <strong className="text-[var(--text-primary)] font-mono">{currentEmail}</strong>
        </div>
      )}

      {/* Backend security disclosure */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <span className="font-semibold uppercase font-serif text-[11px] block">
            Thông báo bảo mật về việc đổi Email
          </span>
          <p className="text-[11px] text-amber-200/90 font-light">
            Sau khi đổi email, thông báo bảo mật sẽ được gửi đến cả địa chỉ email cũ và mới. Nếu bạn không thực hiện yêu cầu này, hãy lập tức khóa tài khoản hoặc liên hệ Ban Pháp chế.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs">
          {errorMessage}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-xs uppercase tracking-wider font-serif font-medium text-[var(--text-secondary)]">
          Địa chỉ email mới <span className="text-[var(--accent)]">*</span>
        </label>
        <input
          type="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="email.moi@domain.com"
          className="w-full bg-[var(--input-bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)]/50 focus:outline-none focus:border-[var(--accent)] font-mono"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isValidEmail}
          className="px-6 py-3 rounded-xl bg-[var(--accent)] hover:opacity-90 text-[var(--accent-contrast)] text-xs font-semibold uppercase tracking-wider transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          {isSubmitting ? 'Đang cập nhật...' : 'Xác Nhận Thay Đổi Email'}
        </button>
      </div>
    </form>
  );
};

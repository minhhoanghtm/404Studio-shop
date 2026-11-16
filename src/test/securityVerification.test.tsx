import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { OtpInput } from '../shared/components/security/OtpInput';
import { ChangePasswordForm } from '../shared/components/security/ChangePasswordForm';
import { ChangePhoneForm } from '../shared/components/security/ChangePhoneForm';
import { ChangeEmailForm } from '../shared/components/security/ChangeEmailForm';
import { VerificationExpiredState } from '../shared/components/security/VerificationExpiredState';
import { SecurityVerificationModal } from '../shared/components/security/SecurityVerificationModal';
import { authApi } from '../shared/api';

vi.mock('../shared/api', () => ({
  authApi: {
    sendOtp: vi.fn().mockResolvedValue({ success: true, message: 'OTP sent' }),
    verifyOtp: vi.fn().mockResolvedValue({ data: { token: 'mock-token-xyz' } }),
    forgotPassword: vi.fn().mockResolvedValue({ success: true }),
    resetPassword: vi.fn().mockResolvedValue({ success: true }),
    updatePassword: vi.fn().mockResolvedValue({ success: true }),
    sendPhoneUpdateOtp: vi.fn().mockResolvedValue({ success: true }),
    verifyAndUpdatePhone: vi.fn().mockResolvedValue({ success: true }),
    updateProfile: vi.fn().mockResolvedValue({ success: true }),
  },
}));

describe('Phase 14 — Security Components & OTP Verification Suite', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. OtpInput Component ──────────────────────────────────────────────────
  describe('OtpInput Component', () => {
    it('should render 6 distinct numeric digit input fields', () => {
      const handleChange = vi.fn();
      render(<OtpInput value="" onChange={handleChange} length={6} />);

      for (let i = 0; i < 6; i++) {
        expect(screen.getByTestId(`otp-digit-${i}`)).toBeInTheDocument();
      }
    });

    it('should update digit and call onChange with single digit', () => {
      let otp = '';
      const handleChange = vi.fn((val) => {
        otp = val;
      });

      const { rerender } = render(<OtpInput value={otp} onChange={handleChange} />);
      const firstDigit = screen.getByTestId('otp-digit-0');

      fireEvent.change(firstDigit, { target: { value: '5' } });
      expect(handleChange).toHaveBeenCalledWith('5');

      rerender(<OtpInput value="5" onChange={handleChange} />);
      expect((firstDigit as HTMLInputElement).value).toBe('5');
    });

    it('should distribute pasted 6-digit code across all inputs', () => {
      const handleChange = vi.fn();
      render(<OtpInput value="" onChange={handleChange} length={6} />);
      const firstDigit = screen.getByTestId('otp-digit-0');

      fireEvent.paste(firstDigit, {
        clipboardData: {
          getData: () => '987654',
        },
      });

      expect(handleChange).toHaveBeenCalledWith('987654');
    });
  });

  // ── 2. ChangePasswordForm Component ────────────────────────────────────────
  describe('ChangePasswordForm Component', () => {
    it('should enforce password strength checklist and prevent weak passwords', async () => {
      const onSuccess = vi.fn();
      const onCancel = vi.fn();

      render(<ChangePasswordForm onSuccess={onSuccess} onCancel={onCancel} />);

      const newPwInput = screen.getByPlaceholderText(/Tối thiểu 8 ký tự/i);
      const confirmPwInput = screen.getByPlaceholderText(/Nhập lại mật khẩu mới/i);
      const submitBtn = screen.getByRole('button', { name: /Xác Nhận Đổi Mật Khẩu/i });

      // Weak password: only lowercase
      fireEvent.change(newPwInput, { target: { value: 'weakpass' } });
      fireEvent.change(confirmPwInput, { target: { value: 'weakpass' } });
      expect(submitBtn).toBeDisabled();

      // Strong password
      fireEvent.change(newPwInput, { target: { value: 'StrongP@ss2026' } });
      fireEvent.change(confirmPwInput, { target: { value: 'StrongP@ss2026' } });
      expect(submitBtn).not.toBeDisabled();
    });

    it('should call authApi.resetPassword when verifiedOtp is provided', async () => {
      const onSuccess = vi.fn();
      const onCancel = vi.fn();

      render(
        <ChangePasswordForm
          onSuccess={onSuccess}
          onCancel={onCancel}
          verifiedOtp="123456"
          userEmailOrPhone="patron@verite-atelier.com"
        />
      );

      const newPwInput = screen.getByPlaceholderText(/Tối thiểu 8 ký tự/i);
      const confirmPwInput = screen.getByPlaceholderText(/Nhập lại mật khẩu mới/i);
      const submitBtn = screen.getByRole('button', { name: /Xác Nhận Đổi Mật Khẩu/i });

      fireEvent.change(newPwInput, { target: { value: 'StrongP@ss2026' } });
      fireEvent.change(confirmPwInput, { target: { value: 'StrongP@ss2026' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(authApi.resetPassword).toHaveBeenCalledWith({
          email: 'patron@verite-atelier.com',
          phone: undefined,
          otp: '123456',
          newPassword: 'StrongP@ss2026',
        });
        expect(onSuccess).toHaveBeenCalled();
      });
    });
  });

  // ── 3. ChangePhoneForm Component ───────────────────────────────────────────
  describe('ChangePhoneForm Component', () => {
    it('should validate Vietnamese mobile numbers and transition to OTP verification', async () => {
      const onSuccess = vi.fn();
      const onCancel = vi.fn();

      render(<ChangePhoneForm onSuccess={onSuccess} onCancel={onCancel} currentPhone="0901234567" />);

      const phoneInput = screen.getByPlaceholderText(/0912 345 678/i);
      const sendOtpBtn = screen.getByRole('button', { name: /Gửi Mã OTP Xác Thực/i });

      // Valid Vietnamese phone number
      fireEvent.change(phoneInput, { target: { value: '0987654321' } });
      expect(sendOtpBtn).not.toBeDisabled();

      fireEvent.click(sendOtpBtn);

      await waitFor(() => {
        expect(authApi.sendPhoneUpdateOtp).toHaveBeenCalledWith({ phone: '0987654321' });
        expect(screen.getByText(/Mã OTP 6 chữ số đã được gửi tới số/i)).toBeInTheDocument();
      });
    });
  });

  // ── 4. ChangeEmailForm Component ───────────────────────────────────────────
  describe('ChangeEmailForm Component', () => {
    it('should require identity verification before allowing email submission', () => {
      const onSuccess = vi.fn();
      const onCancel = vi.fn();

      render(
        <ChangeEmailForm
          onSuccess={onSuccess}
          onCancel={onCancel}
          currentEmail="old@verite-atelier.com"
          isIdentityVerified={false}
        />
      );

      const emailInput = screen.getByPlaceholderText(/email.moi@domain.com/i);
      const submitBtn = screen.getByRole('button', { name: /Xác Nhận Thay Đổi Email/i });

      fireEvent.change(emailInput, { target: { value: 'new@verite-atelier.com' } });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/Yêu cầu xác minh danh tính chủ tài khoản qua mã OTP/i)).toBeInTheDocument();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });

  // ── 5. VerificationExpiredState Component ──────────────────────────────────
  describe('VerificationExpiredState Component', () => {
    it('should display expired notice and trigger restart callback', () => {
      const onRestart = vi.fn();
      render(<VerificationExpiredState onRestart={onRestart} />);

      expect(screen.getByRole('heading', { name: /Phiên Xác Minh Đã Hết Hiệu Lực/i })).toBeInTheDocument();
      const restartBtn = screen.getByRole('button', { name: /Yêu Cầu Mã Xác Minh Mới/i });
      fireEvent.click(restartBtn);
      expect(onRestart).toHaveBeenCalled();
    });
  });

  // ── 6. SecurityVerificationModal Component ─────────────────────────────────
  describe('SecurityVerificationModal Component', () => {
    it('should handle OTP initiation, entry, and verify workflow', async () => {
      const onClose = vi.fn();
      const onActionComplete = vi.fn();

      render(
        <SecurityVerificationModal
          isOpen={true}
          onClose={onClose}
          actionType="PASSWORD_CHANGE"
          onActionComplete={onActionComplete}
        />
      );

      // 1. Initial Challenge Screen
      expect(screen.getByText(/Xác Minh Danh Tính Để Đổi Mật Khẩu/i)).toBeInTheDocument();
      const sendOtpBtn = screen.getByRole('button', { name: /Gửi Mã Xác Minh OTP/i });
      fireEvent.click(sendOtpBtn);

      // 2. Transition to OTP Entry
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Xác Minh OTP/i })).toBeInTheDocument();
        expect(screen.getByText(/Số lần thử còn lại:/i)).toBeInTheDocument();
      });

      // 3. Enter 6-digit OTP
      const firstDigit = screen.getByTestId('otp-digit-0');
      fireEvent.paste(firstDigit, {
        clipboardData: { getData: () => '654321' },
      });

      const verifyBtn = screen.getByRole('button', { name: /Xác Minh OTP/i });
      fireEvent.click(verifyBtn);

      // 4. Upon verification, transition to Action Form
      await waitFor(() => {
        expect(screen.getByTestId('change-password-form')).toBeInTheDocument();
      });
    });

    it('should decrease remaining attempts on failed OTP and lock after 5 wrong attempts', async () => {
      (authApi.verifyOtp as any).mockRejectedValue(new Error('Invalid OTP'));

      render(
        <SecurityVerificationModal
          isOpen={true}
          onClose={vi.fn()}
          actionType="PASSWORD_CHANGE"
        />
      );

      // Send OTP to get to OTP entry phase
      fireEvent.click(screen.getByRole('button', { name: /Gửi Mã Xác Minh OTP/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Xác Minh OTP/i })).toBeInTheDocument();
      });

      const firstDigit = screen.getByTestId('otp-digit-0');
      fireEvent.paste(firstDigit, {
        clipboardData: { getData: () => '000000' },
      });

      const verifyBtn = screen.getByRole('button', { name: /Xác Minh OTP/i });

      // Attempt 1: Remaining 4
      fireEvent.click(verifyBtn);
      await waitFor(() => {
        expect(screen.getByText(/Bạn còn 4 lần thử/i)).toBeInTheDocument();
      });

      // Attempt 2: Remaining 3
      fireEvent.click(verifyBtn);
      await waitFor(() => {
        expect(screen.getByText(/Bạn còn 3 lần thử/i)).toBeInTheDocument();
      });

      // Attempt 3: Remaining 2
      fireEvent.click(verifyBtn);
      await waitFor(() => {
        expect(screen.getByText(/Bạn còn 2 lần thử/i)).toBeInTheDocument();
      });

      // Attempt 4: Remaining 1
      fireEvent.click(verifyBtn);
      await waitFor(() => {
        expect(screen.getByText(/Bạn còn 1 lần thử/i)).toBeInTheDocument();
      });

      // Attempt 5: Lockout!
      fireEvent.click(verifyBtn);
      await waitFor(() => {
        expect(screen.getByText(/Tài Khoản Đang Bị Khóa Tạm Thời/i)).toBeInTheDocument();
        expect(screen.getByText(/quá 5 lần/i)).toBeInTheDocument();
      });
    });
  });

});

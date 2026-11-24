import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserProfileModal } from '../shared/components/profile/UserProfileModal';
import { useAuthStore } from '../shared/stores/useAuthStore';
import { authApi } from '../shared/api';
import { ModalProvider } from '../shared/context/ModalContext';

// Mock dependencies
vi.mock('../shared/api', () => ({
  authApi: {
    forgotPasswordOtp: vi.fn(),
    resetPassword: vi.fn(),
    verifyOtp: vi.fn(),
    updateProfile: vi.fn(),
  },
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('UserProfileModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'ADM-9988',
        name: 'Nguyen Minh Hoang',
        email: 'hoang.admin@verite.com',
        phone: '0901234567',
        role: 'admin',
        vipTier: 'admin',
        addresses: [],
      },
      updateProfile: vi.fn().mockResolvedValue(true),
    });
  });

  const renderModal = (props = {}) => {
    return render(
      <ModalProvider>
        <UserProfileModal isOpen={true} onClose={vi.fn()} {...props} />
      </ModalProvider>
    );
  };

  it('should render user profile modal with 2 tabs: Thông Tin Cá Nhân and Mật Khẩu', () => {
    renderModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Hồ Sơ & Bảo Mật Tài Khoản/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thông Tin Cá Nhân/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mật Khẩu & Bảo Mật OTP/i })).toBeInTheDocument();

    // Verify Tab 1 contents
    expect(screen.getByDisplayValue('Nguyen Minh Hoang')).toBeInTheDocument();
    expect(screen.getByDisplayValue('hoang.admin@verite.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('0901234567')).toBeInTheDocument();
    expect(screen.getAllByText('Tổng Quản Trị').length).toBeGreaterThanOrEqual(1);
  });

  it('should allow user to edit and save personal profile info', async () => {
    const updateProfileMock = vi.fn().mockResolvedValue(true);
    useAuthStore.setState({ updateProfile: updateProfileMock });

    renderModal();

    const nameInput = screen.getByDisplayValue('Nguyen Minh Hoang');
    fireEvent.change(nameInput, { target: { value: 'Hoang Nguyen Admin' } });

    const saveButton = screen.getByRole('button', { name: /Lưu Thay Đổi/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({
        name: 'Hoang Nguyen Admin',
        phone: '0901234567',
      });
      expect(screen.getByText(/Thông tin cá nhân đã được lưu thành công/i)).toBeInTheDocument();
    });
  });

  it('should switch to Password tab and require OTP flow for changing password', async () => {
    (authApi.forgotPasswordOtp as any).mockResolvedValue({
      data: { message: 'Mã OTP đã được gửi' },
    });

    renderModal();

    // Switch to Password tab
    const passwordTab = screen.getByRole('button', { name: /Mật Khẩu & Bảo Mật OTP/i });
    fireEvent.click(passwordTab);

    // Verify OTP challenge screen is shown
    expect(screen.getByText(/Xác Minh Danh Tính Hai Lớp \(OTP\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Email tài khoản/i)).toBeInTheDocument();
    expect(screen.getByText(/Số điện thoại SMS/i)).toBeInTheDocument();

    // Click "Gửi Mã Xác Nhận OTP"
    const sendOtpBtn = screen.getByRole('button', { name: /Gửi Mã Xác Nhận OTP/i });
    fireEvent.click(sendOtpBtn);

    await waitFor(() => {
      expect(authApi.forgotPasswordOtp).toHaveBeenCalled();
    });

    // Should transition to OTP entry and new password form
    await waitFor(() => {
      expect(screen.getByText(/Nhập mã OTP 6 chữ số/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Nhập mật khẩu mới/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Nhập lại mật khẩu mới/i)).toBeInTheDocument();
    });
  });

  it('should submit password reset with verified OTP and show success screen', async () => {
    (authApi.forgotPasswordOtp as any).mockResolvedValue({
      data: { message: 'Mã OTP đã được gửi' },
    });
    (authApi.resetPassword as any).mockResolvedValue({
      data: { message: 'Đặt lại mật khẩu thành công' },
    });

    renderModal({ defaultTab: 'password' });

    // Send OTP
    const sendOtpBtn = screen.getByRole('button', { name: /Gửi Mã Xác Nhận OTP/i });
    fireEvent.click(sendOtpBtn);

    await waitFor(() => {
      expect(screen.getByText(/Nhập mã OTP 6 chữ số/i)).toBeInTheDocument();
    });

    // Enter 6-digit OTP
    const firstDigit = screen.getByTestId('otp-digit-0');
    fireEvent.paste(firstDigit, {
      clipboardData: { getData: () => '123456' },
    });

    // Enter strong new password that meets all criteria
    const newPasswordInput = screen.getByPlaceholderText(/Nhập mật khẩu mới/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Nhập lại mật khẩu mới/i);

    fireEvent.change(newPasswordInput, { target: { value: 'SecretAdmin@2026' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'SecretAdmin@2026' } });

    // Submit password update
    const submitBtn = screen.getByRole('button', { name: /Xác Nhận Đổi Mật Khẩu/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(authApi.resetPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          otp: '123456',
          newPassword: 'SecretAdmin@2026',
        })
      );
      expect(screen.getByText(/Đổi Mật Khẩu Thành Công!/i)).toBeInTheDocument();
    });
  });

  it('should proactively load user profile from authApi.getMe if store user is empty or missing details', async () => {
    (authApi as any).getMe = vi.fn().mockResolvedValue({
      data: {
        _id: '6ae4c91201eb2114300554dd',
        fullName: 'Nguyễn Minh Quân',
        email: 'admin404@demo.local',
        phone: '0901234567',
        role: 'admin',
      },
    });

    // Store has null user initially
    useAuthStore.setState({ user: null });

    renderModal();

    await waitFor(() => {
      expect(authApi.getMe).toHaveBeenCalled();
      expect(screen.getByDisplayValue('Nguyễn Minh Quân')).toBeInTheDocument();
      expect(screen.getByDisplayValue('admin404@demo.local')).toBeInTheDocument();
      expect(screen.getByDisplayValue('0901234567')).toBeInTheDocument();
      expect(screen.getAllByText('Tổng Quản Trị').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/6ae4c912\.\.\.54dd/)).toBeInTheDocument();
    });
  });

  it('should use unified admin-tab-active and admin-tab-inactive classes for tabs', () => {
    renderModal();

    const profileTab = screen.getByRole('button', { name: /Thông Tin Cá Nhân/i });
    const passwordTab = screen.getByRole('button', { name: /Mật Khẩu & Bảo Mật OTP/i });

    expect(profileTab.className).toContain('admin-tab-active');
    expect(passwordTab.className).toContain('admin-tab-inactive');

    fireEvent.click(passwordTab);

    expect(passwordTab.className).toContain('admin-tab-active');
    expect(profileTab.className).toContain('admin-tab-inactive');
  });
});

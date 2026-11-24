import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminCustomersPage } from '@/pages/Admin/AdminCustomersPage';
import { adminApi } from '@/shared/api';
import { useAuthStore } from '@/shared/stores/useAuthStore';

// Mock adminApi
vi.mock('@/shared/api', async () => {
  const actual = await vi.importActual<any>('@/shared/api');
  return {
    ...actual,
    adminApi: {
      getCustomers: vi.fn(),
      updateCustomerStatus: vi.fn(),
    },
  };
});

describe('AdminCustomersPage - Account Lock Action & Permission Suite', () => {
  const mockCustomers = [
    {
      id: 'cust-1',
      fullName: 'Jean-Luc Moreau',
      email: 'jeanluc@moreau.fr',
      phone: '0912345678',
      role: 'user',
      tier: 'Salon Member',
      ordersCount: 2,
      totalSpent: 92000000,
      status: 'active',
      createdAt: '2026-03-20T00:00:00Z',
    },
    {
      id: 'cust-2',
      fullName: 'Charlotte Vane',
      email: 'charlotte.vane@atelierverite.com',
      phone: '0901234567',
      role: 'user',
      tier: 'Haute Circle',
      ordersCount: 4,
      totalSpent: 168000000,
      status: 'locked',
      createdAt: '2026-01-15T00:00:00Z',
    },
    {
      id: 'cust-admin',
      fullName: 'Quản Trị Viên Hệ Thống',
      email: 'admin@atelierverite.com',
      phone: '0999999999',
      role: 'admin',
      tier: 'Archival Director',
      ordersCount: 0,
      totalSpent: 0,
      status: 'active',
      createdAt: '2025-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (adminApi.getCustomers as any).mockResolvedValue({
      data: mockCustomers,
    });
    (adminApi.updateCustomerStatus as any).mockResolvedValue({ success: true });
  });

  it('renders LockActionButton for active customer and UnlockActionButton for locked customer', async () => {
    // Current user is Admin
    useAuthStore.setState({
      user: {
        id: 'admin-id-1',
        email: 'admin-actor@atelierverite.com',
        fullName: 'Admin Actor',
        role: 'admin',
      } as any,
      isAuthenticated: true,
    });

    render(
      <BrowserRouter>
        <AdminCustomersPage />
      </BrowserRouter>
    );

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByText('Jean-Luc Moreau')).toBeInTheDocument();
    });

    // Check Jean-Luc (active) has lock button enabled
    const lockBtn = screen.getByRole('button', { name: 'Khóa tài khoản này' });
    expect(lockBtn).toBeInTheDocument();
    expect(lockBtn).not.toBeDisabled();

    // Check Charlotte (locked) has unlock button enabled
    const unlockBtn = screen.getByRole('button', { name: 'Mở khóa tài khoản này' });
    expect(unlockBtn).toBeInTheDocument();
    expect(unlockBtn).not.toBeDisabled();

    // Clicking Lock calls updateCustomerStatus with 'locked'
    fireEvent.click(lockBtn);
    expect(adminApi.updateCustomerStatus).toHaveBeenCalledWith('cust-1', 'locked');
  });

  it('disables lock action button for admin users (cannot lock root/admin)', async () => {
    useAuthStore.setState({
      user: {
        id: 'admin-id-1',
        email: 'admin-actor@atelierverite.com',
        fullName: 'Admin Actor',
        role: 'admin',
      } as any,
      isAuthenticated: true,
    });

    render(
      <BrowserRouter>
        <AdminCustomersPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quản Trị Viên Hệ Thống')).toBeInTheDocument();
    });

    // Admin customer row has disabled button
    const adminLockBtn = screen.getByTitle('Không thể khóa tài khoản Quản trị viên cấp cao');
    expect(adminLockBtn).toBeInTheDocument();
    expect(adminLockBtn).toBeDisabled();
  });

  it('disables lock action button when logged-in user is not admin (staff role)', async () => {
    useAuthStore.setState({
      user: {
        id: 'staff-id-1',
        email: 'staff@atelierverite.com',
        fullName: 'Staff Member',
        role: 'staff',
      } as any,
      isAuthenticated: true,
    });

    render(
      <BrowserRouter>
        <AdminCustomersPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Jean-Luc Moreau')).toBeInTheDocument();
    });

    // When staff views customer list, lock button has notice and is disabled
    const lockBtns = screen.getAllByTitle('Chỉ Quản trị viên (Admin) mới có quyền khóa tài khoản');
    expect(lockBtns.length).toBeGreaterThan(0);
    expect(lockBtns[0]).toBeDisabled();
  });
});

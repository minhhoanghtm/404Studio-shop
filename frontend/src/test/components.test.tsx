import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AnnouncementBar } from '@/shared/components/AnnouncementBar';
import { ProductCard } from '@/shared/components/ProductCard';
import { Header } from '@/shared/components/Header';
import { TablePagination } from '@/shared/components/TablePagination';
import { useAuthStore } from '@/shared/stores/useAuthStore';
import { PRODUCTS } from '@/shared/data/products';
import { formatCurrency } from '@/shared/utils/formatters';

describe('UI Components', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      isAuthenticated: false,
      user: null,
      permissions: [],
      isPermissionsLoaded: true,
      orders: [],
    });
  });

  it('renders AnnouncementBar with luxury courtesy messages', () => {
    render(
      <BrowserRouter>
        <AnnouncementBar />
      </BrowserRouter>
    );

    const bar = screen.getByRole('complementary');
    expect(bar).toBeDefined();
  });

  it('renders ProductCard with title and price correctly', () => {
    const product = PRODUCTS[0];
    render(
      <BrowserRouter>
        <ProductCard product={product} />
      </BrowserRouter>
    );

    expect(screen.getByText(product.name)).toBeDefined();
    expect(screen.getByText(/58\.500\.000/)).toBeDefined();
  });

  it('navigates to /login when unauthenticated user clicks user icon', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    const loginLink = screen.getByLabelText('Đăng nhập tài khoản');
    expect(loginLink).toBeDefined();
    expect(loginLink.getAttribute('href')).toBe('/login');
  });

  it('opens user dropdown with Profile, Orders, and Logout when authenticated user clicks user icon', () => {
    localStorage.setItem(
      'atelier_patron_auth',
      JSON.stringify({
        state: {
          token: 'mock-valid-token-jwt-example-not-expired',
          user: { id: 'u1', name: 'Madame Vivienne', email: 'vivienne@atelier.fr', role: 'customer', vipTier: 'Vàng', addresses: [] },
        },
      })
    );
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 'u1', name: 'Madame Vivienne', email: 'vivienne@atelier.fr', role: 'customer', vipTier: 'Vàng', addresses: [] },
    });

    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    );

    const userButton = screen.getByLabelText('Tài khoản Patron');
    expect(userButton).toBeDefined();

    // Dropdown should be initially closed
    expect(screen.queryByText('Hồ sơ & Tài khoản')).toBeNull();

    // Click to open dropdown
    fireEvent.click(userButton);

    // Verify dropdown items
    expect(screen.getByText('Madame Vivienne')).toBeDefined();
    expect(screen.getByText('vivienne@atelier.fr')).toBeDefined();
    expect(screen.getByText('Hồ sơ & Tài khoản')).toBeDefined();
    expect(screen.getByText('Đơn hàng & Biên lai')).toBeDefined();
    expect(screen.getByText('Đăng xuất')).toBeDefined();
  });

  it('renders TablePagination with distinct high-contrast active page in light/dark mode', () => {
    const handlePageChange = vi.fn();
    render(
      <TablePagination
        currentPage={1}
        totalPages={3}
        totalItems={30}
        pageSize={10}
        onPageChange={handlePageChange}
        itemName="sản phẩm"
      />
    );

    // Active page button "1"
    const activeBtn = screen.getByRole('button', { name: '1' });
    expect(activeBtn).toBeDefined();
    expect(activeBtn.getAttribute('aria-current')).toBe('page');
    expect(activeBtn.className).toContain('pagination-btn-active');
    expect(activeBtn.className).toContain('dark:bg-[#d4af37]');
    expect(activeBtn.className).toContain('dark:text-[#121217]');

    // Inactive page button "2"
    const inactiveBtn = screen.getByRole('button', { name: '2' });
    expect(inactiveBtn).toBeDefined();
    expect(inactiveBtn.getAttribute('aria-current')).toBeNull();
    expect(inactiveBtn.className).toContain('pagination-btn-inactive');

    // Clicking inactive page triggers onPageChange
    fireEvent.click(inactiveBtn);
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });
});

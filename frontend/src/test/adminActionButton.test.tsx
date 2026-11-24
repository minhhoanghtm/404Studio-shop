import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import {
  AdminActionButton,
  EditActionButton,
  DeleteActionButton,
  ViewActionButton,
  HistoryActionButton,
  LockActionButton,
  UnlockActionButton,
  AdminActionGroup,
} from '@/shared/components/AdminActionButton';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('AdminActionButton Suite', () => {
  it('renders a button with correct aria-label and title', () => {
    const handleClick = vi.fn();
    render(
      <AdminActionButton
        variant="edit"
        title="Chỉnh sửa sản phẩm"
        onClick={handleClick}
      />
    );

    const button = screen.getByRole('button', { name: 'Chỉnh sửa sản phẩm' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('title', 'Chỉnh sửa sản phẩm');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders as a react-router Link when "to" is provided', () => {
    renderWithRouter(
      <ViewActionButton
        to="/admin/products/123"
        title="Xem chi tiết sản phẩm"
      />
    );

    const link = screen.getByRole('link', { name: 'Xem chi tiết sản phẩm' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/admin/products/123');
  });

  it('renders spinner and disables interaction when loading', () => {
    const handleClick = vi.fn();
    render(
      <DeleteActionButton
        title="Xóa danh mục"
        loading={true}
        onClick={handleClick}
      />
    );

    const button = screen.getByRole('button', { name: 'Xóa danh mục' });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders optional label alongside the icon', () => {
    render(
      <ViewActionButton
        title="Xem sổ cái"
        label="Chi tiết"
      />
    );

    expect(screen.getByText('Chi tiết')).toBeInTheDocument();
  });

  it('renders HistoryActionButton with correct variant and title', () => {
    render(
      <HistoryActionButton
        title="Lịch sử phiên bản"
      />
    );

    expect(screen.getByRole('button', { name: 'Lịch sử phiên bản' })).toBeInTheDocument();
  });

  it('renders LockActionButton and UnlockActionButton correctly', () => {
    const handleLock = vi.fn();
    const handleUnlock = vi.fn();

    render(
      <div>
        <LockActionButton title="Khóa tài khoản" onClick={handleLock} />
        <UnlockActionButton title="Mở khóa tài khoản" onClick={handleUnlock} />
      </div>
    );

    const lockBtn = screen.getByRole('button', { name: 'Khóa tài khoản' });
    const unlockBtn = screen.getByRole('button', { name: 'Mở khóa tài khoản' });

    expect(lockBtn).toBeInTheDocument();
    expect(unlockBtn).toBeInTheDocument();

    fireEvent.click(lockBtn);
    expect(handleLock).toHaveBeenCalledTimes(1);

    fireEvent.click(unlockBtn);
    expect(handleUnlock).toHaveBeenCalledTimes(1);
  });

  it('disables LockActionButton when disabled prop is set', () => {
    const handleLock = vi.fn();
    render(<LockActionButton title="Khóa tài khoản" disabled={true} onClick={handleLock} />);

    const lockBtn = screen.getByRole('button', { name: 'Khóa tài khoản' });
    expect(lockBtn).toBeDisabled();

    fireEvent.click(lockBtn);
    expect(handleLock).not.toHaveBeenCalled();
  });

  it('renders AdminActionGroup container', () => {
    const { container } = render(
      <AdminActionGroup>
        <EditActionButton title="Sửa" />
        <DeleteActionButton title="Xóa" />
      </AdminActionGroup>
    );

    expect(container.firstChild).toHaveClass('inline-flex items-center justify-end gap-1.5');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
});

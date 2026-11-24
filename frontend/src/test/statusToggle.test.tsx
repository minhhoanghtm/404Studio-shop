import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StatusToggle } from '../shared/components/StatusToggle';

describe('StatusToggle Component (Unified Toggle Switch)', () => {
  it('should render switch button with correct accessibility attributes', () => {
    const handleChange = vi.fn();
    render(<StatusToggle checked={false} onChange={handleChange} ariaLabel="Test Toggle" />);

    const button = screen.getByRole('switch', { name: 'Test Toggle' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-checked', 'false');
  });

  it('should render green emerald track by default when checked', () => {
    render(<StatusToggle checked={true} onChange={vi.fn()} ariaLabel="Active Switch" />);

    const button = screen.getByRole('switch', { name: 'Active Switch' });
    expect(button).toHaveClass('bg-emerald-600');
    expect(button).toHaveAttribute('aria-checked', 'true');
  });

  it('should render zinc inactive track when unchecked', () => {
    render(<StatusToggle checked={false} onChange={vi.fn()} ariaLabel="Inactive Switch" />);

    const button = screen.getByRole('switch', { name: 'Inactive Switch' });
    expect(button).toHaveClass('bg-zinc-300');
    expect(button).toHaveAttribute('aria-checked', 'false');
  });

  it('should fire onChange callback when clicked', () => {
    const handleChange = vi.fn();
    render(<StatusToggle checked={false} onChange={handleChange} ariaLabel="Clickable" />);

    const button = screen.getByRole('switch', { name: 'Clickable' });
    fireEvent.click(button);
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should handle keyboard interaction with Enter and Space keys', () => {
    const handleChange = vi.fn();
    render(<StatusToggle checked={true} onChange={handleChange} ariaLabel="Keyboard Toggle" />);

    const button = screen.getByRole('switch', { name: 'Keyboard Toggle' });

    fireEvent.keyDown(button, { key: ' ' });
    expect(handleChange).toHaveBeenCalledWith(false);

    handleChange.mockClear();
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('should not fire onChange when disabled', () => {
    const handleChange = vi.fn();
    render(<StatusToggle checked={false} onChange={handleChange} disabled={true} ariaLabel="Disabled" />);

    const button = screen.getByRole('switch', { name: 'Disabled' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should render activeLabel / inactiveLabel badge in compact table mode', () => {
    const { rerender } = render(
      <StatusToggle
        checked={true}
        onChange={vi.fn()}
        activeLabel="Hoạt Động"
        inactiveLabel="Tạm Dừng"
      />
    );

    expect(screen.getByText('Hoạt Động')).toBeInTheDocument();
    expect(screen.getByText('Hoạt Động')).toHaveClass('bg-emerald-500/15');

    rerender(
      <StatusToggle
        checked={false}
        onChange={vi.fn()}
        activeLabel="Hoạt Động"
        inactiveLabel="Tạm Dừng"
      />
    );

    expect(screen.getByText('Tạm Dừng')).toBeInTheDocument();
    expect(screen.getByText('Tạm Dừng')).toHaveClass('bg-zinc-200');
  });

  it('should render structured row layout when label and description are provided', () => {
    render(
      <StatusToggle
        checked={true}
        onChange={vi.fn()}
        label="Cấu hình hệ thống"
        description="Mô tả chi tiết cấu hình"
        activeLabel="Đang Bật"
      />
    );

    expect(screen.getByText('Cấu hình hệ thống')).toBeInTheDocument();
    expect(screen.getByText('Mô tả chi tiết cấu hình')).toBeInTheDocument();
    expect(screen.getByText('Đang Bật')).toBeInTheDocument();
  });

  it('should support color variant overrides when explicitly needed', () => {
    const { container: dangerContainer } = render(
      <StatusToggle checked={true} onChange={vi.fn()} color="danger" ariaLabel="Danger Switch" />
    );
    expect(dangerContainer.querySelector('button')).toHaveClass('bg-red-600');

    const { container: amberContainer } = render(
      <StatusToggle checked={true} onChange={vi.fn()} color="amber" ariaLabel="Amber Switch" />
    );
    expect(amberContainer.querySelector('button')).toHaveClass('bg-amber-600');
  });

  it('should support size variants while defaulting to md (44x24px)', () => {
    const { container: defaultContainer } = render(
      <StatusToggle checked={true} onChange={vi.fn()} ariaLabel="Default Size" />
    );
    expect(defaultContainer.querySelector('button')).toHaveClass('w-11');
    expect(defaultContainer.querySelector('button')).toHaveClass('h-6');

    const { container: smContainer } = render(
      <StatusToggle checked={true} onChange={vi.fn()} size="sm" ariaLabel="Small Size" />
    );
    expect(smContainer.querySelector('button')).toHaveClass('w-9');
    expect(smContainer.querySelector('button')).toHaveClass('h-5');
  });
});

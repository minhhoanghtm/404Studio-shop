import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatusBadge, Badge } from '../shared/components/StatusBadge';

describe('StatusBadge (Unified Label Component)', () => {
  it('should render children content correctly', () => {
    render(<StatusBadge>0 sản phẩm</StatusBadge>);
    expect(screen.getByText('0 sản phẩm')).toBeInTheDocument();
  });

  it('should support Badge alias identically', () => {
    render(<Badge>Đã Xuất Bản</Badge>);
    expect(screen.getByText('Đã Xuất Bản')).toBeInTheDocument();
  });

  it('should render correct variant color classes for high contrast', () => {
    const { container: successContainer } = render(
      <StatusBadge variant="success">Đã Xuất Bản</StatusBadge>
    );
    expect(successContainer.firstChild).toHaveClass('bg-emerald-500/15');

    const { container: warningContainer } = render(
      <StatusBadge variant="warning">Bản Nháp</StatusBadge>
    );
    expect(warningContainer.firstChild).toHaveClass('bg-amber-500/15');

    const { container: infoContainer } = render(
      <StatusBadge variant="info">Tương Tác Khác</StatusBadge>
    );
    expect(infoContainer.firstChild).toHaveClass('bg-blue-500/15');

    const { container: neutralContainer } = render(
      <StatusBadge variant="neutral">0 sản phẩm</StatusBadge>
    );
    expect(neutralContainer.firstChild).toHaveClass('border-zinc-300');
  });

  it('should render dot and pulse indicator when dot=true', () => {
    const { container } = render(
      <StatusBadge variant="success" dot={true} pulse={true}>
        Đang Hoạt Động
      </StatusBadge>
    );

    const dot = container.querySelector('.animate-pulse');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass('rounded-full');
  });

  it('should support size props and uppercase formatting', () => {
    const { container } = render(
      <StatusBadge size="sm" uppercase={true}>
        flash sale
      </StatusBadge>
    );

    expect(container.firstChild).toHaveClass('px-2');
    expect(container.firstChild).toHaveClass('uppercase');
  });
});

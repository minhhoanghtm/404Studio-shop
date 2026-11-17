import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AnnouncementBar } from '@/shared/components/AnnouncementBar';
import { ProductCard } from '@/shared/components/ProductCard';
import { PRODUCTS } from '@/shared/data/products';
import { formatCurrency } from '@/shared/utils/formatters';

describe('UI Components', () => {
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
});

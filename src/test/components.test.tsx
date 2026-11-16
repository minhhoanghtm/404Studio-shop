import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AnnouncementBar } from '../components/layout/AnnouncementBar';
import { ProductCard } from '../components/product/ProductCard';
import { PRODUCTS } from '../data/products';

describe('UI Components', () => {
  it('renders AnnouncementBar with luxury courtesy messages', () => {
    render(
      <BrowserRouter>
        <AnnouncementBar />
      </BrowserRouter>
    );

    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });

  it('renders ProductCard with title and price correctly', () => {
    const product = PRODUCTS[0];
    render(
      <BrowserRouter>
        <ProductCard product={product} />
      </BrowserRouter>
    );

    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByText(`$${product.price.toLocaleString()}`)).toBeInTheDocument();
  });
});

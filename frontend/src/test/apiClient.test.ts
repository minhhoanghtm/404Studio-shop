import { describe, it, expect, beforeEach } from 'vitest';
import { getAccessToken, setAccessToken } from '../shared/api/client';
import { formatCurrency, formatDate } from '../shared/utils/formatters';

describe('API Client & Formatter Utilities Suite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should correctly store and retrieve access token in localStorage auth state', () => {
    expect(getAccessToken()).toBeNull();

    const mockToken = 'mock_jwt_access_token_12345';
    setAccessToken(mockToken);
    expect(getAccessToken()).toBe(mockToken);
  });

  it('should format VND currency accurately according to Vietnamese banking standards', () => {
    const formatted = formatCurrency(58500000);
    expect(formatted).toMatch(/58\.500\.000/);
    expect(formatted).toContain('₫');

    const zeroFormatted = formatCurrency(0);
    expect(zeroFormatted).toMatch(/0/);
    expect(zeroFormatted).toContain('₫');
  });

  it('should format Vietnamese date in dd/MM/yyyy format', () => {
    const testDate = '2026-11-16T10:00:00Z';
    const formatted = formatDate(testDate);
    expect(formatted).toBe('16/11/2026');
  });
});

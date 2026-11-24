/**
 * Format currency to Vietnamese Dong standard: e.g. "58.500.000 ₫"
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date to Vietnamese standard: dd/MM/yyyy
 */
export const formatDate = (dateString: any): string => {
  if (!dateString) return '—';
  if (typeof dateString === 'object' && !(dateString instanceof Date)) {
    return '—';
  }
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return typeof dateString === 'string' ? dateString : '—';
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '—';
  }
};

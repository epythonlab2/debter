// /utils/formatters.ts
/**
 * Standard Financial Number & Currency Formatters
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value || 0);
};

export const formatCurrency = (value: number, currencySymbol: string = 'ETB'): string => {
  return `${formatNumber(value)} ${currencySymbol}`;
};

export const formatDate = (d: Date): string => d.toISOString().split('T')[0];
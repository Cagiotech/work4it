/**
 * Utility functions for formatting numbers and currency in Portuguese format
 */

/**
 * Format a number to Portuguese currency format (1.234,56)
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  
  if (isNaN(num)) return '';
  
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format a number to Portuguese number format (1.234,56)
 */
export function formatNumber(value: number | string | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || value === '') return '';
  
  const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  
  if (isNaN(num)) return '';
  
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Parse a Portuguese formatted number string to a number
 */
export function parseCurrency(value: string): number {
  if (!value || value.trim() === '') return 0;
  
  // Remove thousand separators (dots) and replace decimal separator (comma) with dot
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  
  return isNaN(num) ? 0 : num;
}

/**
 * Parse a Portuguese formatted number string to a number or null
 */
export function parseNumber(value: string): number | null {
  if (!value || value.trim() === '') return null;
  
  // Remove thousand separators (dots) and replace decimal separator (comma) with dot
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  
  return isNaN(num) ? null : num;
}

/**
 * Format input value for currency/number fields while typing
 * Allows partial input like "1.", "1,", etc.
 */
export function formatCurrencyInput(value: string): string {
  // Allow empty string
  if (!value) return '';
  
  // Remove any character that is not a digit, comma, or dot
  let cleaned = value.replace(/[^\d,.-]/g, '');
  
  // Allow only one comma (decimal separator)
  const parts = cleaned.split(',');
  if (parts.length > 2) {
    cleaned = parts[0] + ',' + parts.slice(1).join('');
  }
  
  // Limit decimal places to 2
  if (parts.length === 2 && parts[1].length > 2) {
    cleaned = parts[0] + ',' + parts[1].substring(0, 2);
  }
  
  return cleaned;
}

/**
 * Format a date string (YYYY-MM-DD) to Portuguese format (DD/MM/YYYY)
 */
export function formatDatePT(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Parse a Portuguese date format (DD/MM/YYYY) to ISO format (YYYY-MM-DD)
 */
export function parseDatePT(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const [day, month, year] = dateString.split('/');
    if (!year || !month || !day) return dateString;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  } catch {
    return dateString;
  }
}

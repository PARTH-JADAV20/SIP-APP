/**
 * Formats a number as currency with proper Indian numbering system
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "₹1,23,456.78")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('₹', '₹');
};

/**
 * Formats a number as a percentage
 * @param value - The percentage value (e.g., 5.25 for 5.25%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string (e.g., "5.25%")
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

/**
 * Formats a large number with appropriate suffix (K, L, Cr)
 * @param num - The number to format
 * @returns Formatted string (e.g., "1.2L", "5.5Cr")
 */
export const formatCompactNumber = (num: number): string => {
  if (Math.abs(num) >= 10000000) {
    return (num / 10000000).toFixed(1) + 'Cr';
  }
  if (Math.abs(num) >= 100000) {
    return (num / 100000).toFixed(1) + 'L';
  }
  if (Math.abs(num) >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Formats a date to a readable string
 * @param date - Date object or date string
 * @param format - Format string (default: 'dd MMM yyyy')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string, format: string = 'dd MMM yyyy'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Simple formatter for common formats
  const pad = (n: number) => n < 10 ? `0${n}` : n.toString();
  
  const formats: Record<string, string> = {
    'yyyy': d.getFullYear().toString(),
    'MM': pad(d.getMonth() + 1),
    'dd': pad(d.getDate()),
    'MMM': d.toLocaleString('default', { month: 'short' }),
    'MMMM': d.toLocaleString('default', { month: 'long' }),
    'EEE': d.toLocaleString('default', { weekday: 'short' }),
    'EEEE': d.toLocaleString('default', { weekday: 'long' }),
  };
  
  return format.replace(/(yyyy|MMM+|M+|dd+|EEE+|'[^']*'|\[.*?\])/g, (match) => {
    return formats[match] || match;
  });
};

/**
 * Truncates text to a specified length and adds ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
};

/**
 * Converts a number to words (Indian number system)
 * @param num - The number to convert
 * @returns The number in words (e.g., "One Lakh Twenty Three Thousand Four Hundred Fifty Six")
 */
export const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  
  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const formatTens = (num: number): string => {
    if (num < 10) return single[num];
    if (num < 20) return double[num - 10];
    const ten = Math.floor(num / 10);
    return tens[ten] + (num % 10 ? ' ' + single[num % 10] : '');
  };
  
  const convert = (num: number): string => {
    if (num < 100) return formatTens(num);
    if (num < 1000) {
      const hundred = Math.floor(num / 100);
      return single[hundred] + ' Hundred' + (num % 100 ? ' and ' + formatTens(num % 100) : '');
    }
    if (num < 100000) {
      const thousand = Math.floor(num / 1000);
      return formatTens(thousand) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '');
    }
    if (num < 10000000) {
      const lakh = Math.floor(num / 100000);
      return formatTens(lakh) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '');
    }
    const crore = Math.floor(num / 10000000);
    return formatTens(crore) + ' Crore' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
  };
  
  return convert(num);
};

/**
 * Formats a duration in milliseconds to a human-readable string
 * @param ms - Duration in milliseconds
 * @returns Formatted duration (e.g., "2d 5h 30m")
 */
export const formatDuration = (ms: number): string => {
  if (ms < 0) return '0s';
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`);
  if (seconds > 0 && hours === 0 && days === 0) parts.push(`${seconds}s`);
  
  return parts.length > 0 ? parts.join(' ') : '0s';
};

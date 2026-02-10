/**
 * Date formatting utilities using en-GB locale (dd/MM/yyyy format)
 */

/**
 * Format a date string or Date object to en-GB format (dd/MM/yyyy)
 * @param date Date string or Date object
 * @param includeTime Whether to include time (HH:mm)
 * @returns Formatted date string in en-GB format
 */
export function formatDate(date: string | Date, includeTime: boolean = false): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = false;
  }

  return dateObj.toLocaleDateString('en-GB', options);
}

/**
 * Format a date to en-GB with time (dd/MM/yyyy HH:mm)
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, true);
}

/**
 * Format a date to short en-GB format (dd/MM/yy)
 */
export function formatDateShort(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-GB', {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
}

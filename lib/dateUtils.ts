/**
 * Date Utility Functions for Session Management
 * 
 * This utility provides functions to handle date conversions between
 * frontend and backend for session data.
 */

/**
 * Converts a Date object to ISO string format for API requests
 * @param date The Date object to convert
 * @returns ISO string representation of the date
 */
export function dateToISOString(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString();
}

/**
 * Validates a date string and converts it to a Date object
 * @param dateString The date string to validate and convert
 * @returns A valid Date object or null if invalid
 */
export function validateAndParseDate(dateString: string): Date | null {
  if (!dateString) return null;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
}

/**
 * Checks if a date is in the future
 * @param date The date to check
 * @returns True if the date is in the future, false otherwise
 */
export function isDateInFuture(date: Date): boolean {
  const now = new Date();
  return date > now;
}

/**
 * Formats a date for display in the UI
 * @param date The date to format
 * @param includeTime Whether to include the time in the formatted string
 * @returns Formatted date string
 */
export function formatDateForDisplay(date: Date | null, includeTime: boolean = false): string {
  if (!date) return 'N/A';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
}
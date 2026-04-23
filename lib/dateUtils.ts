/**
 * Date utility functions to handle timezone-safe date formatting
 */

/**
 * Formats an ISO date string (YYYY-MM-DD) to a localized date string
 * without timezone issues.
 *
 * @param dateString - ISO date string in format YYYY-MM-DD
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string
 */
export function formatDateSafe(
  dateString: string,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
): string {
  if (!dateString) return "";

  // Parse the date string correctly to avoid timezone issues
  // When using new Date(dateString) with ISO format, JavaScript treats it as UTC
  // which can shift dates backwards when converting to local time
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-US", options);
}

/**
 * Formats an ISO date string to include year
 *
 * @param dateString - ISO date string in format YYYY-MM-DD
 * @returns Formatted date string with year
 */
export function formatDateWithYear(dateString: string): string {
  return formatDateSafe(dateString, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats an ISO date string to full format with weekday
 *
 * @param dateString - ISO date string in format YYYY-MM-DD
 * @returns Formatted date string with weekday
 */
export function formatDateFull(dateString: string): string {
  return formatDateSafe(dateString, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

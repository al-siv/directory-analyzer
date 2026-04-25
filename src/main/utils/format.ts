/**
 * Formatting utilities.
 *
 * @description Human-readable size and percentage formatting.
 *              Behavior must match Python v1.2.1 exactly.
 *
 * @module main/utils/format
 */

export { bytesToHumanReadable, formatPercentage } from '@shared/utils/format';

/**
 * Truncate a file path for display, keeping the beginning and end.
 *
 * @param path - Absolute or relative path.
 * @param maxLength - Maximum number of characters. Default 80.
 * @returns Truncated path with "..." in the middle if needed.
 */
export function formatPathForDisplay(path: string, maxLength = 80): string {
  if (path.length <= maxLength) {
    return path;
  }
  const startLen = Math.floor(maxLength / 2) - 3;
  const endLen = maxLength - startLen - 3;
  return `${path.slice(0, startLen)}...${path.slice(-endLen)}`;
}

/**
 * Create a properly pluralized string.
 *
 * @param count - Number to check.
 * @param singular - Singular form.
 * @param plural - Plural form. Defaults to singular + 's'.
 * @returns Pluralized phrase.
 *
 * @example
 * pluralize(1, 'file')   // "1 file"
 * pluralize(5, 'file')   // "5 files"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const resolvedPlural = plural ?? `${singular}s`;
  return `${String(count)} ${count === 1 ? singular : resolvedPlural}`;
}

/**
 * Formatting utilities.
 *
 * @description Human-readable size and percentage formatting.
 *              Behavior must match Python v1.2.1 exactly.
 *
 * @module main/utils/format
 */

import { BYTES_PER_KB, MINIMUM_PERCENTAGE_DISPLAY } from '@shared/constants'

/**
 * Convert a byte count to a human-readable string.
 *
 * @description Uses binary prefixes (1 KiB = 1024 B). This mirrors the
 *              Python `bytes_to_human_readable` implementation.
 * @param sizeBytes - Size in bytes. Must be >= 0.
 * @returns Formatted string, e.g. "0 B", "1.5 GB".
 * @precondition sizeBytes >= 0
 * @postcondition Returns a non-empty string with a valid unit suffix.
 * @throws {RangeError} If sizeBytes is negative.
 *
 * @example
 * bytesToHumanReadable(0)           // "0 B"
 * bytesToHumanReadable(1024)        // "1.0 KB"
 * bytesToHumanReadable(1610612736)  // "1.5 GB"
 */
export function bytesToHumanReadable(sizeBytes: number): string {
  if (sizeBytes < 0) {
    throw new RangeError('sizeBytes must be >= 0')
  }

  if (sizeBytes === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = Number(sizeBytes)

  for (const unit of units) {
    if (size < BYTES_PER_KB) {
      if (unit === 'B') {
        return `${Math.floor(size)} ${unit}`
      }
      return `${size.toFixed(1)} ${unit}`
    }
    size /= BYTES_PER_KB
  }

  return `${size.toFixed(1)} PB`
}

/**
 * Format a percentage value for display.
 *
 * @description Values below MINIMUM_PERCENTAGE_DISPLAY are rendered as
 *              "<0.01%" to avoid cluttering the UI with tiny numbers.
 * @param percentage - Percentage value (0-100).
 * @returns Formatted percentage string.
 *
 * @example
 * formatPercentage(18.145)  // "18.15%"
 * formatPercentage(0.005)   // "<0.01%"
 */
export function formatPercentage(percentage: number): string {
  if (percentage < MINIMUM_PERCENTAGE_DISPLAY) {
    return `<${MINIMUM_PERCENTAGE_DISPLAY.toFixed(2)}%`
  }
  return `${percentage.toFixed(2)}%`
}

/**
 * Truncate a file path for display, keeping the beginning and end.
 *
 * @param path - Absolute or relative path.
 * @param maxLength - Maximum number of characters. Default 80.
 * @returns Truncated path with "..." in the middle if needed.
 */
export function formatPathForDisplay(path: string, maxLength = 80): string {
  if (path.length <= maxLength) {
    return path
  }
  const startLen = Math.floor(maxLength / 2) - 3
  const endLen = maxLength - startLen - 3
  return `${path.slice(0, startLen)}...${path.slice(-endLen)}`
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
  const resolvedPlural = plural ?? `${singular}s`
  return `${count} ${count === 1 ? singular : resolvedPlural}`
}

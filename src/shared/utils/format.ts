/**
 * Shared formatting utilities usable in both main and renderer processes.
 *
 * @module shared/utils/format
 */

import { BYTES_PER_KB, MINIMUM_PERCENTAGE_DISPLAY } from '@shared/constants';

/**
 * Convert a byte count to a human-readable string.
 *
 * @description Uses binary prefixes (1 KiB = 1024 B).
 * @param sizeBytes - Size in bytes. Must be >= 0.
 * @returns Formatted string, e.g. "0 B", "1.5 GB".
 * @throws {RangeError} If sizeBytes is negative.
 */
export function bytesToHumanReadable(sizeBytes: number): string {
  if (sizeBytes < 0) {
    throw new RangeError('sizeBytes must be >= 0');
  }

  if (sizeBytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = Number(sizeBytes);

  for (const unit of units) {
    if (size < BYTES_PER_KB) {
      if (unit === 'B') {
        return `${String(Math.floor(size))} ${unit}`;
      }
      return `${size.toFixed(1)} ${unit}`;
    }
    size /= BYTES_PER_KB;
  }

  return `${size.toFixed(1)} PB`;
}

/**
 * Format a percentage value for display.
 *
 * @description Values below MINIMUM_PERCENTAGE_DISPLAY are rendered as
 *              "<0.01%" to avoid cluttering the UI with tiny numbers.
 * @param percentage - Percentage value (0-100).
 * @returns Formatted percentage string.
 */
export function formatPercentage(percentage: number): string {
  if (percentage < MINIMUM_PERCENTAGE_DISPLAY) {
    return `<${MINIMUM_PERCENTAGE_DISPLAY.toFixed(2)}%`;
  }
  return `${percentage.toFixed(2)}%`;
}

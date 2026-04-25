/**
 * Shared constants for Directory Analyzer.
 *
 * @module shared/constants
 */

/** Number of bytes in one kibibyte. */
export const BYTES_PER_KB = 1024;

/** Smallest percentage that is rendered explicitly. Values below this are shown as "<0.01%". */
export const MINIMUM_PERCENTAGE_DISPLAY = 0.01;

/** Update progress every N items when total is unknown. */
export const PROGRESS_UPDATE_FREQUENCY = 1000;

/** Report progress every N percent when total is known. */
export const PROGRESS_PERCENTAGE_INTERVAL = 5;

/** Default number of top directories shown. */
export const DEFAULT_TOP_COUNT = 50;

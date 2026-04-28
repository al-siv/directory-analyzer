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

/** Maximum number of concurrent scan tasks. Uses CPU count as upper bound. */
export const MIN_SCAN_WORKERS = 1;

/** Hard timeout for a single scan, in milliseconds. */
export const SCAN_TIMEOUT_MS = 30 * 60 * 1000;

/** Maximum directory depth traversed by the scanner. */
export const MAX_SCAN_DEPTH = 50;

/** Hard cap on discovered directories to avoid unbounded memory growth. */
export const MAX_SCAN_DIRECTORIES = 1_000_000;

/** Hard cap on file records retained for aggregate category statistics. */
export const MAX_SCAN_FILE_RECORDS = 1_000_000;

/** Number of result rows rendered per page in the GUI. */
export const RESULTS_TABLE_PAGE_SIZE = 100;

/** Number of files shown in directory details before truncation. */
export const DIRECTORY_DETAIL_FILE_LIMIT = 200;

/** Default main window width in pixels. */
export const DEFAULT_WINDOW_WIDTH = 1280;

/** Default main window height in pixels. */
export const DEFAULT_WINDOW_HEIGHT = 800;

/** Minimum main window width in pixels. */
export const MIN_WINDOW_WIDTH = 900;

/** Minimum main window height in pixels. */
export const MIN_WINDOW_HEIGHT = 600;

/** Windows hidden file attribute bitmask. */
export const WINDOWS_FILE_ATTRIBUTE_HIDDEN = 0x00000002;

/** Windows `GetFileAttributesW` invalid result value. */
export const WINDOWS_INVALID_FILE_ATTRIBUTES = 0xffffffff;

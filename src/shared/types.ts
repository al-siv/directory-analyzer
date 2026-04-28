/**
 * Shared types for Directory Analyzer.
 *
 * These interfaces are used by both the main process (Node.js)
 * and the renderer process (Chromium). They must remain environment-agnostic.
 *
 * @module shared/types
 */

/**
 * Output format for scan results export.
 */
export type OutputFormat = 'text' | 'csv' | 'json';

/**
 * Configuration options for a directory scan.
 *
 * @description Mirrors Python ScanOptions dataclass. All paths are strings
 *              because Pathlib does not exist in the renderer process.
 *
 * @see {@link validateScanOptions} in src/main/ipc/handlers.ts for runtime validation.
 * @see {@link useScan.startScan} in src/renderer/hooks/useScan.ts for UI trigger.
 */
export interface ScanOptions {
  /** Absolute path to the root directory to scan. */
  targetPath: string;

  /** Whether to include hidden directories. Default true. */
  includeHidden: boolean;

  /** Minimum size threshold in bytes for a directory to be included. */
  minSizeBytes: number;

  /** Maximum number of top directories to display. */
  topCount: number;

  /** Export format (deprecated in scan context; used only for export). */
  outputFormat?: OutputFormat;

  /** Optional set of extensions to filter by (e.g. [".jpg", ".png"]). */
  extensionFilter: string[] | null;
}

/**
 * Information about a single scanned directory.
 *
 * @description Represents the total size of **direct files only**,
 *              excluding subdirectories.
 */
export interface DirectoryInfo {
  /** Absolute path to the directory. */
  path: string;

  /** Total size of direct files in bytes. */
  sizeBytes: number;

  /** Number of direct files. */
  fileCount: number;

  /** Unix timestamp (ms) when the directory was scanned. */
  lastScanned: number;

  /** Error message if scanning failed, otherwise null. */
  errorMessage: string | null;

  /** Files found directly in this directory (after filter). */
  files: readonly FileInfo[];

  /** Category -> total size in bytes for this directory. */
  categoryBreakdown: Readonly<Record<string, number>>;

  /** Dominant category by size, or null if no files. */
  dominantCategory: string | null;
}

/**
 * Information about a single file for classification.
 */
export interface FileInfo {
  /** Absolute path to the file. */
  path: string;

  /** File size in bytes. */
  sizeBytes: number;

  /** Normalized extension (lowercase, with leading dot). */
  extension: string;

  /** Content category (e.g. "images", "videos"). */
  category: string;

  /** MIME type if available. */
  mimeType: string | null;
}

/**
 * Comprehensive statistics for an entire scan operation.
 */
export interface ScanStatistics {
  /** Total number of directories processed. */
  totalDirectories: number;

  /** Total number of files found. */
  totalFiles: number;

  /** Total size of all files in bytes. */
  totalSizeBytes: number;

  /** Scan duration in seconds. */
  scanDuration: number;

  /** Mapping category -> total size in bytes. */
  categoryBreakdown: Record<string, number>;

  /** Mapping category -> file count. */
  fileCountByCategory: Record<string, number>;
}

/**
 * Result of a completed scan.
 *
 * @see {@link exportResults} in src/main/core/exporter.ts for export consumers.
 * @see {@link useScanStore} in src/renderer/store/scanStore.ts for UI state.
 */
export interface ScanResult {
  /** All scanned directories sorted by size descending. */
  directories: readonly DirectoryInfo[];

  /** Total number of directories scanned. */
  totalScanned: number;

  /** Number of directories that could not be accessed. */
  errorCount: number;

  /** Paths of directories that could not be accessed. */
  accessErrors: readonly string[];

  /** Scan duration in seconds. */
  scanDuration: number;

  /** Options used for this scan. */
  scanOptions: ScanOptions;

  /** Aggregated statistics. */
  statistics: ScanStatistics;
}

/**
 * Real-time progress update sent from main to renderer during scanning.
 */
export interface ScanProgressUpdate {
  /** Number of directories processed so far. */
  current: number;

  /** Total number of directories discovered (may be 0 if unknown). */
  total: number;

  /** Path currently being scanned (when verbose). */
  currentPath: string;
}

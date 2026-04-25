/**
 * Directory scanning engine.
 *
 * @description Ported from Python `scanner.py`. Scans directories,
 *              classifies files, and aggregates statistics.
 *
 * @module main/core/scanner
 */

import { join } from 'path';
import { realpath } from 'fs/promises';
import type {
  DirectoryInfo,
  FileInfo,
  ScanOptions,
  ScanResult,
  ScanStatistics,
} from '@shared/types';
import { ContentClassifier } from './classifier';
import {
  isAccessibleDirectory,
  getDirectFiles,
  safeGetFileSize,
  getSubdirectories,
} from '@main/utils/fs';
import { ProgressReporter } from '@main/utils/progress';
import { cpus } from 'os';

/** Maximum concurrent async tasks for parallel scanning. */
const MAX_WORKERS = Math.max(1, cpus().length);

interface ScanDirectoryResult {
  dirInfo: DirectoryInfo;
  files: FileInfo[];
}

/**
 * Thrown when a scan is cancelled by the user.
 */
export class ScanCancelledError extends Error {
  constructor() {
    super('Scan cancelled by user');
    this.name = 'ScanCancelledError';
  }
}

/**
 * Orchestrates directory traversal, file classification, and result aggregation.
 */
export class DirectoryScanner {
  private static readonly SCAN_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private static readonly MAX_FILES_LIMIT = 1_000_000;

  private readonly options: ScanOptions;
  private readonly classifier: ContentClassifier;
  private readonly errorDirectories: string[] = [];
  private readonly allFiles: FileInfo[] = [];
  private totalDirectories = 0;
  private totalFiles = 0;
  private totalSize = 0;
  private abortController: AbortController | null = null;
  private scanTimeoutId: NodeJS.Timeout | null = null;

  constructor(options: ScanOptions) {
    this.options = options;
    this.classifier = new ContentClassifier();
  }

  /**
   * Perform a complete scan and return a populated ScanResult.
   *
   * @param useParallel - Whether to process directories concurrently.
   * @param onProgress - Optional callback invoked with progress updates.
   * @returns ScanResult with sorted directories and statistics.
   * @throws {ScanCancelledError} If the scan is aborted.
   */
  async scan(
    useParallel = true,
    onProgress?: (current: number, total: number) => void
  ): Promise<ScanResult> {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;
    this.scanTimeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, DirectoryScanner.SCAN_TIMEOUT_MS);

    const startTime = Date.now();

    try {
      const allDirPaths = await this.collectAllDirectories(this.options.targetPath, signal);
      this.totalDirectories = allDirPaths.length;

      const reporter = new ProgressReporter(allDirPaths.length, 'Scanning', onProgress ?? null);

      let results: DirectoryInfo[];

      if (useParallel && allDirPaths.length > 1) {
        results = await this.scanParallel(allDirPaths, reporter, signal);
      } else {
        results = await this.scanSequential(allDirPaths, reporter, signal);
      }

      reporter.finish();

      results.sort((a, b) => b.sizeBytes - a.sizeBytes);
      results = results.slice(0, this.options.topCount);

      const duration = (Date.now() - startTime) / 1000;
      const statistics = this.createScanStatistics(results, duration);

      return {
        directories: results,
        totalScanned: this.totalDirectories,
        errorCount: this.errorDirectories.length,
        accessErrors: [...this.errorDirectories],
        scanDuration: duration,
        scanOptions: this.options,
        statistics,
      };
    } catch (err) {
      if (err instanceof ScanCancelledError) {
        throw err;
      }
      throw new Error(`Scan failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      clearTimeout(this.scanTimeoutId);
      this.scanTimeoutId = null;
      this.abortController = null;
    }
  }

  /**
   * Cancel an in-flight scan.
   */
  cancel(): void {
    this.abortController?.abort();
  }

  /**
   * Collect every directory under the root iteratively (avoids stack overflow).
   */
  private async collectAllDirectories(
    rootPath: string,
    signal: AbortSignal,
    maxDepth = 50,
    maxDirectories = 1_000_000
  ): Promise<string[]> {
    const dirs: string[] = [rootPath];
    const stack: Array<{ path: string; depth: number }> = [{ path: rootPath, depth: 0 }];
    const visited = new Set<string>();

    while (stack.length > 0) {
      if (signal.aborted) {
        throw new ScanCancelledError();
      }

      if (dirs.length >= maxDirectories) {
        break;
      }

      const item = stack.pop();
      if (!item) break;
      const { path: current, depth } = item;
      if (depth >= maxDepth) {
        continue;
      }

      try {
        const subdirs = await getSubdirectoryPaths(current, this.options.includeHidden);
        for (const sub of subdirs) {
          const full = join(current, sub);
          try {
            const realFull = await realpath(full);
            if (visited.has(realFull)) {
              continue;
            }
            visited.add(realFull);
          } catch {
            // If realpath fails, fall back to the raw path and continue.
          }
          dirs.push(full);
          stack.push({ path: full, depth: depth + 1 });
        }
      } catch {
        this.errorDirectories.push(current);
      }
    }

    return dirs;
  }

  /**
   * Scan directories one at a time.
   */
  private async scanSequential(
    dirPaths: string[],
    reporter: ProgressReporter,
    signal: AbortSignal
  ): Promise<DirectoryInfo[]> {
    const results: DirectoryInfo[] = [];

    for (const dirPath of dirPaths) {
      if (signal.aborted) {
        throw new ScanCancelledError();
      }

      const { dirInfo } = await this.scanSingleDirectory(dirPath);
      if (dirInfo.sizeBytes >= this.options.minSizeBytes) {
        results.push(dirInfo);
      }
      reporter.update();
    }

    return results;
  }

  /**
   * Scan directories with limited concurrency.
   *
   * @description Uses an async task pool instead of Worker Threads because
   *              filesystem scanning is I/O-bound. Node.js async I/O is
   *              already non-blocking; Worker Threads add overhead without
   *              benefit for this workload.
   */
  private async scanParallel(
    dirPaths: string[],
    reporter: ProgressReporter,
    signal: AbortSignal
  ): Promise<DirectoryInfo[]> {
    const results: DirectoryInfo[] = [];
    const queue = [...dirPaths];
    const inFlight = new Set<Promise<void>>();

    const processOne = async (dirPath: string): Promise<void> => {
      if (signal.aborted) {
        throw new ScanCancelledError();
      }
      const { dirInfo } = await this.scanSingleDirectory(dirPath);
      if (dirInfo.sizeBytes >= this.options.minSizeBytes) {
        results.push(dirInfo);
      }
      reporter.update();
    };

    while (queue.length > 0 || inFlight.size > 0) {
      if (signal.aborted) {
        throw new ScanCancelledError();
      }

      while (inFlight.size < MAX_WORKERS && queue.length > 0) {
        const dirPath = queue.shift();
        if (!dirPath) break;
        const task = processOne(dirPath).finally(() => {
          inFlight.delete(task);
        });
        inFlight.add(task);
      }

      if (inFlight.size >= MAX_WORKERS || queue.length === 0) {
        await Promise.race(inFlight);
      }
    }

    return results;
  }

  /**
   * Scan a single directory: sum direct file sizes, classify files, apply filters.
   */
  private async scanSingleDirectory(dirPath: string): Promise<ScanDirectoryResult> {
    const scanTime = Date.now();

    const isAccessible = await isAccessibleDirectory(dirPath);
    if (!isAccessible) {
      this.errorDirectories.push(dirPath);
      return {
        dirInfo: {
          path: dirPath,
          sizeBytes: 0,
          fileCount: 0,
          lastScanned: scanTime,
          errorMessage: 'Permission denied or directory inaccessible',
          files: [],
          categoryBreakdown: {},
          dominantCategory: null,
        },
        files: [],
      };
    }

    let totalSize = 0;
    let fileCount = 0;
    const directoryFiles: FileInfo[] = [];

    try {
      for await (const fileName of getDirectFiles(dirPath)) {
        const filePath = join(dirPath, fileName);
        const extension = getExtension(fileName);

        if (this.options.extensionFilter !== null && this.options.extensionFilter.length > 0) {
          if (!this.options.extensionFilter.includes(extension)) {
            continue;
          }
        }

        const fileSize = await safeGetFileSize(filePath);
        totalSize += fileSize;
        fileCount += 1;

        const fileInfo = this.classifier.classifyFileWithInfo(filePath, fileSize);
        directoryFiles.push(fileInfo);
        if (this.allFiles.length < DirectoryScanner.MAX_FILES_LIMIT) {
          this.allFiles.push(fileInfo);
        }
        this.totalFiles += 1;
        this.totalSize += fileSize;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.errorDirectories.push(dirPath);
      return {
        dirInfo: {
          path: dirPath,
          sizeBytes: 0,
          fileCount: 0,
          lastScanned: scanTime,
          errorMessage: msg,
          files: [],
          categoryBreakdown: {},
          dominantCategory: null,
        },
        files: [],
      };
    }

    const categoryBreakdown: Record<string, number> = {};
    let dominantCategory: string | null = null;
    let dominantSize = 0;

    for (const f of directoryFiles) {
      categoryBreakdown[f.category] = (categoryBreakdown[f.category] ?? 0) + f.sizeBytes;
      if (categoryBreakdown[f.category] > dominantSize) {
        dominantSize = categoryBreakdown[f.category];
        dominantCategory = f.category;
      }
    }

    return {
      dirInfo: {
        path: dirPath,
        sizeBytes: totalSize,
        fileCount,
        lastScanned: scanTime,
        errorMessage: null,
        files: directoryFiles,
        categoryBreakdown,
        dominantCategory,
      },
      files: directoryFiles,
    };
  }

  /**
   * Build aggregate statistics from the collected file data.
   */
  private createScanStatistics(_results: DirectoryInfo[], duration: number): ScanStatistics {
    return {
      totalDirectories: this.totalDirectories,
      totalFiles: this.totalFiles,
      totalSizeBytes: this.totalSize,
      scanDuration: duration,
      categoryBreakdown: this.classifier.getCategoryStatistics(this.allFiles),
      fileCountByCategory: this.classifier.getFileCountByCategory(this.allFiles),
    };
  }
}

/**
 * Helper: get normalized extension from a file name.
 */
function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : '';
}

/**
 * Helper: list subdirectory names in a directory.
 */
async function getSubdirectoryPaths(parent: string, includeHidden: boolean): Promise<string[]> {
  const names: string[] = [];
  for await (const name of getSubdirectories(parent, includeHidden)) {
    names.push(name);
  }
  return names;
}

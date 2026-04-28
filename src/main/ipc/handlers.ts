/**
 * IPC handlers for the main process.
 *
 * @description Bridges renderer requests to core logic. Validates all
 *              inputs before filesystem access.
 *
 * @module main/ipc/handlers
 */

import { ipcMain, dialog, BrowserWindow, shell } from 'electron';
import { IPC_CHANNELS } from '@shared/ipc-channels';
import type { ScanOptions } from '@shared/types';
import { z } from 'zod';
import { ScanOptionsSchema, ScanResultSchema, OutputFormatSchema } from '@shared/schemas';
import { DirectoryScanner, ScanCancelledError } from '@main/core/scanner';
import { exportResults } from '@main/core/exporter';
import { resolve, isAbsolute, normalize } from 'path';
import { stat } from 'fs/promises';
import { createScanLogger, generateSessionId } from '@main/utils/logger';

let activeScanner: DirectoryScanner | null = null;
let activeScanId: string | null = null;

/**
 * Register all IPC handlers.
 *
 * @description Must be called once after the app is ready and before
 *              any renderer windows are created.
 */
export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.SCAN_START, async (event, options: ScanOptions) => {
    if (activeScanner !== null) {
      return { success: false, error: 'A scan is already in progress' };
    }

    const validated = await validateScanOptions(options);
    activeScanner = new DirectoryScanner(validated);

    const sessionId = generateSessionId();
    activeScanId = sessionId;
    const scanLogger = createScanLogger(sessionId);
    scanLogger.info('scan:start', { targetPath: validated.targetPath, options: validated });

    const window = BrowserWindow.fromWebContents(event.sender);

    try {
      const result = await activeScanner.scan(true, (current, total, currentPath) => {
        if (activeScanId !== sessionId) {
          return;
        }
        if (!window || window.isDestroyed()) {
          activeScanner?.cancel();
          return;
        }
        window.webContents.send(IPC_CHANNELS.SCAN_PROGRESS, {
          current,
          total,
          currentPath: currentPath ?? '',
        });
      });

      scanLogger.info('scan:complete', {
        totalDirectories: result.statistics.totalDirectories,
        totalFiles: result.statistics.totalFiles,
        duration: result.scanDuration,
      });
      return { success: true, result };
    } catch (err) {
      if (err instanceof ScanCancelledError) {
        scanLogger.warn('scan:cancelled', {
          reason: err.reason,
          processedDirectories: err.processedDirectories,
          elapsedMs: err.elapsedMs,
        });
        return { success: false, cancelled: true, error: 'Scan cancelled by user' };
      }
      scanLogger.error('scan:failed', { error: err instanceof Error ? err.message : String(err) });
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    } finally {
      if (activeScanId === sessionId) {
        activeScanner = null;
        activeScanId = null;
      }
    }
  });

  ipcMain.handle(IPC_CHANNELS.SCAN_CANCEL, () => {
    activeScanner?.cancel();
    return { success: true };
  });

  ipcMain.handle(IPC_CHANNELS.EXPORT_RESULTS, async (_event, payload: unknown) => {
    const parsed = z
      .object({
        result: ScanResultSchema,
        format: OutputFormatSchema,
      })
      .safeParse(payload);

    if (!parsed.success) {
      return { success: false, error: 'Invalid export payload' };
    }

    const { result, format } = parsed.data;

    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      return { success: false, error: 'No focused window' };
    }

    const { filePath } = await dialog.showSaveDialog(win, {
      defaultPath: `results.${format}`,
      filters: [{ name: format.toUpperCase(), extensions: [format] }],
    });

    if (!filePath) {
      return { success: false, cancelled: true };
    }

    try {
      await exportResults(result, format, filePath);
      return { success: true, filePath };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  });

  ipcMain.handle(IPC_CHANNELS.SHOW_OPEN_DIALOG, async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      return { success: false, path: undefined };
    }

    const { filePaths } = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
    });

    if (filePaths.length === 0) {
      return { success: false, path: undefined };
    }

    return { success: true, path: filePaths[0] };
  });

  ipcMain.handle(IPC_CHANNELS.OPEN_PATH, async (_event, dirPath: string) => {
    if (typeof dirPath !== 'string' || dirPath.length === 0) {
      return { success: false, error: 'Invalid path' };
    }
    if (!isAbsolute(dirPath)) {
      return { success: false, error: 'Path must be absolute' };
    }
    if (dirPath.includes('://')) {
      return { success: false, error: 'URLs are not allowed' };
    }

    try {
      const s = await stat(dirPath);
      if (!s.isDirectory()) {
        return { success: false, error: 'Path is not a directory' };
      }
    } catch {
      return { success: false, error: 'Path does not exist or is inaccessible' };
    }

    const error = await shell.openPath(dirPath);
    return { success: error === '', error: error || undefined };
  });
}

/**
 * Validate and sanitize ScanOptions received from the renderer.
 *
 * @description Prevents path traversal by resolving paths and ensuring
 *              they stay within allowed boundaries.
 * @param options - Raw options from the renderer.
 * @returns Sanitized ScanOptions.
 * @throws {Error} If validation fails.
 */
export async function validateScanOptions(options: unknown): Promise<ScanOptions> {
  const parsed = ScanOptionsSchema.parse(options);

  const targetPath = resolve(normalize(parsed.targetPath));

  if (!isAbsolute(targetPath)) {
    throw new Error('targetPath must be absolute');
  }

  try {
    const st = await stat(targetPath);
    if (!st.isDirectory()) {
      throw new Error('targetPath must be a directory');
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'targetPath must be a directory') {
      throw err;
    }
    throw new Error('targetPath does not exist or is inaccessible');
  }

  return {
    ...parsed,
    targetPath,
    minSizeBytes: Math.max(0, Math.floor(parsed.minSizeBytes)),
    topCount: Math.max(1, Math.floor(parsed.topCount)),
    extensionFilter:
      parsed.extensionFilter?.map(e => {
        const lower = e.toLowerCase();
        return lower.startsWith('.') ? lower : `.${lower}`;
      }) ?? null,
  };
}
